using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Integration;
using PriscilaSkincare.Application.Orders;

namespace PriscilaSkincare.Api.Controllers;

[ApiController, AllowAnonymous, Route("api/v1/integrations/payments")]
public sealed class PaymentEventsController(OrderService orders, IConfiguration configuration) : ControllerBase
{
    [HttpPost("results")]
    public async Task<IActionResult> Result(
        IntegrationEvent<PaymentResultEvent> message,
        CancellationToken cancellationToken)
    {
        var expected = configuration["Payments:InternalApiKey"] ?? string.Empty;
        var supplied = Request.Headers["X-Internal-Api-Key"].ToString();
        if (!SecureEquals(expected, supplied)) return Unauthorized();
        await orders.ApplyPaymentResultAsync(message.EventId, message.Data, cancellationToken);
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
