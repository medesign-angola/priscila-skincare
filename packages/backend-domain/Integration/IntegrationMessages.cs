using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Integration;

public enum OutboxMessageStatus { Pending, Published, Failed }

public sealed class IntegrationOutboxMessage : Entity<Guid>
{
    private IntegrationOutboxMessage() : base(Guid.Empty) { }
    private IntegrationOutboxMessage(Guid id, string type, string destination, string payload,
        DateTimeOffset now) : base(id)
    {
        Type = type;
        Destination = destination;
        Payload = payload;
        CreatedAt = now;
        NextAttemptAt = now;
    }

    public string Type { get; private set; } = string.Empty;
    public string Destination { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public OutboxMessageStatus Status { get; private set; } = OutboxMessageStatus.Pending;
    public int Attempts { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset NextAttemptAt { get; private set; }
    public DateTimeOffset? PublishedAt { get; private set; }
    public string? LastError { get; private set; }

    public static IntegrationOutboxMessage Create(Guid eventId, string type, string destination,
        string payload, DateTimeOffset now) =>
        new(eventId, type.Trim(), destination.Trim(), payload, now);

    public void MarkPublished(DateTimeOffset now)
    {
        Status = OutboxMessageStatus.Published;
        PublishedAt = now;
        LastError = null;
    }

    public void ScheduleRetry(string error, DateTimeOffset now, int maxAttempts)
    {
        Attempts++;
        LastError = error.Length > 1_000 ? error[..1_000] : error;
        if (Attempts >= maxAttempts) { Status = OutboxMessageStatus.Failed; return; }
        NextAttemptAt = now.AddSeconds(Math.Min(300, Math.Pow(2, Attempts) * 5));
    }
}

public sealed class IntegrationInboxMessage : Entity<Guid>
{
    private IntegrationInboxMessage() : base(Guid.Empty) { }
    private IntegrationInboxMessage(Guid eventId, string type, DateTimeOffset processedAt) : base(eventId)
    { Type = type; ProcessedAt = processedAt; }

    public string Type { get; private set; } = string.Empty;
    public DateTimeOffset ProcessedAt { get; private set; }

    public static IntegrationInboxMessage Receive(Guid eventId, string type, DateTimeOffset now) =>
        new(eventId, type.Trim(), now);
}
