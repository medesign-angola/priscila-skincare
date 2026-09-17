using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Domain.Reviews;
using PriscilaSkincare.Domain.Integration;

namespace PriscilaSkincare.Application.Abstractions;

public sealed record CatalogVariant(string Id, string Label);
public sealed record CatalogComponent(ProductSku Sku, int Quantity = 1);
public sealed record CatalogProduct(
    ProductSku Sku, string Name, decimal AoaPrice, decimal EurPrice,
    bool IsAvailable, int? Stock = null, string? ImageUrl = null,
    IReadOnlyList<CatalogVariant>? Variants = null);
public sealed record CatalogItem(CommerceItemType Type, CommerceItemReference Reference, string Name,
    decimal AoaPrice, decimal EurPrice, bool IsAvailable, int? Stock, string? ImageUrl,
    IReadOnlyList<CatalogVariant> Variants, IReadOnlyList<CatalogComponent> Components);

public interface ICatalogGateway
{
    Task<CatalogProduct?> FindBySkuAsync(ProductSku sku, string locale, CancellationToken cancellationToken = default);
    Task<CatalogItem?> FindAsync(CommerceItemType type, CommerceItemReference reference, string locale, CancellationToken cancellationToken = default);
}

public sealed record PaymentRequest(Guid OrderId, Money Amount, string IdempotencyKey);
public sealed record PaymentDecision(string Provider, string Reference, bool Approved, string? FailureCode = null);
public interface IPaymentGateway { Task<PaymentDecision> AuthorizeAsync(PaymentRequest request, CancellationToken cancellationToken = default); }

public interface IIntegrationOutbox
{
    void Add(IntegrationOutboxMessage message);
}

public interface IIntegrationInbox
{
    Task<bool> ContainsAsync(Guid eventId, CancellationToken cancellationToken = default);
    void Add(IntegrationInboxMessage message);
}

public interface IInventoryService
{
    Task ValidateAsync(IReadOnlyList<InventoryRequest> items, CancellationToken cancellationToken = default);
    Task DebitAsync(Guid orderId, IReadOnlyList<InventoryRequest> items, CancellationToken cancellationToken = default);
    Task CreditAsync(Guid orderId, CancellationToken cancellationToken = default);
}
public sealed record InventoryRequest(string ProductSku, int Quantity, int? CatalogStock);

public interface IReviewProjection
{
    Task<string?> UpsertAsync(ProductReview review, Customer customer, CancellationToken cancellationToken = default);
}

public interface ICustomerProjection
{
    Task UpsertAsync(Customer customer, CancellationToken cancellationToken = default);
}

public interface IOrderProjection
{
    Task<string?> UpsertAsync(Order order, Customer customer, CancellationToken cancellationToken = default);
}

public interface IOtpSender
{
    Task SendAsync(OtpEmail message, CancellationToken cancellationToken = default);
}

public sealed record OtpEmail(EmailAddress Recipient, string Code, string Locale, int LifetimeMinutes);

public sealed record OrderConfirmationEmailItem(string Name, string? Variant, int Quantity,
    decimal UnitPrice, decimal Total);
public sealed record OrderConfirmationEmailAddress(string Recipient, string Phone, string Country,
    string Province, string City, string Neighborhood, string Street, string? HouseNumber,
    string? Apartment, string? PostalCode);
public sealed record OrderConfirmationEmail(Guid OrderId, string OrderNumber, string RecipientEmail,
    string? CustomerName, string Locale, DateTimeOffset PlacedAt, string Status, string PaymentStatus,
    string Currency, decimal Subtotal, decimal Shipping, decimal Total,
    IReadOnlyList<OrderConfirmationEmailItem> Items, OrderConfirmationEmailAddress Address);

public interface IOrderEmailOutbox
{
    void Enqueue(OrderConfirmationEmail message, DateTimeOffset now);
}

public interface IOrderEmailSender
{
    Task SendAsync(OrderConfirmationEmail message, CancellationToken cancellationToken = default);
}

public interface IOtpCodeGenerator
{
    string Generate();
}

public interface ISecretHasher
{
    string Hash(string value);
    bool Verify(string value, string hash);
}

public sealed record IssuedTokens(string AccessToken, string RefreshToken, DateTimeOffset ExpiresAt);

public interface ITokenService
{
    IssuedTokens Issue(Guid customerId, EmailAddress email);
}
