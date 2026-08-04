using Microsoft.EntityFrameworkCore;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Reviews;

namespace PriscilaSkincare.Infrastructure.Persistence.Repositories;

internal sealed class ReviewRepository(ApplicationDbContext dbContext) : IReviewRepository
{
    public Task<ProductReview?> FindAsync(Guid customerId, string productSku, CancellationToken cancellationToken = default) =>
        dbContext.Reviews.SingleOrDefaultAsync(review => review.CustomerId == customerId && review.ProductSku == ProductSku.Create(productSku), cancellationToken);

    public Task<ProductReview?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Reviews.SingleOrDefaultAsync(review => review.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<ReviewReadModel> Items, int Total, double Average)> GetPublishedAsync(
        string productSku, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var sku = ProductSku.Create(productSku);
        var query = dbContext.Reviews.AsNoTracking()
            .Where(review => review.ProductSku == sku && review.Status == ReviewStatus.Published);
        var total = await query.CountAsync(cancellationToken);
        var average = total == 0 ? 0 : await query.AverageAsync(review => review.Rating, cancellationToken);
        var items = await query
            .OrderByDescending(review => review.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Join(dbContext.Customers.AsNoTracking(), review => review.CustomerId, customer => customer.Id,
                (review, customer) => new ReviewReadModel(review, customer.Name ?? "Cliente"))
            .ToListAsync(cancellationToken);
        return (items, total, average);
    }

    public async Task<(int Total, double Average)> GetGlobalSummaryAsync(CancellationToken cancellationToken = default)
    {
        var query = dbContext.Reviews.AsNoTracking().Where(review => review.Status == ReviewStatus.Published);
        var total = await query.CountAsync(cancellationToken);
        var average = total == 0 ? 0 : await query.AverageAsync(review => review.Rating, cancellationToken);
        return (total, average);
    }

    public void Add(ProductReview review) => dbContext.Reviews.Add(review);
}
