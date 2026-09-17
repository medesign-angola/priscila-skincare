using System.Net.Http.Json;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class RemoteOrderEmailSender(HttpClient client, NotificationServiceOptions options)
    : IOrderEmailSender
{
    public async Task SendAsync(OrderConfirmationEmail message,
        CancellationToken cancellationToken = default)
    {
        var delivered = string.Equals(message.Status, "Delivered", StringComparison.OrdinalIgnoreCase);
        var endpoint = delivered ? "api/v1/emails/order-delivered" : "api/v1/emails/order-confirmation";
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Add("X-Internal-Api-Key", options.InternalApiKey);
        request.Content = JsonContent.Create(new
        {
            idempotencyKey = delivered
                ? $"order-delivered-{message.OrderId}"
                : $"order-confirmation-{message.OrderId}",
            message.OrderId,
            message.OrderNumber,
            message.RecipientEmail,
            message.CustomerName,
            message.Locale,
            message.PlacedAt,
            message.Status,
            message.PaymentStatus,
            message.Currency,
            message.Subtotal,
            message.Shipping,
            message.Total,
            message.Items,
            message.Address
        });
        var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Notifications respondeu {(int)response.StatusCode}.");
    }
}
