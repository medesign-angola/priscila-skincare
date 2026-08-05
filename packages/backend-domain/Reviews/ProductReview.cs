using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Reviews;

public enum ReviewStatus { Pending, Published, Rejected }
public enum ReviewSyncStatus { Pending, Synced, Failed }

public sealed class ProductReview : AggregateRoot<Guid>
{
    private ProductReview() : base(Guid.Empty) { }

    private ProductReview(Guid id, Guid customerId, ProductSku productSku, int rating, string title, string comment, bool recommends, DateTimeOffset createdAt) : base(id)
    {
        CustomerId = customerId;
        ProductSku = productSku;
        Rating = rating;
        Title = title;
        Comment = comment;
        Recommends = recommends;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
    }

    public Guid CustomerId { get; private set; }
    public ProductSku ProductSku { get; private set; } = null!;
    public int Rating { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Comment { get; private set; } = string.Empty;
    public bool Recommends { get; private set; }
    public ReviewStatus Status { get; private set; } = ReviewStatus.Pending;
    public ReviewSyncStatus SyncStatus { get; private set; } = ReviewSyncStatus.Pending;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? EditedAt { get; private set; }
    public DateTimeOffset? ModeratedAt { get; private set; }
    public DateTimeOffset? LastSyncAttemptAt { get; private set; }
    public string? LastSyncError { get; private set; }
    public string? StrapiDocumentId { get; private set; }

    public static ProductReview Submit(Guid customerId, ProductSku productSku, int rating, string title, string comment, bool recommends, DateTimeOffset now)
    {
        Validate(rating, title, comment);
        return new ProductReview(Guid.NewGuid(), customerId, productSku, rating, title.Trim(), comment.Trim(), recommends, now);
    }

    public void Edit(int rating, string title, string comment, bool recommends, DateTimeOffset now)
    {
        Validate(rating, title, comment);
        Rating = rating;
        Title = title.Trim();
        Comment = comment.Trim();
        Recommends = recommends;
        Status = ReviewStatus.Pending;
        ModeratedAt = null;
        UpdatedAt = now;
        EditedAt = now;
        SyncStatus = ReviewSyncStatus.Pending;
    }

    public void Publish(DateTimeOffset now) => Moderate(ReviewStatus.Published, now);
    public void Reject(DateTimeOffset now) => Moderate(ReviewStatus.Rejected, now);

    public void MarkSynced(string? strapiDocumentId, DateTimeOffset now)
    {
        SyncStatus = ReviewSyncStatus.Synced;
        StrapiDocumentId = string.IsNullOrWhiteSpace(strapiDocumentId) ? StrapiDocumentId : strapiDocumentId;
        LastSyncAttemptAt = now;
        LastSyncError = null;
    }

    public void MarkSyncFailed(string error, DateTimeOffset now)
    {
        SyncStatus = ReviewSyncStatus.Failed;
        LastSyncAttemptAt = now;
        LastSyncError = error.Length > 500 ? error[..500] : error;
    }

    private void Moderate(ReviewStatus status, DateTimeOffset now)
    {
        Status = status;
        ModeratedAt = now;
    }

    private static void Validate(int rating, string title, string comment)
    {
        if (rating is < 1 or > 5) throw new ArgumentOutOfRangeException(nameof(rating));
        if (string.IsNullOrWhiteSpace(title) || title.Trim().Length > 80)
            throw new ArgumentException("O título deve conter entre 1 e 80 caracteres.", nameof(title));
        if (string.IsNullOrWhiteSpace(comment) || comment.Trim().Length is < 10 or > 1000)
            throw new ArgumentException("O comentário deve conter entre 10 e 1000 caracteres.", nameof(comment));
    }
}
