using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;using MimeKit;
using MimeKit.Utils;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class SmtpOtpSender(
    SmtpEmailOptions options,
    ILogger<SmtpOtpSender> logger) : IOtpSender
{
    public async Task SendAsync(OtpEmail message, CancellationToken cancellationToken = default)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(options.FromName, options.FromEmail));
        email.To.Add(MailboxAddress.Parse(message.Recipient.Value));

        var builder = new BodyBuilder();
        var heroPath = Path.Combine(AppContext.BaseDirectory, "EmailAssets", "otp-model.jpg");
        var hero = builder.LinkedResources.Add(heroPath);
        hero.ContentId = MimeUtils.GenerateMessageId();

        var rendered = OtpEmailTemplate.Render(message, hero.ContentId);
        email.Subject = rendered.Subject;
        builder.HtmlBody = rendered.Html;
        builder.TextBody = rendered.Text;
        email.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(options.Host, options.Port, SecureSocketOptions.StartTls, cancellationToken);
        await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
        await client.SendAsync(email, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation("E-mail OTP enviado para {Recipient}.", message.Recipient.Value);
    }
}
