using Microsoft.EntityFrameworkCore;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Infrastructure.Persistence.Repositories;

internal sealed class CustomerAddressRepository(ApplicationDbContext dbContext) : ICustomerAddressRepository
{
    public async Task<IReadOnlyList<CustomerAddress>> ListAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        await dbContext.CustomerAddresses
            .Where(address => address.CustomerId == customerId)
            .OrderByDescending(address => address.IsDefault)
            .ThenBy(address => address.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<CustomerAddress?> FindAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default) =>
        dbContext.CustomerAddresses.SingleOrDefaultAsync(
            address => address.CustomerId == customerId && address.Id == addressId,
            cancellationToken);

    public void Add(CustomerAddress address) => dbContext.CustomerAddresses.Add(address);
    public void Remove(CustomerAddress address) => dbContext.CustomerAddresses.Remove(address);
}
