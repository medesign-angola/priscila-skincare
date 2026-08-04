namespace PriscilaSkincare.Application.Authentication;

public sealed record RequestOtpCommand(string Email, string Locale = "pt");
public sealed record VerifyOtpCommand(string Email, string Code, bool AcceptsMarketing = false);
public sealed record RefreshSessionCommand(string RefreshToken);
public sealed record LogoutCommand(string RefreshToken);
public sealed record OtpRequestResult(DateTimeOffset ExpiresAt, int ResendAfterSeconds);
public sealed record AuthenticatedCustomer(Guid Id, string Email, string? Name, string? Phone, bool AcceptsMarketing);
public sealed record AuthenticationResult(Guid CustomerId, string AccessToken, string RefreshToken, DateTimeOffset ExpiresAt);
