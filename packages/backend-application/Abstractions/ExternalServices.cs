using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Domain.Reviews;

namespace PriscilaSkincare.Application.Abstractions;

public sealed record CatalogVariant(string Id, string Label);
public sealed record CatalogProduct(
    ProductSku Sku, string Name, decimal AoaPrice, decimal EurPrice,
    bool IsAvailable, int? Stock = null, string? ImageUrl = null,
    IReadOnlyList<CatalogVariant>? Variants = null);

public interface ICatalogGateway
{
    Task<CatalogProduct?> FindBySkuAsync(ProductSku sku, string locale, CancellationToken cancellationToken = default);
}

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
