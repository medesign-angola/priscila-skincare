using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Notifications;

public enum EmailOutboxStatus { Pending, Sent, Failed }

public sealed class EmailOutboxMessage : Entity<Guid>
{
    private EmailOutboxMessage() : base(Guid.Empty) { }

    private EmailOutboxMessage(Guid id, string kind, Guid aggregateId, string recipient, string payload, DateTimeOffset now)
        : base(id)
    {
        Kind = kind;
        AggregateId = aggregateId;
        Recipient = recipient;
        Payload = payload;
        CreatedAt = now;
        NextAttemptAt = now;
    }

    public string Kind { get; private set; } = string.Empty;
    public Guid AggregateId { get; private set; }
    public string Recipient { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public EmailOutboxStatus Status { get; private set; } = EmailOutboxStatus.Pending;
    public int Attempts { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset NextAttemptAt { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }
    public string? LastError { get; private set; }

    public static EmailOutboxMessage Create(string kind, Guid aggregateId, string recipient, string payload, DateTimeOffset now) =>
        new(Guid.NewGuid(), kind.Trim(), aggregateId, recipient.Trim(), payload, now);

    public void MarkSent(DateTimeOffset now)
    {
        Status = EmailOutboxStatus.Sent;
        SentAt = now;
        LastError = null;
    }

    public void ScheduleRetry(string error, DateTimeOffset now, int maxAttempts)
    {
        Attempts++;
        LastError = error.Length > 1_000 ? error[..1_000] : error;
        if (Attempts >= maxAttempts)
        {
            Status = EmailOutboxStatus.Failed;
            return;
        }

        var delayMinutes = Attempts switch { 1 => 1, 2 => 5, 3 => 15, _ => 60 };
        NextAttemptAt = now.AddMinutes(delayMinutes);
    }
}
