namespace PriscilaSkincare.Application.Reviews;

public sealed record SubmitReviewCommand(Guid CustomerId, string ProductSku, int Rating, string Title, string Comment, bool Recommends, string Locale = "pt");
public sealed record ModerateReviewCommand(Guid ReviewId, string Status);
public sealed record ReviewResult(Guid Id, string ProductSku, string Name, int Rating, string Title, string Comment, bool Recommends, string Status, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record ReviewSummary(double AverageRating, int TotalReviews);
public sealed record ReviewPage(IReadOnlyList<ReviewResult> Items, ReviewSummary Summary, int Page, int PageSize, int TotalItems);

public sealed class ReviewException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
