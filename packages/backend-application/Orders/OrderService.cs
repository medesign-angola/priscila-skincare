using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Application.Orders;

public sealed class OrderService(IOrderRepository orders, IShoppingCartRepository carts,
    ICustomerRepository customers, ICustomerAddressRepository addresses, ICatalogGateway catalog,
    IOrderProjection projection, IUnitOfWork unitOfWork, IClock clock)
{
    public async Task<CheckoutPreviewResult> PreviewAsync(Guid customerId, CheckoutPreviewRequest request, CancellationToken cancellationToken = default)
    {
        var (_, address, cart) = await Context(customerId, request.AddressId, cancellationToken);
        return await BuildPreview(cart, address.Id, request.Currency, request.Locale, cancellationToken);
    }

    public async Task<OrderResult> CreateAsync(Guid customerId, CreateOrderCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.IdempotencyKey)) throw new CommerceException("idempotency_required", "Não foi possível identificar a confirmação.");
        var existing = await orders.FindByIdempotencyKeyAsync(customerId, command.IdempotencyKey, cancellationToken);
        if (existing is not null) return Map(existing);
        var (customer, address, cart) = await Context(customerId, command.AddressId, cancellationToken);
        var preview = await BuildPreview(cart, address.Id, command.Currency, command.Locale, cancellationToken);
        var now = clock.UtcNow;
        var order = Order.Create(customerId, $"PSC-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
            preview.Currency, new(address.Recipient, address.Phone, address.Country, address.Province, address.City,
                address.Neighborhood, address.Street, address.HouseNumber, address.Apartment, address.PostalCode), now, command.IdempotencyKey);
        foreach (var item in preview.Items)
            order.AddItem(Domain.Catalog.ProductSku.Create(item.ProductSku), item.ProductName, item.Variant,
                Money.Create(item.UnitPrice, preview.Currency), item.Quantity, item.ImageUrl);
        order.SetShipping(Money.Create(preview.Shipping, preview.Currency));
        orders.Add(order);
        cart.Clear(now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        try
        {
            var documentId = await projection.UpsertAsync(order, customer, cancellationToken);
            if (!string.IsNullOrWhiteSpace(documentId)) { order.MarkProjected(documentId); await unitOfWork.SaveChangesAsync(cancellationToken); }
        }
        catch { /* a encomenda local não pode ser descartada por indisponibilidade do painel */ }
        return Map(order);
    }

    public async Task<IReadOnlyList<OrderResult>> ListAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        (await orders.ListAsync(customerId, cancellationToken)).Select(Map).ToArray();

    public async Task<OrderResult> FindAsync(Guid customerId, Guid orderId, CancellationToken cancellationToken = default) =>
        Map(await orders.FindByIdAsync(customerId, orderId, cancellationToken)
            ?? throw new CommerceException("order_not_found", "Encomenda não encontrada."));

    public async Task ChangeStatusAsync(Guid orderId, string status, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<OrderStatus>(status, true, out var target))
            throw new CommerceException("invalid_order_status", "Estado da encomenda inválido.");
        var order = await orders.FindByIdAsync(orderId, cancellationToken)
            ?? throw new CommerceException("order_not_found", "Encomenda não encontrada.");
        order.ChangeStatus(target, clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var customer = await customers.FindByIdAsync(order.CustomerId, cancellationToken);
        if (customer is not null) await projection.UpsertAsync(order, customer, cancellationToken);
    }

    private async Task<(Domain.Customers.Customer Customer, Domain.Customers.CustomerAddress Address, ShoppingCart Cart)> Context(Guid customerId, Guid addressId, CancellationToken token)
    {
        var customer = await customers.FindByIdAsync(customerId, token) ?? throw new CommerceException("customer_not_found", "Cliente não encontrado.");
        var address = await addresses.FindAsync(customerId, addressId, token) ?? throw new CommerceException("address_not_found", "Morada não encontrada.");
        var cart = await carts.FindAsync(customerId, token) ?? throw new CommerceException("cart_empty", "O carrinho está vazio.");
        if (cart.Items.Count == 0) throw new CommerceException("cart_empty", "O carrinho está vazio.");
        return (customer, address, cart);
    }

    private async Task<CheckoutPreviewResult> BuildPreview(ShoppingCart cart, Guid addressId, string currency, string locale, CancellationToken token)
    {
        var normalized = Money.Create(0, currency).Currency;
        var items = new List<CheckoutItemResult>();
        foreach (var cartItem in cart.Items)
        {
            var product = await catalog.FindBySkuAsync(cartItem.ProductSku, locale, token)
                ?? throw new CommerceException("product_not_found", $"O produto {cartItem.ProductSku.Value} deixou de existir.");
            CartService.ValidateProduct(product, cartItem.VariantId, cartItem.Quantity);
            var unit = normalized == "EUR" ? product.EurPrice : product.AoaPrice;
            items.Add(new(product.Sku.Value, product.Name, cartItem.VariantLabel, cartItem.Quantity, unit, unit * cartItem.Quantity, product.ImageUrl));
        }
        var subtotal = items.Sum(item => item.Total);
        const decimal shipping = 0;
        return new(addressId, normalized, subtotal, shipping, subtotal + shipping, items);
    }

    private static OrderResult Map(Order order) => new(order.Id, order.Number, order.CreatedAt,
        order.Status.ToString().ToLowerInvariant(), order.Currency, order.SubtotalAmount, order.ShippingAmount,
        order.TotalAmount, order.Items.Select(item => new CheckoutItemResult(item.ProductSku.Value, item.ProductName,
            item.Variant, item.Quantity, item.UnitPriceAmount, item.UnitPriceAmount * item.Quantity, item.ImageUrl)).ToArray(),
        new(order.Recipient, order.Phone, order.Country, order.Province, order.City, order.Neighborhood,
            order.Street, order.HouseNumber, order.Apartment, order.PostalCode),
        order.Timeline.OrderBy(item => item.OccurredAt).Select(item => new OrderTimelineResult(item.Status.ToString().ToLowerInvariant(), item.OccurredAt)).ToArray());
}
