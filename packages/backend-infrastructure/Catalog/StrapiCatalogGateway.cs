using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Catalog;

internal sealed class StrapiCatalogGateway(HttpClient httpClient) : ICatalogGateway
{
    public async Task<CatalogItem?> FindAsync(CommerceItemType type, CommerceItemReference reference, string locale, CancellationToken token = default)
    {
        if (type == CommerceItemType.Product)
        {
            var product = await FindBySkuAsync(ProductSku.Create(reference.Value), locale, token);
            return product is null ? null : new(type, reference, product.Name, product.AoaPrice, product.EurPrice,
                product.IsAvailable, product.Stock, product.ImageUrl, product.Variants ?? [], [new(product.Sku)]);
        }
        var endpoint = type == CommerceItemType.Kit ? "kits" : "collections";
        var url = $"api/{endpoint}?filters[$or][0][documentId][$eq]={Uri.EscapeDataString(reference.Value)}&filters[$or][1][slug][$eq]={Uri.EscapeDataString(reference.Value)}&locale={Uri.EscapeDataString(locale)}" +
                  "&populate[prices]=*&populate[thumbnailImage][fields][0]=url&populate[products][fields][0]=sku&populate[products][populate][commerce][populate]=prices&pagination[pageSize]=1";
        using var response = await httpClient.GetAsync(url, token);
        if (!response.IsSuccessStatusCode) return null;
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(token), cancellationToken: token);
        if (!document.RootElement.TryGetProperty("data", out var data) || data.GetArrayLength() == 0) return null;
        var source = Unwrap(data[0]); var prices = source.TryGetProperty("prices", out var p) ? Unwrap(p) : default;
        var components = new List<CatalogComponent>(); var sellable = true; int? bundleStock = null;
        if (source.TryGetProperty("products", out var productsNode))
        {
            var products = productsNode.ValueKind == JsonValueKind.Object && productsNode.TryGetProperty("data", out var nested) ? nested : productsNode;
            if (products.ValueKind == JsonValueKind.Array) foreach (var raw in products.EnumerateArray())
            {
                var product = Unwrap(raw); var skuText = Text(product, "sku"); if (string.IsNullOrWhiteSpace(skuText)) continue;
                components.Add(new(ProductSku.Create(skuText)));
                var commerce = product.TryGetProperty("commerce", out var c) ? Unwrap(c) : default;
                var availability = Text(commerce, "availability"); var stock = Integer(commerce, "stock");
                sellable &= availability == "in-stock" && stock != 0;
                if (stock is not null) bundleStock = bundleStock is null ? stock : Math.Min(bundleStock.Value, stock.Value);
            }
        }
        sellable &= components.Count > 0;
        return new(type, reference, Text(source, "name") ?? reference.Value, Decimal(prices, "aoa"), Decimal(prices, "eur"),
            sellable, bundleStock, MediaUrl(source, "thumbnailImage"), [], components);
    }

    public async Task<CatalogProduct?> FindBySkuAsync(ProductSku sku, string locale, CancellationToken token = default)
    {
        var url = $"api/products?filters[sku][$eq]={Uri.EscapeDataString(sku.Value)}&locale={Uri.EscapeDataString(locale)}" +
                  "&populate[commerce][populate]=prices&populate[sizes][fields][0]=documentId&populate[sizes][fields][1]=value&populate[sizes][fields][2]=label&populate[thumbnailImage][fields][0]=url&pagination[pageSize]=1";
        using var response = await httpClient.GetAsync(url, token);
        if (!response.IsSuccessStatusCode) return null;
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(token), cancellationToken: token);
        if (!document.RootElement.TryGetProperty("data", out var data) || data.GetArrayLength() == 0) return null;
        var source = Unwrap(data[0]);
        var commerce = source.TryGetProperty("commerce", out var commerceNode) ? Unwrap(commerceNode) : default;
        var prices = commerce.ValueKind != JsonValueKind.Undefined && commerce.TryGetProperty("prices", out var pricesNode) ? Unwrap(pricesNode) : default;
        var availability = Text(commerce, "availability") ?? "out-of-stock";
        var stock = Integer(commerce, "stock");
        var variants = new List<CatalogVariant>();
        if (source.TryGetProperty("sizes", out var sizesNode))
        {
            var sizes = sizesNode.ValueKind == JsonValueKind.Object && sizesNode.TryGetProperty("data", out var nested) ? nested : sizesNode;
            if (sizes.ValueKind == JsonValueKind.Array)
                foreach (var raw in sizes.EnumerateArray())
                {
                    var size = Unwrap(raw);
                    var id = Text(size, "documentId") ?? Text(size, "value") ?? raw.GetProperty("id").ToString();
                    variants.Add(new(id, Text(size, "value") ?? Text(size, "label") ?? id));
                }
        }
        return new CatalogProduct(sku, Text(source, "name") ?? sku.Value,
            Decimal(prices, "aoa"), Decimal(prices, "eur"), availability == "in-stock" && stock != 0,
            stock, MediaUrl(source, "thumbnailImage"), variants);
    }

    private string? MediaUrl(JsonElement source, string property)
    {
        if (!source.TryGetProperty(property, out var node) || node.ValueKind == JsonValueKind.Null) return null;
        var media = Unwrap(node);
        var url = Text(media, "url");
        return string.IsNullOrWhiteSpace(url) ? null : url.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? url : new Uri(httpClient.BaseAddress!, url.TrimStart('/')).ToString();
    }
    private static JsonElement Unwrap(JsonElement node) => node.ValueKind == JsonValueKind.Object && node.TryGetProperty("attributes", out var attributes) ? attributes : node;
    private static string? Text(JsonElement node, string name) => node.ValueKind == JsonValueKind.Object && node.TryGetProperty(name, out var value) && value.ValueKind != JsonValueKind.Null ? value.ToString() : null;
    private static decimal Decimal(JsonElement node, string name) => decimal.TryParse(Text(node, name), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var value) ? value : 0;
    private static int? Integer(JsonElement node, string name) => int.TryParse(Text(node, name), out var value) ? value : null;
}
