namespace PriscilaSkincare.Domain.Fulfillment;

public sealed class StockAdjustment
{
    public Guid Id { get; set; }
    public Guid? SourceLocationId { get; set; }
    public Guid DestinationLocationId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public string Status { get; set; } = "received";
    public DateTimeOffset? ReceivedAt { get; set; }
}
