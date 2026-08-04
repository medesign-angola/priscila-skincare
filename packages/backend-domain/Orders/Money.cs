namespace PriscilaSkincare.Domain.Orders;

public sealed record Money
{
    private Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    public decimal Amount { get; }
    public string Currency { get; }

    public static Money Create(decimal amount, string currency)
    {
        if (amount < 0) throw new ArgumentOutOfRangeException(nameof(amount));
        var normalizedCurrency = currency.Trim().ToUpperInvariant();
        if (normalizedCurrency is not ("AOA" or "EUR")) throw new ArgumentException("Moeda não suportada.", nameof(currency));
        return new Money(amount, normalizedCurrency);
    }
}
