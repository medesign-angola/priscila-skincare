using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Reviews;

namespace PriscilaSkincare.Api.Tests.Domain;

public sealed class ProductReviewTests
{
    [Fact]
    public void Submit_StartsPending()
    {
        var review = ProductReview.Submit(Guid.NewGuid(), ProductSku.Create("SNOW-001"), 5,
            "Pele mais luminosa", "Excelente produto.", true, DateTimeOffset.UtcNow);

        Assert.Equal(ReviewStatus.Pending, review.Status);
        Assert.Equal(ReviewSyncStatus.Pending, review.SyncStatus);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void Submit_RejectsInvalidRating(int rating) =>
        Assert.Throws<ArgumentOutOfRangeException>(() => ProductReview.Submit(
            Guid.NewGuid(), ProductSku.Create("SNOW-001"), rating,
            "Título", "Comentário válido", true, DateTimeOffset.UtcNow));

    [Fact]
    public void Edit_ReturnsPublishedReviewToPending()
    {
        var now = DateTimeOffset.UtcNow;
        var review = ProductReview.Submit(Guid.NewGuid(), ProductSku.Create("SNOW-001"), 5,
            "Título", "Comentário válido", true, now);
        review.Publish(now.AddMinutes(1));

        review.Edit(4, "Novo título", "Comentário atualizado", false, now.AddMinutes(2));

        Assert.Equal(ReviewStatus.Pending, review.Status);
        Assert.Null(review.ModeratedAt);
        Assert.False(review.Recommends);
    }
}
