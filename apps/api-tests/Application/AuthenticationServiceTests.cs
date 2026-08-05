using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Domain.Authentication;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Api.Tests.Application;

public sealed class AuthenticationServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 2, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task RequestAndVerifyOtp_CreatesCustomerAndSession()
    {
        var fixture = new AuthenticationFixture();

        var requested = await fixture.Service.RequestOtpAsync(new RequestOtpCommand("CLIENTE@EXAMPLE.COM"));
        var authenticated = await fixture.Service.VerifyOtpAsync(
            new VerifyOtpCommand("cliente@example.com", fixture.Sender.LastCode!));

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

        var exception = await Assert.ThrowsAsync<AuthenticationException>(() =>
            fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com")));

        Assert.Equal("otp_resend_too_soon", exception.Code);
    }

    [Fact]
    public async Task RequestOtp_ForwardsSupportedLocaleToSender()
    {
        var fixture = new AuthenticationFixture();

        await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com", "fr"));

        Assert.Equal("fr", fixture.Sender.LastMessage?.Locale);
        Assert.Equal(10, fixture.Sender.LastMessage?.LifetimeMinutes);
    }

    [Fact]
    public async Task RequestOtp_WithUnknownLocale_FallsBackToPortuguese()
    {
        var fixture = new AuthenticationFixture();

        await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com", "en"));

        Assert.Equal("pt", fixture.Sender.LastMessage?.Locale);
    }

    [Fact]
    public async Task RequestOtp_WhenDeliveryFails_InvalidatesChallenge()
    {
        var fixture = new AuthenticationFixture(senderShouldFail: true);

        var exception = await Assert.ThrowsAsync<AuthenticationException>(() =>
            fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com")));

        Assert.Equal("otp_delivery_failed", exception.Code);
        Assert.False(fixture.OtpChallenges.Items[0].IsUsableAt(Now));
        Assert.Equal(OtpDeliveryStatus.Failed, fixture.OtpChallenges.Items[0].DeliveryStatus);
    }

    [Fact]
    public async Task RequestOtp_AfterDeliveryFailure_CanRetryImmediately()
    {
        var fixture = new AuthenticationFixture(senderShouldFail: true);
        await Assert.ThrowsAsync<AuthenticationException>(() =>
            fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com")));

        fixture.Sender.ShouldFail = false;
        var result = await fixture.Service.RequestOtpAsync(new RequestOtpCommand("cliente@example.com"));

        Assert.Equal(60, result.ResendAfterSeconds);
        Assert.Equal(2, fixture.OtpChallenges.Items.Count);
        Assert.Equal(OtpDeliveryStatus.Sent, fixture.OtpChallenges.Items[1].DeliveryStatus);
    }

    private sealed class AuthenticationFixture
    {
        public CustomerMemoryRepository Customers { get; } = new();
        public OtpMemoryRepository OtpChallenges { get; } = new();
        public RefreshTokenMemoryRepository RefreshTokens { get; } = new();
        public CapturingOtpSender Sender { get; } = new();
        public AuthenticationService Service { get; }

        public AuthenticationFixture(bool senderShouldFail = false)
        {
            Sender.ShouldFail = senderShouldFail;
            var hasher = new TestHasher();
            Service = new AuthenticationService(
                Customers,
                OtpChallenges,
                RefreshTokens,
                new UnitOfWorkStub(),
                new ClockStub(),
                new OtpGeneratorStub(),
                hasher,
                Sender,
                new TokenServiceStub(),
                new CustomerProjectionStub(),
                new AuthenticationOptions());
        }
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
        public Task<OtpChallenge?> FindLatestSentAsync(EmailAddress email, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items
                .Where(item => item.Email == email && item.DeliveryStatus == OtpDeliveryStatus.Sent)
                .OrderByDescending(item => item.SentAt)
                .FirstOrDefault());
        public void Add(OtpChallenge challenge) => Items.Add(challenge);
    }

    private sealed class RefreshTokenMemoryRepository : IRefreshTokenRepository
    {
        public List<RefreshToken> Items { get; } = [];
        public Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.TokenHash == tokenHash));
        public void Add(RefreshToken refreshToken) => Items.Add(refreshToken);
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

    private sealed class CapturingOtpSender : IOtpSender
    {
        public string? LastCode { get; private set; }
        public OtpEmail? LastMessage { get; private set; }
        public bool ShouldFail { get; set; }
        public Task SendAsync(OtpEmail message, CancellationToken cancellationToken = default)
        {
            if (ShouldFail) throw new InvalidOperationException("SMTP unavailable");
            LastMessage = message;
            LastCode = message.Code;
            return Task.CompletedTask;
        }
    }

    private sealed class TokenServiceStub : ITokenService
    {
        public IssuedTokens Issue(Guid customerId, EmailAddress email) =>
            new("access-token", "refresh-token", Now.AddMinutes(15));
    }

    private sealed class CustomerProjectionStub : ICustomerProjection
    {
        public Task UpsertAsync(Customer customer, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
