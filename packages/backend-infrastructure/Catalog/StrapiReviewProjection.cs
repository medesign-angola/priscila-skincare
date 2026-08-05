using System.Net.Http.Json;
using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Reviews;

namespace PriscilaSkincare.Infrastructure.Catalog;

internal sealed class StrapiReviewProjection(HttpClient httpClient, StrapiOptions options) : IReviewProjection
{
    public async Task<string?> UpsertAsync(ProductReview review, Customer customer, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/internal/reviews/sync")
        {
            Content = JsonContent.Create(new
            {
                externalReviewId = review.Id,
                customerId = customer.Id,
                customerName = string.IsNullOrWhiteSpace(customer.Name) ? "Cliente" : customer.Name.Trim(),
                customerEmail = customer.Email.Value,
                customerPhone = customer.Phone,
                customerAcceptsMarketing = customer.AcceptsMarketing,
                customerIsActive = customer.IsActive,
                customerCreatedAt = customer.CreatedAt,
                customerUpdatedAt = customer.UpdatedAt,
                productSku = review.ProductSku.Value,
                rating = review.Rating,
                title = review.Title,
                comment = review.Comment,
                recommends = review.Recommends,
                moderationStatus = review.Status.ToString().ToLowerInvariant(),
                submittedAt = review.CreatedAt,
                editedAt = review.EditedAt,
                updatedAt = review.UpdatedAt
            })
        };
        request.Headers.Add("X-Integration-Secret", options.IntegrationSecret);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        return document.RootElement.TryGetProperty("documentId", out var node) ? node.GetString() : null;
    }
}
