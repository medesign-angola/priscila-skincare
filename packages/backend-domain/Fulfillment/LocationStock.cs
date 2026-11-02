using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Catalog;

namespace PriscilaSkincare.Domain.Fulfillment;

public sealed class LocationStock : Entity<Guid>
{
    private LocationStock() : base(Guid.Empty) { }
    public Guid LocationId { get; private set; }
    public string Sku { get; private set; } = string.Empty;
    public int OnHand { get; private set; }
    public int Reserved { get; private set; }
    public int Available => OnHand - Reserved;
    public static LocationStock Create(Guid locationId, string sku, int quantity)
    {
        if (quantity < 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        return new() { Id = Guid.NewGuid(), LocationId = locationId, Sku = ProductSku.Create(sku).Value, OnHand = quantity };
    }
    public void Reserve(int quantity) { Positive(quantity); if (quantity > Available) throw new InvalidOperationException("Stock insuficiente."); Reserved += quantity; }
    public void Release(int quantity) { Positive(quantity); if (quantity > Reserved) throw new InvalidOperationException("Reserva inválida."); Reserved -= quantity; }
    public void Dispatch(int quantity) { Release(quantity); OnHand -= quantity; }
    public void Receive(int quantity) { Positive(quantity); OnHand = checked(OnHand + quantity); }
    public void Remove(int quantity) { Positive(quantity); if (quantity > Available) throw new InvalidOperationException("Stock indisponível para transferência."); OnHand -= quantity; }
    private static void Positive(int quantity) { if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity)); }
}

public sealed class StockReservation : Entity<Guid>
{
    private StockReservation() : base(Guid.Empty) { }
    public Guid OrderId { get; private set; }
    public Guid StockId { get; private set; }
    public int Quantity { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public string Status { get; private set; } = "reserved";
    public static StockReservation Create(Guid orderId, Guid stockId, int quantity, DateTimeOffset expiresAt)
    {
        if (quantity < 1) throw new ArgumentOutOfRangeException(nameof(quantity));
        return new() { Id = Guid.NewGuid(), OrderId = orderId, StockId = stockId, Quantity = quantity, ExpiresAt = expiresAt };
    }
    public void Release() { if (Status == "reserved") Status = "released"; }
    public void Consume() { if (Status != "reserved") throw new InvalidOperationException("Reserva inactiva."); Status = "consumed"; }
}
