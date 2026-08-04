using Microsoft.Extensions.Logging;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Authentication;

internal sealed class DevelopmentOtpSender(ILogger<DevelopmentOtpSender> logger) : IOtpSender
{
    public Task SendAsync(OtpEmail message, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Código OTP de desenvolvimento para {Recipient}: {OtpCode}",
            message.Recipient.Value,
            message.Code);
        return Task.CompletedTask;
    }
}
