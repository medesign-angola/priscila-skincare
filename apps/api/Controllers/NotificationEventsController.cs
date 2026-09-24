using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Integration;

namespace PriscilaSkincare.Api.Controllers;

[ApiController, AllowAnonymous, Route("api/v1/integrations/notifications")]
public sealed class NotificationEventsController(
    AuthenticationService authentication,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("results")]
    public async Task<IActionResult> Result(
        IntegrationEvent<OtpDeliveryResultEvent> message,
        CancellationToken cancellationToken)
    {
        var expected = configuration["Notifications:InternalApiKey"] ?? string.Empty;
        var supplied = Request.Headers["X-Internal-Api-Key"].ToString();
        if (!SecureEquals(expected, supplied)) return Unauthorized();
        await authentication.ApplyOtpDeliveryResultAsync(
            message.EventId, message.Data, cancellationToken);
        return Accepted();
    }

    private static bool SecureEquals(string expected, string supplied)
    {
        if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(supplied)) return false;
        var left = Encoding.UTF8.GetBytes(expected);
        var right = Encoding.UTF8.GetBytes(supplied);
        return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
    }
}
