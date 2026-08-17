using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Application.Orders;

public sealed class CartService(IShoppingCartRepository carts, ICustomerRepository customers,
    ICatalogGateway catalog, IUnitOfWork unitOfWork, IClock clock)
{
    public async Task<CartResult> GetAsync(Guid customerId, string locale = "pt", CancellationToken cancellationToken = default)
    {
        await EnsureCustomer(customerId, cancellationToken);
        var cart = await carts.FindAsync(customerId, cancellationToken);
        return await MapAsync(cart, locale, cancellationToken);
    }

    public async Task<CartResult> AddAsync(Guid customerId, AddCartItemCommand command, string locale = "pt", CancellationToken cancellationToken = default)
    {
        await EnsureCustomer(customerId, cancellationToken);
        var type = ParseType(command.ItemType);
        var reference = CommerceItemReference.Create(command.Reference);
        var product = await catalog.FindAsync(type, reference, locale, cancellationToken)
            ?? throw new CommerceException("product_not_found", "Produto não encontrado.");
        ValidateItem(product, command.VariantId, command.Quantity);
        var cart = await carts.FindAsync(customerId, cancellationToken);
        if (cart is null) { cart = ShoppingCart.Create(customerId, clock.UtcNow); carts.Add(cart); }
        cart.Add(type, reference, command.VariantId, command.VariantLabel ?? ResolveVariant(product, command.VariantId)?.Label, command.Quantity, clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await MapAsync(cart, locale, cancellationToken);
    }

    public async Task<CartResult> MergeAsync(Guid customerId, IReadOnlyList<MergeCartItem> items, string locale = "pt", CancellationToken cancellationToken = default)
    {
        await EnsureCustomer(customerId, cancellationToken);

        var prepared = new Dictionary<string, (CommerceItemType Type, CommerceItemReference Reference,
            string? VariantId, string? VariantLabel, int Quantity)>(StringComparer.OrdinalIgnoreCase);

        foreach (var item in items.Take(50))
        {
            var type = ParseType(item.ItemType);
            var reference = CommerceItemReference.Create(item.Reference);
            var quantity = Math.Clamp(item.Quantity, 1, 99);
            var catalogItem = await catalog.FindAsync(type, reference, locale, cancellationToken)
                ?? throw new CommerceException("product_not_found", "Produto não encontrado.");
            ValidateItem(catalogItem, item.VariantId, quantity);
            var variantLabel = item.VariantLabel ?? ResolveVariant(catalogItem, item.VariantId)?.Label;
            var key = $"{type}:{reference.Value}:{item.VariantId ?? string.Empty}";
            prepared[key] = (type, reference, item.VariantId, variantLabel, quantity);
        }

        var cart = await carts.FindAsync(customerId, cancellationToken);
        if (cart is null)
        {
            cart = ShoppingCart.Create(customerId, clock.UtcNow);
            carts.Add(cart);
        }

        var now = clock.UtcNow;
        foreach (var item in prepared.Values)
            cart.Synchronize(item.Type, item.Reference, item.VariantId, item.VariantLabel, item.Quantity, now);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await MapAsync(cart, locale, cancellationToken);
    }

    public async Task<CartResult> SetQuantityAsync(Guid customerId, Guid itemId, int quantity, string locale = "pt", CancellationToken cancellationToken = default)
    {
        var cart = await RequireCart(customerId, cancellationToken);
        cart.SetQuantity(itemId, quantity, clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await MapAsync(cart, locale, cancellationToken);
    }

    public async Task<CartResult> RemoveAsync(Guid customerId, Guid itemId, string locale = "pt", CancellationToken cancellationToken = default)
    {
        var cart = await RequireCart(customerId, cancellationToken);
        cart.Remove(itemId, clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await MapAsync(cart, locale, cancellationToken);
    }

    public async Task ClearAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var cart = await carts.FindAsync(customerId, cancellationToken);
        if (cart is null) return;
        cart.Clear(clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<CartResult> MapAsync(ShoppingCart? cart, string locale, CancellationToken cancellationToken)
    {
        if (cart is null) return new(null, [], 0, 0);
        var results = new List<CartItemResult>();
        foreach (var item in cart.Items)
        {
            var product = await catalog.FindAsync(item.ItemType, item.Reference, locale, cancellationToken);
            results.Add(new(item.Id, item.ItemType.ToString().ToLowerInvariant(), item.Reference.Value, product?.Name ?? item.Reference.Value,
                item.VariantId, item.VariantLabel, item.Quantity, product?.AoaPrice ?? 0,
                product?.EurPrice ?? 0, product?.IsAvailable == true, product?.Stock, product?.ImageUrl));
        }
        return new(cart.Id, results, results.Sum(i => i.AoaPrice * i.Quantity), results.Sum(i => i.EurPrice * i.Quantity));
    }

    private async Task EnsureCustomer(Guid customerId, CancellationToken token)
    {
        var customer = await customers.FindByIdAsync(customerId, token);
        if (customer is null || !customer.IsActive) throw new CommerceException("customer_unavailable", "Cliente indisponível.");
    }

    private async Task<ShoppingCart> RequireCart(Guid customerId, CancellationToken token) =>
        await carts.FindAsync(customerId, token) ?? throw new CommerceException("cart_not_found", "Carrinho não encontrado.");

    internal static void ValidateItem(CatalogItem product, string? variantId, int quantity)
    {
        if (!product.IsAvailable) throw new CommerceException("product_unavailable", $"{product.Name} não está disponível.");
        if (product.Stock is not null && quantity > product.Stock) throw new CommerceException("insufficient_stock", $"Stock insuficiente para {product.Name}.");
        if (!string.IsNullOrWhiteSpace(variantId) && ResolveVariant(product, variantId) is null)
            throw new CommerceException("invalid_variant", "O tamanho selecionado não está disponível.");
    }

    private static CatalogVariant? ResolveVariant(CatalogItem product, string? variantId) =>
        string.IsNullOrWhiteSpace(variantId) ? null : product.Variants?.FirstOrDefault(v => v.Id == variantId);

    internal static CommerceItemType ParseType(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        null or "" or "product" => CommerceItemType.Product,
        "kit" => CommerceItemType.Kit,
        "collection" => CommerceItemType.Collection,
        _ => throw new CommerceException("invalid_item_type", "O tipo do item comercial é inválido.")
    };
}
