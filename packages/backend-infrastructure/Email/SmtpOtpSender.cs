using System.Diagnostics;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
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
        var rendered = OtpEmailTemplate.Render(message);
        email.Subject = rendered.Subject;
        builder.HtmlBody = rendered.Html;
        builder.TextBody = rendered.Text;
        email.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        client.Timeout = checked(options.TimeoutSeconds * 1_000);
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(options.TimeoutSeconds));

        var stopwatch = Stopwatch.StartNew();
        var stage = "conexão";
        try
        {
            logger.LogInformation("SMTP OTP: iniciando conexão com {Host}:{Port}.", options.Host, options.Port);
            await client.ConnectAsync(options.Host, options.Port, SecureSocketOptions.StartTls, timeout.Token);
            logger.LogInformation("SMTP OTP: conexão concluída em {ElapsedMs} ms.", stopwatch.ElapsedMilliseconds);

            stage = "autenticação";
            stopwatch.Restart();
            logger.LogInformation("SMTP OTP: iniciando autenticação.");
            await client.AuthenticateAsync(options.Username, options.Password, timeout.Token);
            logger.LogInformation("SMTP OTP: autenticação concluída em {ElapsedMs} ms.", stopwatch.ElapsedMilliseconds);

            stage = "envio";
            stopwatch.Restart();
            logger.LogInformation("SMTP OTP: iniciando envio para {Recipient}.", message.Recipient.Value);
            await client.SendAsync(email, timeout.Token);
            logger.LogInformation("SMTP OTP: envio confirmado em {ElapsedMs} ms.", stopwatch.ElapsedMilliseconds);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogError("SMTP OTP: timeout durante a etapa de {Stage}, após o limite de {TimeoutSeconds} segundos.", stage, options.TimeoutSeconds);
            throw;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "SMTP OTP: falha durante a etapa de {Stage}.", stage);
            throw;
        }

        if (client.IsConnected)
        {
            using var disconnectTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            try
            {
                await client.DisconnectAsync(true, disconnectTimeout.Token);
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "SMTP OTP: o envio foi confirmado, mas a desconexão não terminou corretamente.");
            }
        }

        logger.LogInformation("E-mail OTP enviado para {Recipient}.", message.Recipient.Value);
    }
}
