namespace PriscilaSkincare.Infrastructure.Catalog;

internal sealed class StrapiOptions
{
    public string BaseUrl { get; init; } = "http://localhost:1337";
    public string IntegrationSecret { get; init; } = string.Empty;
}
