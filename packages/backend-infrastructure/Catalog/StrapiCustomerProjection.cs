using System.Net.Http.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Infrastructure.Catalog;

internal sealed class StrapiCustomerProjection(HttpClient httpClient, StrapiOptions options) : ICustomerProjection
{
    public async Task UpsertAsync(Customer customer, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/internal/customers/sync")
        {
            Content = JsonContent.Create(new
            {
                externalCustomerId = customer.Id,
                name = string.IsNullOrWhiteSpace(customer.Name) ? "Cliente" : customer.Name.Trim(),
                email = customer.Email.Value,
                phone = customer.Phone,
                acceptsMarketing = customer.AcceptsMarketing,
                isActive = customer.IsActive,
                registeredAt = customer.CreatedAt,
                sourceUpdatedAt = customer.UpdatedAt
            })
        };
        request.Headers.Add("X-Integration-Secret", options.IntegrationSecret);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
