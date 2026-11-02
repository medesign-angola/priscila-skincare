using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Notifications;
using PriscilaSkincare.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class OrderEmailOutbox(ApplicationDbContext db) : IOrderEmailOutbox
{
    public void Enqueue(OrderConfirmationEmail message, DateTimeOffset now)
    {
        var kind = string.Equals(message.Status, "Delivered", StringComparison.OrdinalIgnoreCase)
            ? "order-delivered"
            : message.Pickup is not null && string.Equals(message.Status, "Shipped", StringComparison.OrdinalIgnoreCase)
                ? "order-pickup-ready" : "order-confirmation";
        db.EmailOutboxMessages.Add(EmailOutboxMessage.Create(
            kind, message.OrderId, message.RecipientEmail,
            JsonSerializer.Serialize(message), now));
    }

    public async Task RemovePersonalDataAsync(IReadOnlyCollection<Guid> orderIds, CancellationToken cancellationToken = default)
    {
        if (orderIds.Count == 0) return;

        // MySql.EntityFrameworkCore cannot reliably infer a type mapping for a
        // collection parameter used by Contains here. Querying by the scalar Guid
        // keeps the comparison fully typed and avoids generating an untyped
        // @orderIds parameter during account anonymisation.
        foreach (var orderId in orderIds.Distinct())
        {
            var messages = await db.EmailOutboxMessages
                .Where(message => message.AggregateId == orderId)
                .ToListAsync(cancellationToken);
            db.EmailOutboxMessages.RemoveRange(messages);
        }
    }
}
