using System.Text.RegularExpressions;

namespace PriscilaSkincare.Domain.Customers;

internal static partial class PhoneNumber
{
    public static string Normalize(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("O telefone é obrigatório.", nameof(value));
        var normalized = value.Trim().Replace(" ", string.Empty).Replace("-", string.Empty).Replace("(", string.Empty).Replace(")", string.Empty);
        if (!E164().IsMatch(normalized))
            throw new ArgumentException("Informe o telefone no formato internacional.", nameof(value));
        return normalized;
    }

    public static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : Normalize(value);

    [GeneratedRegex("^\\+[1-9][0-9]{7,14}$", RegexOptions.CultureInvariant)]
    private static partial Regex E164();
}
