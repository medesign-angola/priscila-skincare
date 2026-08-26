using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class SmtpOrderEmailSender(SmtpEmailOptions options, ILogger<SmtpOrderEmailSender> logger)
    : IOrderEmailSender
{
    public async Task SendAsync(OrderConfirmationEmail message, CancellationToken cancellationToken = default)
    {
        var rendered = OrderConfirmationEmailTemplate.Render(message, options);
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(options.FromName, options.FromEmail));
        email.To.Add(MailboxAddress.Parse(message.RecipientEmail));
        email.Subject = rendered.Subject;
        email.Body = new BodyBuilder { HtmlBody = rendered.Html, TextBody = rendered.Text }.ToMessageBody();

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(options.TimeoutSeconds));
        using var client = new SmtpClient { Timeout = checked(options.TimeoutSeconds * 1_000) };
        await client.ConnectAsync(options.Host, options.Port, SecureSocketOptions.StartTls, timeout.Token);
        await client.AuthenticateAsync(options.Username, options.Password, timeout.Token);
        await client.SendAsync(email, timeout.Token);
        await client.DisconnectAsync(true, timeout.Token);
        logger.LogInformation("Confirmação da encomenda {OrderNumber} enviada para {Recipient}.", message.OrderNumber, message.RecipientEmail);
    }
}
