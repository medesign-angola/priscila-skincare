using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Notifications;
using PriscilaSkincare.Infrastructure.Persistence;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class OrderEmailOutbox(ApplicationDbContext db) : IOrderEmailOutbox
{
    public void Enqueue(OrderConfirmationEmail message, DateTimeOffset now)
    {
        db.EmailOutboxMessages.Add(EmailOutboxMessage.Create(
            "order-confirmation", message.OrderId, message.RecipientEmail,
            JsonSerializer.Serialize(message), now));
    }
}
