using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Domain.Fulfillment;

public sealed class DeliveryRate : Entity<Guid>
{
    private DeliveryRate() : base(Guid.Empty) { }
    public string Name { get; private set; } = string.Empty;
    public string Country { get; private set; } = string.Empty;
    public string? Province { get; private set; }
    public string Carrier { get; private set; } = string.Empty;
    public string Service { get; private set; } = string.Empty;
    public string Currency { get; private set; } = "AOA";
    public decimal Amount { get; private set; }
    public int MinimumDays { get; private set; }
    public int MaximumDays { get; private set; }
    public bool IsActive { get; private set; }
    public Guid Version { get; private set; }
    public static DeliveryRate Create() => new() { Id = Guid.NewGuid() };
    public void Update(string name, string country, string? province, string carrier, string service,
        string currency, decimal amount, int minimumDays, int maximumDays, bool isActive)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 160 || string.IsNullOrWhiteSpace(country) || country.Length > 80 ||
            province?.Length > 100 || string.IsNullOrWhiteSpace(carrier) || carrier.Length > 100 || string.IsNullOrWhiteSpace(service) || service.Length > 100)
            throw new ArgumentException("Preencha o nome, país, transportadora e serviço com valores válidos.");
        if (minimumDays < 0 || maximumDays < minimumDays) throw new ArgumentException("Prazo de entrega inválido.");
        var price = Money.Create(amount, currency);
        if (price.Currency is not ("AOA" or "EUR")) throw new ArgumentException("Moeda inválida.");
        Name = name.Trim(); Country = country.Trim(); Province = string.IsNullOrWhiteSpace(province) ? null : province.Trim();
        Carrier = carrier.Trim(); Service = service.Trim(); Currency = price.Currency; Amount = price.Amount;
        MinimumDays = minimumDays; MaximumDays = maximumDays; IsActive = isActive; Version = Guid.NewGuid();
    }
    public bool Covers(string country, string province, string currency) => IsActive &&
        Currency == currency && string.Equals(Country, country.Trim(), StringComparison.OrdinalIgnoreCase) &&
        (Province is null || string.Equals(Province, province.Trim(), StringComparison.OrdinalIgnoreCase));
}
