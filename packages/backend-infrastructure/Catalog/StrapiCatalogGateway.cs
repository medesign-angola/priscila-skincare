using System.Net.Http.Json;
using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Catalog;

namespace PriscilaSkincare.Infrastructure.Catalog;

internal sealed class StrapiCatalogGateway(HttpClient httpClient) : ICatalogGateway
{
    public async Task<CatalogProduct?> FindBySkuAsync(ProductSku sku, string locale, CancellationToken cancellationToken = default)
    {
        var url = $"api/products?filters[sku][$eq]={Uri.EscapeDataString(sku.Value)}&locale={Uri.EscapeDataString(locale)}&pagination[pageSize]=1";
        using var response = await httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        if (!document.RootElement.TryGetProperty("data", out var data) || data.GetArrayLength() == 0) return null;
        var item = data[0];
        var source = item.TryGetProperty("attributes", out var attributes) ? attributes : item;
        var name = source.TryGetProperty("name", out var nameNode) ? nameNode.GetString() ?? sku.Value : sku.Value;
        return new CatalogProduct(sku, name, 0, 0, true);
    }
}
