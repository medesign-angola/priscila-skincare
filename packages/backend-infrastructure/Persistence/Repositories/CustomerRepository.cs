using Microsoft.EntityFrameworkCore;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Infrastructure.Persistence.Repositories;

internal sealed class CustomerRepository(ApplicationDbContext dbContext) : ICustomerRepository
{
    public Task<Customer?> FindByEmailAsync(EmailAddress email, CancellationToken cancellationToken = default) =>
        dbContext.Customers.SingleOrDefaultAsync(customer => customer.Email == email, cancellationToken);

    public Task<Customer?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Customers.SingleOrDefaultAsync(customer => customer.Id == id, cancellationToken);

    public void Add(Customer customer) => dbContext.Customers.Add(customer);
}
