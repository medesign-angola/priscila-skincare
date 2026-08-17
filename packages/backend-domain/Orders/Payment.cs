using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Orders;

public enum PaymentStatus { Pending, Approved, Rejected, Cancelled, Refunded }

public sealed class Payment : AggregateRoot<Guid>
{
    private Payment() : base(Guid.Empty) { }
    private Payment(Guid id, Guid orderId, string provider, string reference, decimal amount, string currency, DateTimeOffset now) : base(id)
    { OrderId=orderId; Provider=provider; Reference=reference; Amount=amount; Currency=currency; CreatedAt=now; UpdatedAt=now; }
    public Guid OrderId { get; private set; }
    public string Provider { get; private set; } = string.Empty;
    public string Reference { get; private set; } = string.Empty;
    public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public static Payment Create(Guid orderId, string provider, string reference, Money amount, DateTimeOffset now) =>
        new(Guid.NewGuid(), orderId, provider.Trim(), reference.Trim(), amount.Amount, amount.Currency, now);
    public void ChangeStatus(PaymentStatus status, DateTimeOffset now) { Status=status; UpdatedAt=now; }
}

public enum StockMovementType { Debit, Credit }

public sealed class StockMovement : Entity<Guid>
{
    private StockMovement() : base(Guid.Empty) { }
    private StockMovement(Guid id, Guid orderId, string productSku, int quantity, StockMovementType type, DateTimeOffset now) : base(id)
    { OrderId=orderId; ProductSku=productSku; Quantity=quantity; Type=type; OccurredAt=now; }
    public Guid OrderId { get; private set; }
    public string ProductSku { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public StockMovementType Type { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public static StockMovement Create(Guid orderId, string sku, int quantity, StockMovementType type, DateTimeOffset now) =>
        new(Guid.NewGuid(), orderId, sku.Trim().ToUpperInvariant(), quantity, type, now);
}
