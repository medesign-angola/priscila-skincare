namespace PriscilaSkincare.Application.Integration;

public sealed record IntegrationEvent<T>(Guid EventId, string Type, DateTimeOffset OccurredAt, T Data);

public sealed record PaymentRequestedEvent(Guid OrderId, decimal Amount, string Currency,
    string IdempotencyKey, string Locale);

public sealed record PaymentResultEvent(Guid OrderId, string Provider, string Reference,
    bool Approved, string? FailureCode, string Locale);

public sealed record OtpNotificationRequestedEvent(string IdempotencyKey, Guid ChallengeId,
    string RecipientEmail, string Code, string Locale, int LifetimeMinutes);

public sealed record OtpDeliveryResultEvent(Guid ChallengeId, string Status,
    DateTimeOffset? SentAt, string? FailureCode);
