namespace PriscilaSkincare.Application.Abstractions;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
