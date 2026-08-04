using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Authentication;

namespace PriscilaSkincare.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthenticationController(
    AuthenticationService authentication,
    AuthenticationOptions options) : ControllerBase
{
    private const string RefreshTokenCookie = "psc_refresh";

    [AllowAnonymous]
    [EnableRateLimiting("otp-request")]
    [HttpPost("otp/request")]
    public async Task<ActionResult<OtpRequestResponse>> RequestOtp(
        RequestOtpRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authentication.RequestOtpAsync(
            new RequestOtpCommand(request.Email, request.Locale),
            cancellationToken);
        return Ok(new OtpRequestResponse(result.ExpiresAt, result.ResendAfterSeconds));
    }

    [AllowAnonymous]
    [EnableRateLimiting("otp-verify")]
    [HttpPost("otp/verify")]
    public async Task<ActionResult<AuthenticationResponse>> VerifyOtp(
        VerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authentication.VerifyOtpAsync(
            new VerifyOtpCommand(request.Email, request.Code, request.AcceptsMarketing),
            cancellationToken);
        WriteRefreshTokenCookie(result.RefreshToken);
        return Ok(AuthenticationResponse.From(result));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthenticationResponse>> Refresh(
        CancellationToken cancellationToken)
    {
        var refreshToken = ReadRefreshTokenCookie();
        var result = await authentication.RefreshAsync(
            new RefreshSessionCommand(refreshToken),
            cancellationToken);
        WriteRefreshTokenCookie(result.RefreshToken);
        return Ok(AuthenticationResponse.From(result));
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        CancellationToken cancellationToken)
    {
        if (Request.Cookies.TryGetValue(RefreshTokenCookie, out var refreshToken))
        {
            await authentication.LogoutAsync(new LogoutCommand(refreshToken), cancellationToken);
        }
        Response.Cookies.Delete(RefreshTokenCookie, CookieOptions());
        return NoContent();
    }

    private string ReadRefreshTokenCookie() =>
        Request.Cookies.TryGetValue(RefreshTokenCookie, out var refreshToken)
            ? refreshToken
            : throw new AuthenticationException("refresh_token_missing", "A sessão expirou. Entre novamente.");

    private void WriteRefreshTokenCookie(string refreshToken) =>
        Response.Cookies.Append(RefreshTokenCookie, refreshToken, CookieOptions(DateTimeOffset.UtcNow.AddDays(options.RefreshTokenDays)));

    private CookieOptions CookieOptions(DateTimeOffset? expires = null) => new()
    {
        HttpOnly = true,
        Secure = Request.IsHttps,
        SameSite = SameSiteMode.Lax,
        Path = "/api/v1/auth",
        Expires = expires
    };
}

public sealed record RequestOtpRequest(string Email, string Locale = "pt");
public sealed record VerifyOtpRequest(string Email, string Code, bool AcceptsMarketing = false);
public sealed record OtpRequestResponse(DateTimeOffset ExpiresAt, int ResendAfterSeconds);
public sealed record AuthenticationResponse(
    Guid CustomerId,
    string AccessToken,
    DateTimeOffset ExpiresAt)
{
    public static AuthenticationResponse From(AuthenticationResult result) =>
        new(result.CustomerId, result.AccessToken, result.ExpiresAt);
}
