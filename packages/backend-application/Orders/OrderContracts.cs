namespace PriscilaSkincare.Application.Orders;

public sealed record AddCartItemCommand(string ItemType, string Reference, string? VariantId, string? VariantLabel, int Quantity = 1);
public sealed record MergeCartItem(string ItemType, string Reference, string? VariantId, string? VariantLabel, int Quantity);
public sealed record CartItemResult(Guid Id, string ItemType, string Reference, string ProductName, string? VariantId,
    string? VariantLabel, int Quantity, decimal AoaPrice, decimal EurPrice, bool IsAvailable,
    int? Stock, string? ImageUrl, int ProductCount = 1);
public sealed record CartResult(Guid? Id, IReadOnlyList<CartItemResult> Items, decimal AoaSubtotal, decimal EurSubtotal);

public sealed record CheckoutContact(string Name, string Phone);
public sealed record CheckoutPreviewRequest(Guid AddressId, string Currency = "AOA", string Locale = "pt", string? Coupon = null, Guid? DeliveryRateId = null, Guid? PickupLocationId = null, CheckoutContact? Contact = null);
public sealed record CheckoutItemResult(string ItemType, string Reference, string ProductName, string? Variant,
    int Quantity, decimal UnitPrice, decimal Total, string? ImageUrl,
    IReadOnlyList<PriscilaSkincare.Domain.Orders.OrderComponentSnapshot>? Components = null);
public sealed record CheckoutPreviewResult(Guid AddressId, string Currency, decimal Subtotal,
    decimal Shipping, decimal Total, IReadOnlyList<CheckoutItemResult> Items, decimal Discount = 0, string? PromotionName = null, Guid? DeliveryRateId = null, IReadOnlyList<DeliveryOption>? DeliveryOptions = null);
public sealed record CreateOrderCommand(Guid AddressId, string Currency, string Locale, string IdempotencyKey, string PaymentMethod = "simulated", string? Coupon = null, Guid? DeliveryRateId = null, decimal? ExpectedTotal = null, Guid? PickupLocationId = null, CheckoutContact? Contact = null);
public sealed record PaymentResult(string Provider, string Reference, string Status);
public sealed record ManualPaymentRequest(Guid OrderId, decimal Amount, string Currency,
    string IdempotencyKey, bool Approved, string Locale);
public sealed record OrderAddressResult(string Recipient, string Phone, string Country, string Province,
    string City, string Neighborhood, string Street, string? HouseNumber, string? Apartment, string? PostalCode);
public sealed record OrderTimelineResult(string Status, DateTimeOffset OccurredAt);
public sealed record OrderResult(Guid Id, string Number, DateTimeOffset PlacedAt, string Status, string Currency,
    decimal Subtotal, decimal Shipping, decimal Total, IReadOnlyList<CheckoutItemResult> Items,
    OrderAddressResult DeliveryAddress, IReadOnlyList<OrderTimelineResult> Timeline, PaymentResult? Payment, decimal Discount = 0, string? PromotionName = null, PriscilaSkincare.Domain.Orders.OrderPickup? Pickup = null);

public sealed class CommerceException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
