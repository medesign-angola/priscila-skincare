using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Orders;

public enum OrderStatus { Pending, Confirmed, Paid, Processing, Shipped, Delivered, Cancelled }

public sealed class Order : AggregateRoot<Guid>
{
    private readonly List<OrderItem> _items = [];
    private Order() : base(Guid.Empty) { }

    private Order(Guid id, Guid customerId, DateTimeOffset createdAt) : base(id)
    {
        CustomerId = customerId;
        CreatedAt = createdAt;
    }

    public Guid CustomerId { get; private set; }
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public DateTimeOffset CreatedAt { get; private set; }
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public static Order Create(Guid customerId, DateTimeOffset now) => new(Guid.NewGuid(), customerId, now);

    public void AddItem(ProductSku sku, string productName, string? variant, Money unitPrice, int quantity)
    {
        if (Status != OrderStatus.Pending) throw new InvalidOperationException("A encomenda já não pode ser alterada.");
        if (quantity < 1) throw new ArgumentOutOfRangeException(nameof(quantity));
        _items.Add(OrderItem.Create(Id, sku, productName, variant, unitPrice, quantity));
    }
}

public sealed class OrderItem : Entity<Guid>
{
    private OrderItem() : base(Guid.Empty) { }

    private OrderItem(Guid id, Guid orderId, ProductSku sku, string productName, string? variant, Money unitPrice, int quantity) : base(id)
    {
        OrderId = orderId;
        ProductSku = sku;
        ProductName = productName;
        Variant = variant;
        UnitPriceAmount = unitPrice.Amount;
        Currency = unitPrice.Currency;
        Quantity = quantity;
    }

    public Guid OrderId { get; private set; }
    public ProductSku ProductSku { get; private set; } = null!;
    public string ProductName { get; private set; } = string.Empty;
    public string? Variant { get; private set; }
    public decimal UnitPriceAmount { get; private set; }
    public string Currency { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public Money UnitPrice => Money.Create(UnitPriceAmount, Currency);

    internal static OrderItem Create(Guid orderId, ProductSku sku, string productName, string? variant, Money unitPrice, int quantity) =>
        new(Guid.NewGuid(), orderId, sku, productName.Trim(), variant?.Trim(), unitPrice, quantity);
}
