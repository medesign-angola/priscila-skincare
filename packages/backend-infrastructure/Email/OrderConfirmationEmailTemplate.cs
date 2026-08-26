using System.Globalization;
using System.Net;
using System.Text;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed record RenderedEmail(string Subject, string Html, string Text);

internal static class OrderConfirmationEmailTemplate
{
    public static RenderedEmail Render(OrderConfirmationEmail message, SmtpEmailOptions options)
    {
        var french = message.Locale.StartsWith("fr", StringComparison.OrdinalIgnoreCase);
        var culture = CultureInfo.GetCultureInfo(french ? "fr-FR" : "pt-AO");
        string Money(decimal value) => message.Currency == "AOA"
            ? $"Kz {value.ToString("N2", culture)}"
            : $"{value.ToString("N2", culture)} €";
        string E(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

        var subject = french ? $"Commande {message.OrderNumber} confirmée" : $"Encomenda {message.OrderNumber} confirmada";
        var greeting = french ? $"Bonjour {message.CustomerName ?? message.Address.Recipient}," : $"Olá {message.CustomerName ?? message.Address.Recipient},";
        var intro = french ? "Votre commande a bien été confirmée. Voici les détails de votre achat."
            : "A sua encomenda foi confirmada. Aqui estão os detalhes da sua compra.";
        var items = new StringBuilder();
        var textItems = new StringBuilder();
        foreach (var item in message.Items)
        {
            items.Append($"<tr><td style=\"padding:14px 0;border-bottom:1px solid #ddd7ce\"><strong>{E(item.Name)}</strong>{(string.IsNullOrWhiteSpace(item.Variant) ? "" : $"<br><span style=\"color:#6d675f\">{E(item.Variant)}</span>")}</td><td style=\"padding:14px;text-align:center;border-bottom:1px solid #ddd7ce\">{item.Quantity}</td><td style=\"padding:14px 0;text-align:right;border-bottom:1px solid #ddd7ce\">{E(Money(item.Total))}</td></tr>");
            textItems.AppendLine($"- {item.Name}{(string.IsNullOrWhiteSpace(item.Variant) ? "" : $" ({item.Variant})")} x{item.Quantity}: {Money(item.Total)}");
        }

        var address = $"{message.Address.Street}{(string.IsNullOrWhiteSpace(message.Address.HouseNumber) ? "" : ", " + message.Address.HouseNumber)}, {message.Address.Neighborhood}, {message.Address.City}, {message.Address.Province}, {message.Address.Country}";
        var orderUrl = $"{options.StorefrontUrl.TrimEnd('/')}/conta/encomendas/{message.OrderId}";
        var html = $$"""
        <!doctype html><html><body style="margin:0;background:#f5f1eb;font-family:Arial,sans-serif;color:#171717">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff">
        <tr><td style="padding:30px 36px;background:#6d5638;color:#fff"><div style="font-family:Georgia,serif;font-size:26px">Priscila Araújo</div><div style="font-size:12px;letter-spacing:2px;margin-top:4px">SKINCARE</div></td></tr>
        <tr><td style="padding:36px"><h1 style="font-size:24px;margin:0 0 20px">{{E(subject)}}</h1><p style="font-size:16px;line-height:1.6">{{E(greeting)}}</p><p style="font-size:16px;line-height:1.6">{{E(intro)}}</p>
        <div style="margin:28px 0;padding:18px;background:#f8f5f0"><strong>{{(french ? "Numéro de commande" : "Número da encomenda")}}:</strong> {{E(message.OrderNumber)}}<br><span style="color:#6d675f">{{message.PlacedAt.ToString("dd/MM/yyyy HH:mm", culture)}}</span></div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><thead><tr><th align="left">{{(french ? "Article" : "Produto")}}</th><th>{{(french ? "Qté" : "Qtd.")}}</th><th align="right">{{(french ? "Total" : "Total")}}</th></tr></thead><tbody>{{items}}</tbody></table>
        <table role="presentation" width="100%" style="margin-top:22px"><tr><td>{{(french ? "Sous-total" : "Subtotal")}}</td><td align="right">{{E(Money(message.Subtotal))}}</td></tr><tr><td style="padding-top:8px">{{(french ? "Livraison" : "Entrega")}}</td><td align="right" style="padding-top:8px">{{E(Money(message.Shipping))}}</td></tr><tr><td style="padding-top:12px;font-size:18px"><strong>Total</strong></td><td align="right" style="padding-top:12px;font-size:18px"><strong>{{E(Money(message.Total))}}</strong></td></tr></table>
        <h2 style="font-size:17px;margin:30px 0 10px">{{(french ? "Adresse de livraison" : "Morada de entrega")}}</h2><p style="line-height:1.6;margin:0">{{E(message.Address.Recipient)}}<br>{{E(address)}}<br>{{E(message.Address.Phone)}}</p>
        <p style="margin:32px 0 0"><a href="{{E(orderUrl)}}" style="display:inline-block;background:#8a7049;color:#fff;text-decoration:none;padding:15px 24px;font-weight:bold">{{(french ? "VOIR MA COMMANDE" : "VER A MINHA ENCOMENDA")}}</a></p>
        </td></tr><tr><td style="padding:22px 36px;background:#171717;color:#fff;font-size:12px;line-height:1.6">{{(french ? "Besoin d'aide ?" : "Precisa de ajuda?")}} {{E(options.SupportEmail)}}</td></tr></table>
        </td></tr></table></body></html>
        """;
        var text = $"{subject}\n\n{greeting}\n{intro}\n\n{message.OrderNumber}\n{textItems}\nSubtotal: {Money(message.Subtotal)}\nEntrega: {Money(message.Shipping)}\nTotal: {Money(message.Total)}\n\n{address}\n{message.Address.Phone}\n\n{orderUrl}";
        return new(subject, html, text);
    }
}
