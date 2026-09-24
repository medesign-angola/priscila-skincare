using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PriscilaSkincare.Domain.Integration;
using PriscilaSkincare.Infrastructure.Commerce;
using PriscilaSkincare.Infrastructure.Email;
using PriscilaSkincare.Infrastructure.Persistence;

namespace PriscilaSkincare.Infrastructure.Integration;

internal sealed class IntegrationOutboxWorker(
    IServiceScopeFactory scopes,
    IHttpClientFactory clients,
    PaymentServiceOptions payments,
    NotificationServiceOptions notifications,
    ILogger<IntegrationOutboxWorker> logger) : BackgroundService
{
    private const int MaxAttempts = 8;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ProcessAsync(stoppingToken);
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));
        while (await timer.WaitForNextTickAsync(stoppingToken)) await ProcessAsync(stoppingToken);
    }

    private async Task ProcessAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var now = DateTimeOffset.UtcNow;
            var messages = await db.IntegrationOutboxMessages
                .Where(x => x.Status == OutboxMessageStatus.Pending && x.NextAttemptAt <= now)
                .OrderBy(x => x.CreatedAt).Take(20).ToListAsync(cancellationToken);

            foreach (var message in messages)
            {
                try
                {
                    var isPayments = string.Equals(message.Destination, "payments", StringComparison.OrdinalIgnoreCase);
                    var isNotifications = string.Equals(message.Destination, "notifications", StringComparison.OrdinalIgnoreCase);
                    if (!isPayments && !isNotifications)
                        throw new InvalidOperationException($"Destino de integração desconhecido: {message.Destination}.");
                    using var request = new HttpRequestMessage(HttpMethod.Post, isPayments
                        ? "api/v1/events/payment-requested"
                        : "api/v1/emails/otp");
                    request.Headers.Add("X-Internal-Api-Key",
                        isPayments ? payments.InternalApiKey : notifications.InternalApiKey);
                    request.Content = JsonContent.Create(System.Text.Json.JsonSerializer.Deserialize<object>(message.Payload));
                    var response = await clients.CreateClient(isPayments
                            ? "integration-payments"
                            : "integration-notifications")
                        .SendAsync(request, cancellationToken);
                    if (!response.IsSuccessStatusCode)
                        throw new HttpRequestException($"Payments respondeu {(int)response.StatusCode}.");
                    message.MarkPublished(DateTimeOffset.UtcNow);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
                catch (Exception exception)
                {
                    var notification = string.Equals(message.Destination, "notifications",
                        StringComparison.OrdinalIgnoreCase);
                    message.ScheduleRetry(exception.Message, DateTimeOffset.UtcNow,
                        notification ? 3 : MaxAttempts);
                    if (notification && message.Status == OutboxMessageStatus.Failed)
                    {
                        var challenge = await db.OtpChallenges.FindAsync([message.Id], cancellationToken);
                        if (challenge?.DeliveryStatus == PriscilaSkincare.Domain.Authentication.OtpDeliveryStatus.Pending)
                            challenge.MarkDeliveryFailed();
                    }
                    logger.LogError(exception, "Falha ao publicar {EventId} ({Type}).", message.Id, message.Type);
                }
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { }
        catch (Exception exception) { logger.LogError(exception, "Falha ao processar a outbox de integração."); }
    }
}
