namespace PriscilaSkincare.Domain.Common;

public sealed record EmailAddress
{
    private EmailAddress(string value) => Value = value;

    public string Value { get; }

    public static EmailAddress Create(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized) || !normalized.Contains('@'))
        {
            throw new ArgumentException("O endereço de e-mail é inválido.", nameof(value));
        }

        return new EmailAddress(normalized);
    }

    public override string ToString() => Value;
}
