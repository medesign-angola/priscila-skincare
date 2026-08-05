namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class SmtpEmailOptions
{
    public const string SectionName = "Email";

    public string DeliveryMode { get; init; } = "Log";
    public string Host { get; init; } = string.Empty;
    public int Port { get; init; } = 587;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FromEmail { get; init; } = string.Empty;
    public string FromName { get; init; } = string.Empty;
    public int TimeoutSeconds { get; init; } = 30;
}
