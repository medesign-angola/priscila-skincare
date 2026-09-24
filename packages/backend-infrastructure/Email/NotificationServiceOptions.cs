namespace PriscilaSkincare.Infrastructure.Email;

public sealed class NotificationServiceOptions
{
    public const string SectionName = "Notifications";
    public string BaseUrl { get; init; } = "http://localhost:5052";
    public string InternalApiKey { get; init; } = string.Empty;
    public int TimeoutSeconds { get; init; } = 15;
}
