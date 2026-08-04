namespace PriscilaSkincare.Application.Authentication;

public sealed class AuthenticationOptions
{
    public const string SectionName = "Authentication";

    public int OtpLifetimeMinutes { get; init; } = 10;
    public int ResendCooldownSeconds { get; init; } = 60;
    public int RefreshTokenDays { get; init; } = 30;
}
