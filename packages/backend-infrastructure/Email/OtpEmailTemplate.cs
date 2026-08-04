using System.Net;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed record RenderedOtpEmail(string Subject, string Html, string Text);

internal static class OtpEmailTemplate
{
    public static RenderedOtpEmail Render(OtpEmail message, string heroContentId)
    {
        var french = message.Locale == "fr";
        var copy = french
            ? new Copy(
                "Votre code d’accès | Priscila Skincare",
                "VOTRE CODE D’ACCÈS",
                "Bonjour,",
                "Utilisez le code ci-dessous pour accéder en toute sécurité à votre compte Priscila Skincare.",
                $"Ce code est valable pendant {message.LifetimeMinutes} minutes.",
                "Si vous n’avez pas demandé ce code, vous pouvez ignorer cet e-mail.",
                "Beauté africaine, soutenue par la science.")
            : new Copy(
                "O seu código de acesso | Priscila Skincare",
                "O SEU CÓDIGO DE ACESSO",
                "Olá,",
                "Use o código abaixo para entrar com segurança na sua conta Priscila Skincare.",
                $"Este código é válido durante {message.LifetimeMinutes} minutos.",
                "Se não pediu este código, pode ignorar este e-mail.",
                "Beleza africana, sustentada pela ciência.");

        var code = WebUtility.HtmlEncode(message.Code);
        var html = $$"""
            <!doctype html>
            <html lang="{{message.Locale}}">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>{{WebUtility.HtmlEncode(copy.Subject)}}</title>
              <style>
                @media only screen and (max-width: 620px) {
                  .shell { width: 100% !important; }
                  .hero-cell { display: none !important; }
                  .content-cell { padding: 38px 26px !important; }
                  .headline { font-size: 34px !important; }
                }
              </style>
            </head>
            <body style="margin:0;background:#f3f0eb;color:#1c1b1a;font-family:Arial,Helvetica,sans-serif;">
              <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{{WebUtility.HtmlEncode(copy.Body)}}</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f0eb;padding:28px 12px;">
                <tr><td align="center">
                  <table role="presentation" class="shell" width="680" cellspacing="0" cellpadding="0" style="width:680px;max-width:100%;background:#ffffff;border-collapse:collapse;box-shadow:0 12px 38px rgba(54,42,28,.12);">
                    <tr>
                      <td class="content-cell" width="60%" valign="top" style="padding:48px 42px;">
                        <div style="color:#806a49;font-size:12px;font-weight:700;letter-spacing:1.5px;margin-bottom:58px;">PRISCILA ARAUJO<br>SKINCARE</div>
                        <div style="font-size:14px;font-weight:700;margin-bottom:18px;">{{WebUtility.HtmlEncode(copy.Greeting)}}</div>
                        <h1 class="headline" style="font-family:Georgia,'Times New Roman',serif;font-size:42px;line-height:.95;font-weight:500;letter-spacing:-1.3px;margin:0 0 24px;">{{WebUtility.HtmlEncode(copy.Title)}}</h1>
                        <p style="font-size:15px;line-height:1.65;margin:0 0 26px;color:#4d4943;">{{WebUtility.HtmlEncode(copy.Body)}}</p>
                        <div style="border:1.5px solid #806a49;background:#fbfaf8;padding:20px 18px;text-align:center;font-size:34px;font-weight:700;letter-spacing:10px;color:#806a49;">{{code}}</div>
                        <p style="font-size:13px;line-height:1.55;margin:18px 0 0;color:#6d675f;">{{WebUtility.HtmlEncode(copy.Expiry)}}</p>
                      </td>
                      <td class="hero-cell" width="40%" valign="bottom" style="background:#806a49;text-align:center;overflow:hidden;">
                        <img src="cid:{{heroContentId}}" width="270" alt="Priscila Skincare" style="display:block;width:270px;max-width:100%;height:auto;margin:0 auto;">
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="background:#1d1c1a;color:#ffffff;padding:24px 42px;">
                        <p style="font-size:12px;line-height:1.5;margin:0 0 7px;color:#d8d2c9;">{{WebUtility.HtmlEncode(copy.Warning)}}</p>
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;margin:0;">{{WebUtility.HtmlEncode(copy.Footer)}}</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        var text = $"{copy.Title}\n\n{copy.Body}\n\n{message.Code}\n\n{copy.Expiry}\n\n{copy.Warning}";
        return new RenderedOtpEmail(copy.Subject, html, text);
    }

    private sealed record Copy(
        string Subject,
        string Title,
        string Greeting,
        string Body,
        string Expiry,
        string Warning,
        string Footer);
}
