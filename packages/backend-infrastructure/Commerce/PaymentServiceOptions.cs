namespace PriscilaSkincare.Infrastructure.Commerce;

public sealed class PaymentServiceOptions
{
    public const string SectionName = "Payments";
    public string BaseUrl { get; init; } = string.Empty;
    public string InternalApiKey { get; init; } = string.Empty;
    public int TimeoutSeconds { get; init; } = 15;
}
