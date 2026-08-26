using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Notifications;
using PriscilaSkincare.Infrastructure.Persistence;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class OrderEmailOutboxWorker(
    IServiceScopeFactory scopeFactory,
    SmtpEmailOptions options,
    ILogger<OrderEmailOutboxWorker> logger) : BackgroundService
{
    private const int MaxAttempts = 5;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.OrderConfirmationEnabled)
        {
            logger.LogInformation("O envio de confirmações de encomenda está desativado.");
            return;
        }

        await ProcessPending(stoppingToken);
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(options.OutboxPollSeconds));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await ProcessPending(stoppingToken);
    }

    private async Task ProcessPending(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var sender = scope.ServiceProvider.GetRequiredService<IOrderEmailSender>();
            var now = DateTimeOffset.UtcNow;
            var messages = await db.EmailOutboxMessages
                .Where(x => x.Status == EmailOutboxStatus.Pending && x.NextAttemptAt <= now)
                .OrderBy(x => x.CreatedAt)
                .Take(10)
                .ToListAsync(cancellationToken);

            foreach (var entry in messages)
            {
                try
                {
                    var email = JsonSerializer.Deserialize<OrderConfirmationEmail>(entry.Payload)
                        ?? throw new InvalidOperationException("O conteúdo do e-mail de encomenda é inválido.");
                    await sender.SendAsync(email, cancellationToken);
                    entry.MarkSent(DateTimeOffset.UtcNow);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception exception)
                {
                    entry.ScheduleRetry(exception.Message, DateTimeOffset.UtcNow, MaxAttempts);
                    logger.LogError(exception,
                        "Falha ao enviar a confirmação da encomenda {AggregateId}; tentativa {Attempt} de {MaxAttempts}.",
                        entry.AggregateId, entry.Attempts, MaxAttempts);
                }

                await db.SaveChangesAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // encerramento normal da aplicação
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Não foi possível processar a fila de e-mails de encomenda.");
        }
    }
}
