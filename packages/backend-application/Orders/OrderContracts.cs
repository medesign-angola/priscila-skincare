namespace PriscilaSkincare.Application.Orders;

public sealed record AddCartItemCommand(string ProductSku, string? VariantId, string? VariantLabel, int Quantity = 1);
public sealed record MergeCartItem(string ProductSku, string? VariantId, string? VariantLabel, int Quantity);
public sealed record CartItemResult(Guid Id, string ProductSku, string ProductName, string? VariantId,
    string? VariantLabel, int Quantity, decimal AoaPrice, decimal EurPrice, bool IsAvailable,
    int? Stock, string? ImageUrl);
public sealed record CartResult(Guid? Id, IReadOnlyList<CartItemResult> Items, decimal AoaSubtotal, decimal EurSubtotal);

public sealed record CheckoutPreviewRequest(Guid AddressId, string Currency = "AOA", string Locale = "pt");
public sealed record CheckoutItemResult(string ProductSku, string ProductName, string? Variant,
    int Quantity, decimal UnitPrice, decimal Total, string? ImageUrl);
public sealed record CheckoutPreviewResult(Guid AddressId, string Currency, decimal Subtotal,
    decimal Shipping, decimal Total, IReadOnlyList<CheckoutItemResult> Items);
public sealed record CreateOrderCommand(Guid AddressId, string Currency, string Locale, string IdempotencyKey);
public sealed record OrderAddressResult(string Recipient, string Phone, string Country, string Province,
    string City, string Neighborhood, string Street, string? HouseNumber, string? Apartment, string? PostalCode);
public sealed record OrderTimelineResult(string Status, DateTimeOffset OccurredAt);
public sealed record OrderResult(Guid Id, string Number, DateTimeOffset PlacedAt, string Status, string Currency,
    decimal Subtotal, decimal Shipping, decimal Total, IReadOnlyList<CheckoutItemResult> Items,
    OrderAddressResult DeliveryAddress, IReadOnlyList<OrderTimelineResult> Timeline);

public sealed class CommerceException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
