using Microsoft.EntityFrameworkCore;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Integration;

namespace PriscilaSkincare.Infrastructure.Persistence;

internal sealed class IntegrationMessageStore(ApplicationDbContext db) : IIntegrationOutbox, IIntegrationInbox
{
    public void Add(IntegrationOutboxMessage message) => db.IntegrationOutboxMessages.Add(message);
    public Task<bool> ContainsAsync(Guid eventId, CancellationToken cancellationToken = default) =>
        db.IntegrationInboxMessages.AnyAsync(x => x.Id == eventId, cancellationToken);
    public void Add(IntegrationInboxMessage message) => db.IntegrationInboxMessages.Add(message);
}
