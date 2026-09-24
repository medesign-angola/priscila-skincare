using System.Security.Cryptography;
using System.Text;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Orders;
using PriscilaSkincare.Infrastructure.Commerce;

namespace PriscilaSkincare.Api.Controllers;

[ApiController, AllowAnonymous, Route("api/v1/integrations/strapi/orders")]
public sealed class OrderIntegrationsController(OrderService orders, IConfiguration configuration,
    IHttpClientFactory clients, PaymentServiceOptions payments,
    ILogger<OrderIntegrationsController> logger) : ControllerBase
{
    [HttpPost("{orderId:guid}/status")]
    public async Task<IActionResult> Change(Guid orderId, ChangeOrderStatusRequest request, CancellationToken token)
    {
        var expected = configuration["Strapi:IntegrationSecret"] ?? string.Empty;
        var supplied = Request.Headers["X-Integration-Secret"].ToString();
        if (!SecureEquals(expected, supplied)) return Unauthorized();
        await orders.ChangeStatusAsync(orderId, request.Status, token, synchronizeProjection: false);
        return NoContent();
    }

    [HttpPost("{orderId:guid}/payment")]
    public async Task<IActionResult> ChangePayment(Guid orderId, ChangePaymentStatusRequest request, CancellationToken token)
    {
        var expected = configuration["Strapi:IntegrationSecret"] ?? string.Empty;
        var supplied = Request.Headers["X-Integration-Secret"].ToString();
        if (!SecureEquals(expected, supplied)) return Unauthorized();
        var command = await orders.BuildManualPaymentRequestAsync(orderId, request.Status, token);
        using var outbound = new HttpRequestMessage(HttpMethod.Post, "api/v1/payments/manual-result");
        outbound.Headers.Add("X-Internal-Api-Key", payments.InternalApiKey);
        outbound.Content = JsonContent.Create(command);
        HttpResponseMessage response;
        try
        {
            response = await clients.CreateClient("integration-payments").SendAsync(outbound, token);
        }
        catch (HttpRequestException exception)
        {
            logger.LogError(exception, "Serviço de pagamentos indisponível ao processar manualmente {OrderId}.", orderId);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                title = "Não foi possível atualizar o pagamento agora. Tente novamente.",
                code = "payment_service_unavailable"
            });
        }
        catch (TaskCanceledException exception) when (!token.IsCancellationRequested)
        {
            logger.LogError(exception, "Timeout ao atualizar o pagamento da encomenda {OrderId}.", orderId);
            return StatusCode(StatusCodes.Status504GatewayTimeout, new
            {
                title = "A atualização está a demorar mais do que o esperado. Tente novamente.",
                code = "payment_service_timeout"
            });
        }
        using (response)
        {
            if (response.IsSuccessStatusCode) return Accepted();
            var problem = await response.Content.ReadFromJsonAsync<PaymentServiceProblem>(cancellationToken: token);
            logger.LogWarning("Atualização manual de {OrderId} recusada: {Status} {Code}.",
                orderId, (int)response.StatusCode, problem?.Code);
            return StatusCode((int)response.StatusCode, new
            {
                title = response.StatusCode == System.Net.HttpStatusCode.Conflict && problem?.Title is not null
                    ? problem.Title
                    : "Não foi possível atualizar o pagamento. Confirme os dados e tente novamente.",
                code = problem?.Code ?? "payment_service_error"
            });
        }
    }
    private static bool SecureEquals(string expected, string supplied)
    {
        if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(supplied)) return false;
        var left = Encoding.UTF8.GetBytes(expected); var right = Encoding.UTF8.GetBytes(supplied);
        return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
    }
}
public sealed record ChangeOrderStatusRequest(string Status);
public sealed record ChangePaymentStatusRequest(string Status);
public sealed record PaymentServiceProblem(string? Code, string? Title);
