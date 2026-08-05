using System.Net.Http.Json;
using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Catalog;

internal sealed class StrapiOrderProjection(HttpClient http, StrapiOptions options) : IOrderProjection
{
    public async Task<string?> UpsertAsync(Order order, Customer customer, CancellationToken token = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/internal/orders/sync");
        request.Headers.Add("x-integration-secret", options.IntegrationSecret);
        request.Content = JsonContent.Create(new
        {
            externalOrderId = order.Id,
            number = order.Number,
            externalCustomerId = customer.Id,
            customerName = customer.Name ?? customer.Email.Value,
            customerEmail = customer.Email.Value,
            status = order.Status.ToString().ToLowerInvariant(),
            currency = order.Currency,
            subtotal = order.SubtotalAmount,
            shipping = order.ShippingAmount,
            total = order.TotalAmount,
            placedAt = order.CreatedAt,
            deliveryAddress = new { order.Recipient, order.Phone, order.Country, order.Province, order.City, order.Neighborhood, order.Street, order.HouseNumber, order.Apartment, order.PostalCode },
            items = order.Items.Select(item => new { productSku = item.ProductSku.Value, productName = item.ProductName, item.Variant, unitPrice = item.UnitPriceAmount, item.Quantity, item.ImageUrl }),
            timeline = order.Timeline.Select(entry => new { status = entry.Status.ToString().ToLowerInvariant(), entry.OccurredAt })
        });
        using var response = await http.SendAsync(request, token);
        response.EnsureSuccessStatusCode();
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(token), cancellationToken: token);
        return document.RootElement.TryGetProperty("documentId", out var id) ? id.GetString() : null;
    }
}
