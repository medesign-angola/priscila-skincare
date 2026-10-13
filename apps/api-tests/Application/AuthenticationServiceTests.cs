using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Integration;
using PriscilaSkincare.Domain.Authentication;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Integration;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Api.Tests.Application;

public sealed class AuthenticationServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 2, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task RequestAndVerifyOtp_CreatesCustomerAndSession()
    {
        var fixture = new AuthenticationFixture();

        var requested = await fixture.Service.RequestOtpAsync(new RequestOtpCommand("CLIENTE@EXAMPLE.COM"));
        await fixture.ConfirmDeliveryAsync();
        var authenticated = await fixture.Service.VerifyOtpAsync(
            new VerifyOtpCommand("cliente@example.com", "123456"));

        Assert.Equal(Now.AddMinutes(10), requested.ExpiresAt);
        Assert.NotEqual(Guid.Empty, authenticated.CustomerId);
        Assert.Equal("access-token", authenticated.AccessToken);
        Assert.Single(fixture.Customers.Items);
        Assert.Single(fixture.RefreshTokens.Items);
        Assert.NotEqual("refresh-token", fixture.RefreshTokens.Items[0].TokenHash);
    }

    [Fact]
    public async Task VerifyOtp_WithWrongCode_RegistersFailedAttempt()
    {
        var fixture = new AuthenticationFixture();
        await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com"));
        await fixture.ConfirmDeliveryAsync();

        var exception = await Assert.ThrowsAsync<AuthenticationException>(() =>
            fixture.Service.VerifyOtpAsync(new VerifyOtpCommand("cliente@example.com", "000000")));

        Assert.Equal("otp_invalid", exception.Code);
        Assert.Equal(1, fixture.OtpChallenges.Items[0].FailedAttempts);
        Assert.Empty(fixture.Customers.Items);
    }

    [Fact]
    public async Task RequestOtp_DuringCooldown_IsRejected()
    {
        var fixture = new AuthenticationFixture();
        await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com"));
        await fixture.ConfirmDeliveryAsync();

        var exception = await Assert.ThrowsAsync<AuthenticationException>(() =>
            fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com")));

        Assert.Equal("otp_resend_too_soon", exception.Code);
    }

    [Fact]
    public async Task RequestOtp_ForwardsSupportedLocaleToOutbox()
    {
        var fixture = new AuthenticationFixture();

        await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com", "fr"));

        Assert.Equal("fr", fixture.LastNotification().Locale);
        Assert.Equal(10, fixture.LastNotification().LifetimeMinutes);
    }

    [Fact]
    public async Task RequestOtp_WithUnknownLocale_FallsBackToPortuguese()
    {
        var fixture = new AuthenticationFixture();

        await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com", "en"));

        Assert.Equal("pt", fixture.LastNotification().Locale);
    }

    [Fact]
    public async Task RequestOtp_WhenDeliveryFails_InvalidatesChallenge()
    {
        var fixture = new AuthenticationFixture();
        await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com"));
        await fixture.FailDeliveryAsync();

        Assert.False(fixture.OtpChallenges.Items[0].IsUsableAt(Now));
        Assert.Equal(OtpDeliveryStatus.Failed, fixture.OtpChallenges.Items[0].DeliveryStatus);
    }

    [Fact]
    public async Task RequestOtp_AfterDeliveryFailure_CanRetryImmediately()
    {
        var fixture = new AuthenticationFixture();
        await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com"));
        await fixture.FailDeliveryAsync();
        var result = await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com"));

        Assert.Equal(0, result.ResendAfterSeconds);
        Assert.Equal(2, fixture.OtpChallenges.Items.Count);
        Assert.Equal(OtpDeliveryStatus.Pending, fixture.OtpChallenges.Items[1].DeliveryStatus);
    }

    private sealed class AuthenticationFixture
    {
        public CustomerMemoryRepository Customers { get; } = new();
        public OtpMemoryRepository OtpChallenges { get; } = new();
        public RefreshTokenMemoryRepository RefreshTokens { get; } = new();
        public OutboxMemory Outbox { get; } = new();
        public InboxMemory Inbox { get; } = new();
        public AuthenticationService Service { get; }

        public AuthenticationFixture()
        {
            var hasher = new TestHasher();
            Service = new AuthenticationService(
                Customers,
                OtpChallenges,
                RefreshTokens,
                new UnitOfWorkStub(),
                new ClockStub(),
                new OtpGeneratorStub(),
                hasher,
                new OtpProtectorStub(),
                Outbox,
                Inbox,
                new TokenServiceStub(),
                new CustomerProjectionStub(),
                new CustomerAddressRepositoryStub(),
                new OrderRepositoryStub(),
                new ShoppingCartRepositoryStub(),
                new PaymentRepositoryStub(),
                new OrderProjectionStub(),
                new OrderEmailOutboxStub(),
                new AuthenticationOptions());
        }

        public OtpNotificationRequestedEvent LastNotification() =>
            JsonSerializer.Deserialize<OtpNotificationRequestedEvent>(Outbox.Items[^1].Payload)!;

        public Task ConfirmDeliveryAsync() => Service.ApplyOtpDeliveryResultAsync(Guid.NewGuid(),
            new(OtpChallenges.Items[^1].Id, "sent", Now, null));

        public Task FailDeliveryAsync() => Service.ApplyOtpDeliveryResultAsync(Guid.NewGuid(),
            new(OtpChallenges.Items[^1].Id, "failed", null, "delivery_failed"));
    }

    private sealed class CustomerMemoryRepository : ICustomerRepository
    {
        public List<Customer> Items { get; } = [];
        public Task<Customer?> FindByEmailAsync(EmailAddress email, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(customer => customer.Email == email));
        public Task<Customer?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(customer => customer.Id == id));
        public void Add(Customer customer) => Items.Add(customer);
    }

    private sealed class OtpMemoryRepository : IOtpChallengeRepository
    {
        public List<OtpChallenge> Items { get; } = [];
        public Task<OtpChallenge?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.Id == id));
        public Task<OtpChallenge?> FindLatestSentAsync(EmailAddress email, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items
                .Where(item => item.Email == email && item.DeliveryStatus == OtpDeliveryStatus.Sent)
                .OrderByDescending(item => item.SentAt)
                .FirstOrDefault());
        public Task<OtpChallenge?> FindLatestPendingAsync(EmailAddress email, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items
                .Where(item => item.Email == email && item.DeliveryStatus == OtpDeliveryStatus.Pending)
                .OrderByDescending(item => item.CreatedAt)
                .FirstOrDefault());
        public void Add(OtpChallenge challenge) => Items.Add(challenge);
        public Task RemoveAllAsync(EmailAddress email, CancellationToken cancellationToken = default)
        {
            Items.RemoveAll(item => item.Email == email);
            return Task.CompletedTask;
        }
    }

    private sealed class RefreshTokenMemoryRepository : IRefreshTokenRepository
    {
        public List<RefreshToken> Items { get; } = [];
        public Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.TokenHash == tokenHash));
        public void Add(RefreshToken refreshToken) => Items.Add(refreshToken);
        public Task RevokeAllAsync(Guid customerId, DateTimeOffset now, CancellationToken cancellationToken = default)
        {
            foreach (var token in Items.Where(item => item.CustomerId == customerId)) token.Revoke(now);
            return Task.CompletedTask;
        }
    }

    private sealed class CustomerAddressRepositoryStub : ICustomerAddressRepository
    {
        public Task<IReadOnlyList<CustomerAddress>> ListAsync(Guid customerId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<CustomerAddress>>([]);
        public Task<CustomerAddress?> FindAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default) =>
            Task.FromResult<CustomerAddress?>(null);
        public void Add(CustomerAddress address) { }
        public void Remove(CustomerAddress address) { }
    }

    private sealed class OrderRepositoryStub : IOrderRepository
    {
        public Task<Order?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<Order?>(null);
        public Task<Order?> FindByIdAsync(Guid customerId, Guid id, CancellationToken cancellationToken = default) => Task.FromResult<Order?>(null);
        public Task<Order?> FindByIdempotencyKeyAsync(Guid customerId, string key, CancellationToken cancellationToken = default) => Task.FromResult<Order?>(null);
        public Task<IReadOnlyList<Order>> ListAsync(Guid customerId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Order>>([]);
        public void Add(Order order) { }
    }

    private sealed class ShoppingCartRepositoryStub : IShoppingCartRepository
    {
        public Task<ShoppingCart?> FindAsync(Guid customerId, CancellationToken cancellationToken = default) => Task.FromResult<ShoppingCart?>(null);
        public void Add(ShoppingCart cart) { }
    }

    private sealed class PaymentRepositoryStub : IPaymentRepository
    {
        public Task<Payment?> FindByOrderAsync(Guid orderId, CancellationToken cancellationToken = default) => Task.FromResult<Payment?>(null);
        public void Add(Payment payment) { }
    }

    private sealed class UnitOfWorkStub : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
    }

    private sealed class ClockStub : IClock
    {
        public DateTimeOffset UtcNow => Now;
    }

    private sealed class OtpGeneratorStub : IOtpCodeGenerator
    {
        public string Generate() => "123456";
    }

    private sealed class TestHasher : ISecretHasher
    {
        public string Hash(string value) => $"hashed:{value}";
        public bool Verify(string value, string hash) => Hash(value) == hash;
    }

    private sealed class OtpProtectorStub : IOtpCodeProtector
    {
        public string Protect(string code) => $"protected:{code}";
    }

    private sealed class OutboxMemory : IIntegrationOutbox
    {
        public List<IntegrationOutboxMessage> Items { get; } = [];
        public void Add(IntegrationOutboxMessage message) => Items.Add(message);
        public Task RemovePersonalDataAsync(string value, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class InboxMemory : IIntegrationInbox
    {
        private readonly List<IntegrationInboxMessage> items = [];
        public Task<bool> ContainsAsync(Guid eventId, CancellationToken cancellationToken = default) =>
            Task.FromResult(items.Any(item => item.Id == eventId));
        public void Add(IntegrationInboxMessage message) => items.Add(message);
    }

    private sealed class TokenServiceStub : ITokenService
    {
        public IssuedTokens Issue(Guid customerId, EmailAddress email) =>
            new("access-token", "refresh-token", Now.AddMinutes(15));
    }

    private sealed class CustomerProjectionStub : ICustomerProjection
    {
        public Task UpsertAsync(Customer customer, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DeleteAsync(Guid customerId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class OrderProjectionStub : IOrderProjection
    {
        public Task<string?> UpsertAsync(Order order, Customer? customer, Payment? payment, CancellationToken cancellationToken = default) =>
            Task.FromResult<string?>(null);
    }

    private sealed class OrderEmailOutboxStub : IOrderEmailOutbox
    {
        public void Enqueue(OrderConfirmationEmail message, DateTimeOffset now) { }
        public Task RemovePersonalDataAsync(IReadOnlyCollection<Guid> orderIds, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
