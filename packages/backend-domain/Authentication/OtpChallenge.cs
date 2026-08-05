using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Authentication;

public enum OtpDeliveryStatus
{
    Pending,
    Sent,
    Failed
}

public sealed class OtpChallenge : AggregateRoot<Guid>
{
    private OtpChallenge() : base(Guid.Empty) { }

    private OtpChallenge(Guid id, EmailAddress email, string codeHash, DateTimeOffset createdAt, DateTimeOffset expiresAt) : base(id)
    {
        Email = email;
        CodeHash = codeHash;
        CreatedAt = createdAt;
        ExpiresAt = expiresAt;
    }

    public EmailAddress Email { get; private set; } = null!;
    public string CodeHash { get; private set; } = string.Empty;
    public int FailedAttempts { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? ConsumedAt { get; private set; }
    public OtpDeliveryStatus DeliveryStatus { get; private set; } = OtpDeliveryStatus.Pending;
    public DateTimeOffset? SentAt { get; private set; }

    public bool IsUsableAt(DateTimeOffset now) =>
        DeliveryStatus == OtpDeliveryStatus.Sent && ConsumedAt is null && now < ExpiresAt && FailedAttempts < 5;

    public static OtpChallenge Create(EmailAddress email, string codeHash, DateTimeOffset now, TimeSpan lifetime) =>
        new(Guid.NewGuid(), email, codeHash, now, now.Add(lifetime));

    public void RegisterFailedAttempt() => FailedAttempts++;

    public void MarkSent(DateTimeOffset now)
    {
        if (DeliveryStatus != OtpDeliveryStatus.Pending)
            throw new InvalidOperationException("O envio do código já foi finalizado.");

        DeliveryStatus = OtpDeliveryStatus.Sent;
        SentAt = now;
    }

    public void MarkDeliveryFailed()
    {
        if (DeliveryStatus != OtpDeliveryStatus.Pending)
            throw new InvalidOperationException("O envio do código já foi finalizado.");

        DeliveryStatus = OtpDeliveryStatus.Failed;
    }

    public void Consume(DateTimeOffset now)
    {
        if (!IsUsableAt(now)) throw new InvalidOperationException("O código já não pode ser utilizado.");
        ConsumedAt = now;
    }
}
