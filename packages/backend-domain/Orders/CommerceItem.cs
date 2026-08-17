namespace PriscilaSkincare.Domain.Orders;

public enum CommerceItemType { Product, Kit, Collection }

public sealed record CommerceItemReference
{
    private CommerceItemReference(string value) => Value = value;
    public string Value { get; }

    public static CommerceItemReference Create(string value)
    {
        var normalized = value.Trim();
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > 100)
            throw new ArgumentException("A referência comercial deve conter entre 1 e 100 caracteres.", nameof(value));
        return new(normalized);
    }

    public override string ToString() => Value;
}
