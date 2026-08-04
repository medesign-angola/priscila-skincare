using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Authentication;

public sealed class RefreshToken : Entity<Guid>
{
    private RefreshToken() : base(Guid.Empty) { }

    private RefreshToken(Guid id, Guid customerId, string tokenHash, DateTimeOffset createdAt, DateTimeOffset expiresAt) : base(id)
    {
        CustomerId = customerId;
        TokenHash = tokenHash;
        CreatedAt = createdAt;
        ExpiresAt = expiresAt;
    }

    public Guid CustomerId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }

    public static RefreshToken Issue(Guid customerId, string tokenHash, DateTimeOffset now, TimeSpan lifetime) =>
        new(Guid.NewGuid(), customerId, tokenHash, now, now.Add(lifetime));

    public bool IsUsableAt(DateTimeOffset now) => RevokedAt is null && now < ExpiresAt;

    public void Revoke(DateTimeOffset now) => RevokedAt ??= now;
}
