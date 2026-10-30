using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Orders;

public enum PromotionBenefit { Percentage, FixedAmount, FreeShipping }
public sealed class Promotion : Entity<Guid>
{
    private Promotion() : base(Guid.Empty) { }
    public string Name { get; private set; } = string.Empty;
    public string? Coupon { get; private set; }
    public bool IsActive { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }
    public PromotionBenefit Benefit { get; private set; }
    public decimal Value { get; private set; }
    public string Currency { get; private set; } = "AOA";
    public decimal MinimumSubtotal { get; private set; }
    public int? MaximumUses { get; private set; }
    public int? MaximumUsesPerCustomer { get; private set; }
    public bool FirstPurchaseOnly { get; private set; }
    // Optional exact commerce reference (SKU for products, documentId for bundles).
    public string? ItemReference { get; private set; }
    public CommerceItemType? ItemType { get; private set; }
    public Guid Version { get; private set; }
    public static Promotion Create() => new() { Id = Guid.NewGuid() };
    public void Update(string name, string? coupon, bool active, DateTimeOffset startsAt, DateTimeOffset endsAt,
        PromotionBenefit benefit, decimal value, string currency, decimal minimumSubtotal, int? maximumUses,
        int? maximumUsesPerCustomer, bool firstPurchaseOnly, CommerceItemType? itemType, string? itemReference)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 160 || coupon?.Length > 60 || itemReference?.Length > 100)
            throw new ArgumentException("Nome, cupão ou referência inválidos.");
        if (endsAt <= startsAt) throw new ArgumentException("A data final deve ser posterior à inicial.");
        if (!Enum.IsDefined(benefit) || (itemType is not null && !Enum.IsDefined(itemType.Value))) throw new ArgumentException("Tipo de promoção inválido.");
        if (value < 0 || (benefit == PromotionBenefit.Percentage && (value <= 0 || value > 100)) || (benefit == PromotionBenefit.FixedAmount && value <= 0))
            throw new ArgumentException("Desconto inválido.");
        if (minimumSubtotal < 0 || maximumUses <= 0 || maximumUsesPerCustomer <= 0) throw new ArgumentException("Limites inválidos.");
        var normalizedCurrency = Money.Create(0, currency).Currency;
        if (normalizedCurrency is not ("AOA" or "EUR")) throw new ArgumentException("Moeda inválida.");
        Name = name.Trim(); Coupon = string.IsNullOrWhiteSpace(coupon) ? null : coupon.Trim().ToUpperInvariant();
        IsActive = active; StartsAt = startsAt; EndsAt = endsAt; Benefit = benefit; Value = value;
        Currency = normalizedCurrency; MinimumSubtotal = minimumSubtotal; MaximumUses = maximumUses;
        MaximumUsesPerCustomer = maximumUsesPerCustomer; FirstPurchaseOnly = firstPurchaseOnly;
        ItemType = itemType; ItemReference = string.IsNullOrWhiteSpace(itemReference) ? null : itemReference.Trim(); Version = Guid.NewGuid();
    }
    public decimal Discount(decimal eligibleSubtotal, decimal shipping) => Benefit switch
    {
        PromotionBenefit.Percentage => Math.Min(eligibleSubtotal, decimal.Round(eligibleSubtotal * Value / 100, 2, MidpointRounding.AwayFromZero)),
        PromotionBenefit.FixedAmount => Math.Min(eligibleSubtotal, Value),
        PromotionBenefit.FreeShipping => shipping,
        _ => 0
    };
}

public sealed class PromotionUsage
{
    public Guid Id { get; set; }
    public Guid PromotionId { get; set; }
    public Guid OrderId { get; set; }
    public Guid CustomerId { get; set; }
    public string Status { get; set; } = "reserved";
    public DateTimeOffset ExpiresAt { get; set; }
}
