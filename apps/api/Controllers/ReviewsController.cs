using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Reviews;

namespace PriscilaSkincare.Api.Controllers;

[ApiController]
[Route("api/v1/reviews")]
public sealed class ReviewsController(ReviewService reviews) : ControllerBase
{
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReviewResult>> Submit(SubmitReviewRequest request, CancellationToken cancellationToken)
    {
        var result = await reviews.SubmitAsync(new SubmitReviewCommand(
            CustomerId(), request.ProductSku, request.Rating, request.Title,
            request.Comment, request.Recommends, request.Locale), cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("mine/{productSku}")]
    public async Task<ActionResult<ReviewResult>> Mine(string productSku, CancellationToken cancellationToken)
    {
        var result = await reviews.MineAsync(CustomerId(), productSku, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("products/{productSku}")]
    public async Task<ActionResult<ReviewPage>> Published(
        string productSku, [FromQuery] int page = 1, [FromQuery] int pageSize = 4,
        CancellationToken cancellationToken = default) =>
        Ok(await reviews.PublishedAsync(productSku, page, pageSize, cancellationToken));

    [AllowAnonymous]
    [HttpGet("summary")]
    public async Task<ActionResult<ReviewSummary>> Summary(CancellationToken cancellationToken) =>
        Ok(await reviews.GlobalSummaryAsync(cancellationToken));

    private Guid CustomerId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out var customerId)
            ? customerId
            : throw new AuthenticationException("invalid_identity", "A sessão não contém um cliente válido.");
    }
}

public sealed record SubmitReviewRequest(
    string ProductSku, int Rating, string Title, string Comment, bool Recommends, string Locale = "pt");
