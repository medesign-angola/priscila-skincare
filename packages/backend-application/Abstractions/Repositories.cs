using PriscilaSkincare.Domain.Authentication;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Domain.Reviews;

namespace PriscilaSkincare.Application.Abstractions;

public interface ICustomerRepository
{
    Task<Customer?> FindByEmailAsync(EmailAddress email, CancellationToken cancellationToken = default);
    Task<Customer?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    void Add(Customer customer);
}

public interface ICustomerAddressRepository
{
    Task<IReadOnlyList<CustomerAddress>> ListAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<CustomerAddress?> FindAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default);
    void Add(CustomerAddress address);
    void Remove(CustomerAddress address);
}

public interface IOtpChallengeRepository
{
    Task<OtpChallenge?> FindLatestAsync(EmailAddress email, CancellationToken cancellationToken = default);
    void Add(OtpChallenge challenge);
}

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    void Add(RefreshToken refreshToken);
}

public interface IReviewRepository
{
    Task<ProductReview?> FindAsync(Guid customerId, string productSku, CancellationToken cancellationToken = default);
    Task<ProductReview?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<ReviewReadModel> Items, int Total, double Average)> GetPublishedAsync(string productSku, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<(int Total, double Average)> GetGlobalSummaryAsync(CancellationToken cancellationToken = default);
    void Add(ProductReview review);
}

public sealed record ReviewReadModel(ProductReview Review, string CustomerName);

public interface IOrderRepository
{
    Task<Order?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    void Add(Order order);
}
