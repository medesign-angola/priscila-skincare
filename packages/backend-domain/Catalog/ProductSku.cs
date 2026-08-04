namespace PriscilaSkincare.Domain.Catalog;

public sealed record ProductSku
{
    private ProductSku(string value) => Value = value;

    public string Value { get; }

    public static ProductSku Create(string value)
    {
        var normalized = value.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > 64)
        {
            throw new ArgumentException("O SKU deve conter entre 1 e 64 caracteres.", nameof(value));
        }

        return new ProductSku(normalized);
    }

    public override string ToString() => Value;
}
