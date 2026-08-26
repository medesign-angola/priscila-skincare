using Microsoft.Extensions.Logging;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class DevelopmentOrderEmailSender(ILogger<DevelopmentOrderEmailSender> logger) : IOrderEmailSender
{
    public Task SendAsync(OrderConfirmationEmail message, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("E-mail de confirmação simulado: encomenda {OrderNumber}, destinatário {Recipient}, total {Total} {Currency}.",
            message.OrderNumber, message.RecipientEmail, message.Total, message.Currency);
        return Task.CompletedTask;
    }
}
