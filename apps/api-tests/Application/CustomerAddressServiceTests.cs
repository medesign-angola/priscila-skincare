using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Customers;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Api.Tests.Application;

public sealed class CustomerAddressServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 3, 18, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task FirstAddress_BecomesDefaultAutomatically()
    {
        var fixture = new Fixture();
        var result = await fixture.Service.CreateAsync(fixture.Customer.Id, Command());
        Assert.True(result.IsDefault);
    }

    [Fact]
    public async Task NewDefaultAddress_ReplacesPreviousDefault()
    {
        var fixture = new Fixture();
        var first = await fixture.Service.CreateAsync(fixture.Customer.Id, Command("Casa"));
        var second = await fixture.Service.CreateAsync(fixture.Customer.Id, Command("Trabalho") with { IsDefault = true });
        Assert.False(fixture.Addresses.Items.Single(item => item.Id == first.Id).IsDefault);
        Assert.True(second.IsDefault);
    }

    [Fact]
    public async Task AddressFromAnotherCustomer_IsNotAccessible()
    {
        var fixture = new Fixture();
        var other = Customer.Register(EmailAddress.Create("other@example.com"), Now);
        fixture.Customers.Items.Add(other);
        var address = await fixture.Service.CreateAsync(fixture.Customer.Id, Command());

        var exception = await Assert.ThrowsAsync<AddressException>(() =>
            fixture.Service.UpdateAsync(other.Id, address.Id, Command()));

        Assert.Equal("address_not_found", exception.Code);
    }

    [Fact]
    public async Task MaximumFiveAddresses_IsEnforced()
    {
        var fixture = new Fixture();
        for (var index = 0; index < 5; index++)
            await fixture.Service.CreateAsync(fixture.Customer.Id, Command($"Morada {index + 1}"));

        var exception = await Assert.ThrowsAsync<AddressException>(() =>
            fixture.Service.CreateAsync(fixture.Customer.Id, Command("Morada 6")));

        Assert.Equal("address_limit_reached", exception.Code);
    }

    private static SaveAddressCommand Command(string label = "Casa") => new(
        label, "Cliente", "+244 900 000 000", "Angola", "Luanda", "Talatona",
        "Benfica", "Rua Principal", "10", null, null);

    private sealed class Fixture
    {
        public Customer Customer { get; } = Customer.Register(EmailAddress.Create("client@example.com"), Now);
        public CustomerRepository Customers { get; } = new();
        public AddressRepository Addresses { get; } = new();
        public CustomerAddressService Service { get; }

        public Fixture()
        {
            Customers.Items.Add(Customer);
            Service = new CustomerAddressService(Customers, Addresses, new UnitOfWork(), new Clock());
        }
    }

    private sealed class CustomerRepository : ICustomerRepository
    {
        public List<Customer> Items { get; } = [];
        public Task<Customer?> FindByEmailAsync(EmailAddress email, CancellationToken cancellationToken = default) => Task.FromResult(Items.SingleOrDefault(item => item.Email == email));
        public Task<Customer?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Items.SingleOrDefault(item => item.Id == id));
        public void Add(Customer customer) => Items.Add(customer);
    }

    private sealed class AddressRepository : ICustomerAddressRepository
    {
        public List<CustomerAddress> Items { get; } = [];
        public Task<IReadOnlyList<CustomerAddress>> ListAsync(Guid customerId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<CustomerAddress>>(Items.Where(item => item.CustomerId == customerId).ToArray());
        public Task<CustomerAddress?> FindAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default) => Task.FromResult(Items.SingleOrDefault(item => item.CustomerId == customerId && item.Id == addressId));
        public void Add(CustomerAddress address) => Items.Add(address);
        public void Remove(CustomerAddress address) => Items.Remove(address);
    }

    private sealed class UnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
    }

    private sealed class Clock : IClock
    {
        public DateTimeOffset UtcNow => Now;
    }
}
