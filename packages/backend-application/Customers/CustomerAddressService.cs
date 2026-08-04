using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Application.Customers;

public sealed class CustomerAddressService(
    ICustomerRepository customers,
    ICustomerAddressRepository addresses,
    IUnitOfWork unitOfWork,
    IClock clock)
{
    private const int MaximumAddresses = 5;

    public async Task<IReadOnlyList<CustomerAddressResult>> ListAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        await EnsureCustomerAsync(customerId, cancellationToken);
        return (await addresses.ListAsync(customerId, cancellationToken)).Select(Map).ToArray();
    }

    public async Task<CustomerAddressResult> CreateAsync(Guid customerId, SaveAddressCommand command, CancellationToken cancellationToken = default)
    {
        await EnsureCustomerAsync(customerId, cancellationToken);
        var current = await addresses.ListAsync(customerId, cancellationToken);
        if (current.Count >= MaximumAddresses)
            throw new AddressException("address_limit_reached", $"Só é possível guardar até {MaximumAddresses} moradas.");

        var now = clock.UtcNow;
        var makeDefault = current.Count == 0 || command.IsDefault;
        if (makeDefault) ClearDefault(current, now);
        var address = CustomerAddress.Create(
            customerId, command.Label, command.Recipient, command.Phone,
            command.Country, command.Province, command.City, command.Neighborhood,
            command.Street, command.HouseNumber, command.Apartment, command.PostalCode,
            makeDefault, now);
        addresses.Add(address);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(address);
    }

    public async Task<CustomerAddressResult> UpdateAsync(Guid customerId, Guid addressId, SaveAddressCommand command, CancellationToken cancellationToken = default)
    {
        await EnsureCustomerAsync(customerId, cancellationToken);
        var address = await GetOwnedAsync(customerId, addressId, cancellationToken);
        var current = await addresses.ListAsync(customerId, cancellationToken);
        var now = clock.UtcNow;
        address.Update(command.Label, command.Recipient, command.Phone, command.Country,
            command.Province, command.City, command.Neighborhood, command.Street,
            command.HouseNumber, command.Apartment, command.PostalCode, now);
        if (command.IsDefault && !address.IsDefault)
        {
            ClearDefault(current, now);
            address.MakeDefault(now);
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(address);
    }

    public async Task MakeDefaultAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default)
    {
        await EnsureCustomerAsync(customerId, cancellationToken);
        var address = await GetOwnedAsync(customerId, addressId, cancellationToken);
        var current = await addresses.ListAsync(customerId, cancellationToken);
        var now = clock.UtcNow;
        ClearDefault(current, now);
        address.MakeDefault(now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default)
    {
        await EnsureCustomerAsync(customerId, cancellationToken);
        var address = await GetOwnedAsync(customerId, addressId, cancellationToken);
        var current = await addresses.ListAsync(customerId, cancellationToken);
        addresses.Remove(address);
        if (address.IsDefault)
        {
            current.FirstOrDefault(item => item.Id != address.Id)?.MakeDefault(clock.UtcNow);
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureCustomerAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var customer = await customers.FindByIdAsync(customerId, cancellationToken)
            ?? throw new AddressException("customer_not_found", "Cliente não encontrado.");
        if (!customer.IsActive) throw new AddressException("customer_unavailable", "A conta não está disponível.");
    }

    private async Task<CustomerAddress> GetOwnedAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken) =>
        await addresses.FindAsync(customerId, addressId, cancellationToken)
            ?? throw new AddressException("address_not_found", "Morada não encontrada.");

    private static void ClearDefault(IEnumerable<CustomerAddress> current, DateTimeOffset now)
    {
        foreach (var item in current.Where(item => item.IsDefault)) item.RemoveDefault(now);
    }

    private static CustomerAddressResult Map(CustomerAddress address) => new(
        address.Id, address.Label, address.Recipient, address.Phone, address.Country,
        address.Province, address.City, address.Neighborhood, address.Street,
        address.HouseNumber, address.Apartment, address.PostalCode, address.IsDefault);
}
