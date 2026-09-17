using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PriscilaSkincare.Domain.Integration;
using PriscilaSkincare.Infrastructure.Commerce;
using PriscilaSkincare.Infrastructure.Persistence;

namespace PriscilaSkincare.Infrastructure.Integration;

internal sealed class IntegrationOutboxWorker(
    IServiceScopeFactory scopes,
    IHttpClientFactory clients,
    PaymentServiceOptions payments,
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
                    if (!string.Equals(message.Destination, "payments", StringComparison.OrdinalIgnoreCase))
                        throw new InvalidOperationException($"Destino de integração desconhecido: {message.Destination}.");
                    using var request = new HttpRequestMessage(HttpMethod.Post,
                        "api/v1/events/payment-requested");
                    request.Headers.Add("X-Internal-Api-Key", payments.InternalApiKey);
                    request.Content = JsonContent.Create(System.Text.Json.JsonSerializer.Deserialize<object>(message.Payload));
                    var response = await clients.CreateClient("integration-payments")
                        .SendAsync(request, cancellationToken);
                    if (!response.IsSuccessStatusCode)
                        throw new HttpRequestException($"Payments respondeu {(int)response.StatusCode}.");
                    message.MarkPublished(DateTimeOffset.UtcNow);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
                catch (Exception exception)
                {
                    message.ScheduleRetry(exception.Message, DateTimeOffset.UtcNow, MaxAttempts);
                    logger.LogError(exception, "Falha ao publicar {EventId} ({Type}).", message.Id, message.Type);
                }
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { }
        catch (Exception exception) { logger.LogError(exception, "Falha ao processar a outbox de integração."); }
    }
}
