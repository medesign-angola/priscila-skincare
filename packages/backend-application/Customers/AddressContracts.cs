namespace PriscilaSkincare.Application.Customers;

public sealed record SaveAddressCommand(
    string Label,
    string Recipient,
    string Phone,
    string Country,
    string Province,
    string City,
    string Neighborhood,
    string Street,
    string? HouseNumber,
    string? Apartment,
    string? PostalCode,
    bool IsDefault = false);

public sealed record CustomerAddressResult(
    Guid Id,
    string Label,
    string Recipient,
    string Phone,
    string Country,
    string Province,
    string City,
    string Neighborhood,
    string Street,
    string? HouseNumber,
    string? Apartment,
    string? PostalCode,
    bool IsDefault);

public sealed class AddressException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
