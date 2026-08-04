using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Customers;

public sealed class CustomerAddress : Entity<Guid>
{
    private CustomerAddress() : base(Guid.Empty) { }

    private CustomerAddress(Guid id, Guid customerId, DateTimeOffset now) : base(id)
    {
        CustomerId = customerId;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public Guid CustomerId { get; private set; }
    public string Label { get; private set; } = string.Empty;
    public string Recipient { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Country { get; private set; } = string.Empty;
    public string Province { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string Neighborhood { get; private set; } = string.Empty;
    public string Street { get; private set; } = string.Empty;
    public string? HouseNumber { get; private set; }
    public string? Apartment { get; private set; }
    public string? PostalCode { get; private set; }
    public bool IsDefault { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public static CustomerAddress Create(
        Guid customerId, string label, string recipient, string phone,
        string country, string province, string city, string neighborhood,
        string street, string? houseNumber, string? apartment, string? postalCode,
        bool isDefault, DateTimeOffset now)
    {
        if (customerId == Guid.Empty) throw new ArgumentException("O cliente é obrigatório.", nameof(customerId));
        var address = new CustomerAddress(Guid.NewGuid(), customerId, now);
        address.Update(label, recipient, phone, country, province, city, neighborhood, street, houseNumber, apartment, postalCode, now);
        address.IsDefault = isDefault;
        return address;
    }

    public void Update(
        string label, string recipient, string phone, string country,
        string province, string city, string neighborhood, string street,
        string? houseNumber, string? apartment, string? postalCode,
        DateTimeOffset now)
    {
        Label = Required(label, 60, "nome da morada");
        Recipient = Required(recipient, 160, "destinatário");
        Phone = Required(phone, 32, "telefone");
        Country = Required(country, 80, "país");
        Province = Required(province, 100, "província");
        City = Required(city, 100, "município ou cidade");
        Neighborhood = Required(neighborhood, 120, "bairro");
        Street = Required(street, 240, "rua ou endereço");
        HouseNumber = Optional(houseNumber, 40, "número da casa");
        Apartment = Optional(apartment, 120, "complemento");
        PostalCode = Optional(postalCode, 24, "código postal");
        UpdatedAt = now;
    }

    public void MakeDefault(DateTimeOffset now)
    {
        IsDefault = true;
        UpdatedAt = now;
    }

    public void RemoveDefault(DateTimeOffset now)
    {
        IsDefault = false;
        UpdatedAt = now;
    }

    private static string Required(string value, int maxLength, string field)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ArgumentException($"O campo {field} é obrigatório.");
        var normalized = value.Trim();
        if (normalized.Length > maxLength) throw new ArgumentException($"O campo {field} excede {maxLength} caracteres.");
        return normalized;
    }

    private static string? Optional(string? value, int maxLength, string field)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = value.Trim();
        if (normalized.Length > maxLength) throw new ArgumentException($"O campo {field} excede {maxLength} caracteres.");
        return normalized;
    }
}
