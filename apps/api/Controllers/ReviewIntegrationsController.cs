using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Reviews;

namespace PriscilaSkincare.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/integrations/strapi/reviews")]
public sealed class ReviewIntegrationsController(ReviewService reviews, IConfiguration configuration) : ControllerBase
{
    [HttpPost("{reviewId:guid}/moderation")]
    public async Task<IActionResult> Moderate(Guid reviewId, ModerateReviewRequest request, CancellationToken cancellationToken)
    {
        var expected = configuration["Strapi:IntegrationSecret"] ?? string.Empty;
        var supplied = Request.Headers["X-Integration-Secret"].ToString();
        if (!SecureEquals(expected, supplied)) return Unauthorized();
        await reviews.ModerateAsync(new ModerateReviewCommand(reviewId, request.Status), cancellationToken);
        return NoContent();
    }

    private static bool SecureEquals(string expected, string supplied)
    {
        if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(supplied)) return false;
        var left = Encoding.UTF8.GetBytes(expected);
        var right = Encoding.UTF8.GetBytes(supplied);
        return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
    }
}

public sealed record ModerateReviewRequest(string Status);
