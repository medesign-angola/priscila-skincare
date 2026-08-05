using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Orders;

public enum OrderStatus { Pending, Confirmed, Paid, Processing, Shipped, Delivered, Cancelled }

public sealed class Order : AggregateRoot<Guid>
{
    private readonly List<OrderItem> _items = [];
    private readonly List<OrderStatusEntry> _timeline = [];
    private Order() : base(Guid.Empty) { }

    private Order(Guid id, Guid customerId, string number, string currency, OrderAddress address, DateTimeOffset now) : base(id)
    {
        CustomerId = customerId;
        Number = number;
        Currency = Money.Create(0, currency).Currency;
        Recipient = address.Recipient.Trim();
        Phone = address.Phone.Trim();
        Country = address.Country.Trim();
        Province = address.Province.Trim();
        City = address.City.Trim();
        Neighborhood = address.Neighborhood.Trim();
        Street = address.Street.Trim();
        HouseNumber = address.HouseNumber?.Trim();
        Apartment = address.Apartment?.Trim();
        PostalCode = address.PostalCode?.Trim();
        CreatedAt = now;
        UpdatedAt = now;
        _timeline.Add(OrderStatusEntry.Create(Id, OrderStatus.Pending, now));
    }

    public Guid CustomerId { get; private set; }
    public string Number { get; private set; } = string.Empty;
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public string Currency { get; private set; } = "AOA";
    public decimal SubtotalAmount { get; private set; }
    public decimal ShippingAmount { get; private set; }
    public decimal TotalAmount { get; private set; }
    public string Recipient { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Country { get; private set; } = string.Empty;
    public string Province { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string Neighborhood { get; private set; } = string.Empty;
    public string Street { get; private set; } = string.Empty;
    public string? HouseNumber { get; private set; }
    public string? Apartment { get; private set; }
    public string? PostalCode { get; private set; }
    public string? IdempotencyKey { get; private set; }
    public string? StrapiDocumentId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    public IReadOnlyCollection<OrderStatusEntry> Timeline => _timeline.AsReadOnly();

    public static Order Create(Guid customerId, string number, string currency, OrderAddress address, DateTimeOffset now, string? idempotencyKey = null) =>
        new(Guid.NewGuid(), customerId, number, currency, address, now) { IdempotencyKey = idempotencyKey?.Trim() };

    public static Order Create(Guid customerId, DateTimeOffset now) =>
        Create(customerId, $"PSC-{now:yyyyMMddHHmmss}", "AOA", new OrderAddress("Cliente", "N/D", "Angola", "N/D", "N/D", "N/D", "N/D", null, null, null), now);

    public void AddItem(ProductSku sku, string productName, string? variant, Money unitPrice, int quantity, string? imageUrl = null)
    {
        if (Status != OrderStatus.Pending) throw new InvalidOperationException("A encomenda já não pode ser alterada.");
        if (unitPrice.Currency != Currency) throw new InvalidOperationException("Todos os itens devem usar a moeda da encomenda.");
        if (quantity < 1) throw new ArgumentOutOfRangeException(nameof(quantity));
        _items.Add(OrderItem.Create(Id, sku, productName, variant, unitPrice, quantity, imageUrl));
        Recalculate();
    }

    public void SetShipping(Money shipping)
    {
        if (shipping.Currency != Currency) throw new InvalidOperationException("A moeda do envio é inválida.");
        ShippingAmount = shipping.Amount;
        Recalculate();
    }

    public void ChangeStatus(OrderStatus status, DateTimeOffset now)
    {
        if (Status == status) return;
        var valid = Status switch
        {
            OrderStatus.Pending => status is OrderStatus.Confirmed or OrderStatus.Cancelled,
            OrderStatus.Confirmed => status is OrderStatus.Paid or OrderStatus.Processing or OrderStatus.Cancelled,
            OrderStatus.Paid => status is OrderStatus.Processing or OrderStatus.Cancelled,
            OrderStatus.Processing => status is OrderStatus.Shipped or OrderStatus.Cancelled,
            OrderStatus.Shipped => status is OrderStatus.Delivered,
            _ => false,
        };
        if (!valid) throw new InvalidOperationException($"A transição de {Status} para {status} não é permitida.");
        Status = status;
        UpdatedAt = now;
        _timeline.Add(OrderStatusEntry.Create(Id, status, now));
    }

    public void MarkProjected(string documentId) => StrapiDocumentId = documentId.Trim();

    private void Recalculate()
    {
        SubtotalAmount = _items.Sum(item => item.UnitPriceAmount * item.Quantity);
        TotalAmount = SubtotalAmount + ShippingAmount;
    }
}

public sealed record OrderAddress(string Recipient, string Phone, string Country, string Province, string City,
    string Neighborhood, string Street, string? HouseNumber, string? Apartment, string? PostalCode);

public sealed class OrderItem : Entity<Guid>
{
    private OrderItem() : base(Guid.Empty) { }
    private OrderItem(Guid id, Guid orderId, ProductSku sku, string productName, string? variant, Money unitPrice, int quantity, string? imageUrl) : base(id)
    {
        OrderId = orderId; ProductSku = sku; ProductName = productName.Trim(); Variant = variant?.Trim();
        UnitPriceAmount = unitPrice.Amount; Currency = unitPrice.Currency; Quantity = quantity; ImageUrl = imageUrl?.Trim();
    }
    public Guid OrderId { get; private set; }
    public ProductSku ProductSku { get; private set; } = null!;
    public string ProductName { get; private set; } = string.Empty;
    public string? Variant { get; private set; }
    public decimal UnitPriceAmount { get; private set; }
    public string Currency { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public string? ImageUrl { get; private set; }
    public Money UnitPrice => Money.Create(UnitPriceAmount, Currency);
    internal static OrderItem Create(Guid orderId, ProductSku sku, string productName, string? variant, Money unitPrice, int quantity, string? imageUrl) =>
        new(Guid.NewGuid(), orderId, sku, productName, variant, unitPrice, quantity, imageUrl);
}

public sealed class OrderStatusEntry : Entity<Guid>
{
    private OrderStatusEntry() : base(Guid.Empty) { }
    private OrderStatusEntry(Guid id, Guid orderId, OrderStatus status, DateTimeOffset occurredAt) : base(id)
    { OrderId = orderId; Status = status; OccurredAt = occurredAt; }
    public Guid OrderId { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    internal static OrderStatusEntry Create(Guid orderId, OrderStatus status, DateTimeOffset now) => new(Guid.NewGuid(), orderId, status, now);
}
