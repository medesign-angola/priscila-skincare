using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Orders;

public sealed class ShoppingCart : AggregateRoot<Guid>
{
    private readonly List<ShoppingCartItem> _items = [];
    private ShoppingCart() : base(Guid.Empty) { }

    private ShoppingCart(Guid id, Guid customerId, DateTimeOffset now) : base(id)
    {
        CustomerId = customerId;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public Guid CustomerId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public IReadOnlyCollection<ShoppingCartItem> Items => _items.AsReadOnly();

    public static ShoppingCart Create(Guid customerId, DateTimeOffset now)
    {
        if (customerId == Guid.Empty) throw new ArgumentException("O cliente é obrigatório.", nameof(customerId));
        return new ShoppingCart(Guid.NewGuid(), customerId, now);
    }

    public void Add(CommerceItemType itemType, CommerceItemReference reference, string? variantId, string? variantLabel, int quantity, DateTimeOffset now)
    {
        if (quantity is < 1 or > 99) throw new ArgumentOutOfRangeException(nameof(quantity));
        var normalizedVariantId = Optional(variantId, 64);
        var existing = _items.FirstOrDefault(item => item.ItemType == itemType && item.Reference == reference && item.VariantId == normalizedVariantId);
        if (existing is null)
        {
            _items.Add(ShoppingCartItem.Create(Id, itemType, reference, normalizedVariantId, Optional(variantLabel, 80), quantity));
            UpdatedAt = now;
            return;
        }

        var nextQuantity = Math.Min(99, existing.Quantity + quantity);
        if (nextQuantity == existing.Quantity) return;
        existing.SetQuantity(nextQuantity);
        UpdatedAt = now;
    }

    public void Synchronize(CommerceItemType itemType, CommerceItemReference reference, string? variantId, string? variantLabel, int quantity, DateTimeOffset now)
    {
        if (quantity is < 1 or > 99) throw new ArgumentOutOfRangeException(nameof(quantity));
        var normalizedVariantId = Optional(variantId, 64);
        var normalizedVariantLabel = Optional(variantLabel, 80);
        var existing = _items.FirstOrDefault(item =>
            item.ItemType == itemType &&
            item.Reference == reference &&
            item.VariantId == normalizedVariantId);

        if (existing is null)
        {
            _items.Add(ShoppingCartItem.Create(Id, itemType, reference, normalizedVariantId, normalizedVariantLabel, quantity));
            UpdatedAt = now;
            return;
        }

        var quantityChanged = existing.Quantity != quantity;
        var labelChanged = existing.VariantLabel != normalizedVariantLabel;
        if (!quantityChanged && !labelChanged) return;
        if (quantityChanged) existing.SetQuantity(quantity);
        if (labelChanged) existing.SetVariantLabel(normalizedVariantLabel);
        UpdatedAt = now;
    }

    public void SetQuantity(Guid itemId, int quantity, DateTimeOffset now)
    {
        var item = _items.SingleOrDefault(candidate => candidate.Id == itemId)
            ?? throw new InvalidOperationException("O item não existe no carrinho.");
        if (quantity <= 0)
        {
            _items.Remove(item);
            UpdatedAt = now;
            return;
        }
        if (item.Quantity == quantity) return;
        item.SetQuantity(quantity);
        UpdatedAt = now;
    }

    public void Remove(Guid itemId, DateTimeOffset now)
    {
        var item = _items.SingleOrDefault(candidate => candidate.Id == itemId);
        if (item is null) return;
        _items.Remove(item);
        UpdatedAt = now;
    }

    public void Clear(DateTimeOffset now)
    {
        if (_items.Count == 0) return;
        _items.Clear();
        UpdatedAt = now;
    }

    private static string? Optional(string? value, int maxLength) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, maxLength)];
}

public sealed class ShoppingCartItem : Entity<Guid>
{
    private ShoppingCartItem() : base(Guid.Empty) { }
    private ShoppingCartItem(Guid id, Guid cartId, CommerceItemType itemType, CommerceItemReference reference, string? variantId, string? variantLabel, int quantity) : base(id)
    {
        CartId = cartId;
        ItemType = itemType;
        Reference = reference;
        VariantId = variantId;
        VariantLabel = variantLabel;
        SetQuantity(quantity);
    }

    public Guid CartId { get; private set; }
    public CommerceItemType ItemType { get; private set; }
    public CommerceItemReference Reference { get; private set; } = null!;
    public string? VariantId { get; private set; }
    public string? VariantLabel { get; private set; }
    public int Quantity { get; private set; }

    internal static ShoppingCartItem Create(Guid cartId, CommerceItemType itemType, CommerceItemReference reference, string? variantId, string? variantLabel, int quantity) =>
        new(Guid.NewGuid(), cartId, itemType, reference, variantId, variantLabel, quantity);

    internal void SetQuantity(int quantity)
    {
        if (quantity is < 1 or > 99) throw new ArgumentOutOfRangeException(nameof(quantity));
        Quantity = quantity;
    }

    internal void SetVariantLabel(string? variantLabel) => VariantLabel = variantLabel;
}
