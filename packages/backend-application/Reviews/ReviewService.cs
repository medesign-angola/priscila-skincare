using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Reviews;

namespace PriscilaSkincare.Application.Reviews;

public sealed class ReviewService(
    IReviewRepository reviews,
    ICustomerRepository customers,
    ICatalogGateway catalog,
    IReviewProjection projection,
    IUnitOfWork unitOfWork,
    IClock clock)
{
    public async Task<ReviewResult> SubmitAsync(SubmitReviewCommand command, CancellationToken cancellationToken = default)
    {
        var customer = await customers.FindByIdAsync(command.CustomerId, cancellationToken)
            ?? throw new ReviewException("customer_not_found", "Cliente não encontrado.");
        if (!customer.IsActive) throw new ReviewException("customer_unavailable", "A conta não está disponível.");

        var sku = ProductSku.Create(command.ProductSku);
        var locale = command.Locale.Equals("fr", StringComparison.OrdinalIgnoreCase) ? "fr" : "pt";
        try
        {
            if (await catalog.FindBySkuAsync(sku, locale, cancellationToken) is null)
                throw new ReviewException("product_not_found", "O produto não foi encontrado.");
        }
        catch (ReviewException)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new ReviewException("catalog_unavailable", $"Não foi possível validar o produto: {exception.Message}");
        }

        var now = clock.UtcNow;
        var review = await reviews.FindAsync(customer.Id, sku.Value, cancellationToken);
        if (review is null)
        {
            review = ProductReview.Submit(customer.Id, sku, command.Rating, command.Title, command.Comment, command.Recommends, now);
            reviews.Add(review);
        }
        else
        {
            review.Edit(command.Rating, command.Title, command.Comment, command.Recommends, now);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await SynchronizeAsync(review, customer, cancellationToken);
        return Map(review, DisplayName(customer.Name));
    }

    public async Task<ReviewResult?> MineAsync(Guid customerId, string productSku, CancellationToken cancellationToken = default)
    {
        var review = await reviews.FindAsync(customerId, ProductSku.Create(productSku).Value, cancellationToken);
        if (review is null) return null;
        var customer = await customers.FindByIdAsync(customerId, cancellationToken);
        return Map(review, DisplayName(customer?.Name));
    }

    public async Task<ReviewPage> PublishedAsync(string productSku, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var normalizedPage = Math.Max(1, page);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 50);
        var sku = ProductSku.Create(productSku).Value;
        var result = await reviews.GetPublishedAsync(sku, normalizedPage, normalizedPageSize, cancellationToken);
        return new ReviewPage(
            result.Items.Select(item => Map(item.Review, DisplayName(item.CustomerName))).ToArray(),
            new ReviewSummary(Math.Round(result.Average, 1), result.Total),
            normalizedPage,
            normalizedPageSize,
            result.Total);
    }

    public async Task<ReviewSummary> GlobalSummaryAsync(CancellationToken cancellationToken = default)
    {
        var result = await reviews.GetGlobalSummaryAsync(cancellationToken);
        return new ReviewSummary(Math.Round(result.Average, 1), result.Total);
    }

    public async Task ModerateAsync(ModerateReviewCommand command, CancellationToken cancellationToken = default)
    {
        var review = await reviews.FindByIdAsync(command.ReviewId, cancellationToken)
            ?? throw new ReviewException("review_not_found", "Avaliação não encontrada.");
        var targetStatus = command.Status.ToLowerInvariant() switch
        {
            "published" => ReviewStatus.Published,
            "rejected" => ReviewStatus.Rejected,
            _ => throw new ReviewException("invalid_review_status", "O estado da avaliação é inválido.")
        };
        if (review.Status == targetStatus) return;

        if (targetStatus == ReviewStatus.Published) review.Publish(clock.UtcNow);
        else review.Reject(clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task SynchronizeAsync(ProductReview review, PriscilaSkincare.Domain.Customers.Customer customer, CancellationToken cancellationToken)
    {
        try
        {
            var documentId = await projection.UpsertAsync(review, customer, cancellationToken);
            review.MarkSynced(documentId, clock.UtcNow);
        }
        catch (Exception exception)
        {
            review.MarkSyncFailed(exception.Message, clock.UtcNow);
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static ReviewResult Map(ProductReview review, string customerName) => new(
        review.Id, review.ProductSku.Value, customerName, review.Rating, review.Title,
        review.Comment, review.Recommends, review.Status.ToString().ToLowerInvariant(),
        review.CreatedAt, review.UpdatedAt, review.EditedAt, review.ModeratedAt);

    private static string DisplayName(string? name) => string.IsNullOrWhiteSpace(name) ? "Cliente" : name.Trim();
}
