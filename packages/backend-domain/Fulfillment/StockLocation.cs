using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Fulfillment;

public sealed class StockLocation : AggregateRoot<Guid>
{
    public static readonly Guid CentralWarehouseId = Guid.Parse("334a7da4-f292-48dc-a346-8ff03170fd0d");
    private StockLocation() : base(Guid.Empty) { }
    private StockLocation(Guid id) : base(id) { }
    public string Name { get; private set; } = string.Empty;
    public bool IsWarehouse { get; private set; }
    public bool IsActive { get; private set; }
    public bool PickupEnabled { get; private set; }
    public string? Country { get; private set; }
    public string? City { get; private set; }
    public string? Address { get; private set; }
    public string? Phone { get; private set; }
    public string? PickupInstructions { get; private set; }
    public string? PickupHours { get; private set; }
    public Guid Version { get; private set; }

    public static StockLocation Create(string name, bool isWarehouse)
    {
        var location = new StockLocation(Guid.NewGuid()) { IsWarehouse = isWarehouse };
        location.Update(name, true, false, null, null, null, null, null);
        return location;
    }

    public static StockLocation CentralWarehouse() => new(CentralWarehouseId)
    {
        Name = "Armazém central", IsWarehouse = true, IsActive = true,
        PickupEnabled = false, Version = Guid.Parse("4ce97c6f-9e27-4e42-8de3-0291556df489")
    };

    public void Update(string name, bool isActive, bool pickupEnabled, string? country,
        string? city, string? address, string? phone, string? pickupInstructions, string? pickupHours = null)
    {
        var validName = Text(name, 160) ?? throw new ArgumentException("Indique o nome da localização.");
        var validCountry = Text(country, 80);
        var validCity = Text(city, 100);
        var validAddress = Text(address, 500);
        var validPhone = Text(phone, 40);
        var validInstructions = Text(pickupInstructions, 1000);
        var validHours = Text(pickupHours, 500);
        if (pickupEnabled && (IsWarehouse || !isActive))
            throw new InvalidOperationException("O levantamento só pode ser activado numa loja activa.");
        if (pickupEnabled && (validCountry is null || validCity is null || validAddress is null ||
            validPhone is null || validInstructions is null || validHours is null))
            throw new InvalidOperationException("Preencha a morada, o contacto, o horário e as instruções antes de activar o levantamento.");
        Name = validName; IsActive = isActive; PickupEnabled = pickupEnabled;
        Country = validCountry; City = validCity; Address = validAddress;
        Phone = validPhone; PickupInstructions = validInstructions;
        PickupHours = validHours;
        Version = Guid.NewGuid();
    }

    private static string? Text(string? value, int maxLength)
    {
        var text = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (text?.Length > maxLength) throw new ArgumentException($"O campo não pode exceder {maxLength} caracteres.");
        return text;
    }
}
