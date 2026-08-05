using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Orders;

namespace PriscilaSkincare.Api.Controllers;

[ApiController, AllowAnonymous, Route("api/v1/integrations/strapi/orders")]
public sealed class OrderIntegrationsController(OrderService orders, IConfiguration configuration) : ControllerBase
{
    [HttpPost("{orderId:guid}/status")]
    public async Task<IActionResult> Change(Guid orderId, ChangeOrderStatusRequest request, CancellationToken token)
    {
        var expected = configuration["Strapi:IntegrationSecret"] ?? string.Empty;
        var supplied = Request.Headers["X-Integration-Secret"].ToString();
        if (!SecureEquals(expected, supplied)) return Unauthorized();
        await orders.ChangeStatusAsync(orderId, request.Status, token);
        return NoContent();
    }
    private static bool SecureEquals(string expected, string supplied)
    {
        if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(supplied)) return false;
        var left = Encoding.UTF8.GetBytes(expected); var right = Encoding.UTF8.GetBytes(supplied);
        return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
    }
}
public sealed record ChangeOrderStatusRequest(string Status);
