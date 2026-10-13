using Microsoft.EntityFrameworkCore;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Authentication;
using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Infrastructure.Persistence.Repositories;

internal sealed class OtpChallengeRepository(ApplicationDbContext dbContext) : IOtpChallengeRepository
{
    public Task<OtpChallenge?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.OtpChallenges.SingleOrDefaultAsync(challenge => challenge.Id == id, cancellationToken);

    public Task<OtpChallenge?> FindLatestSentAsync(
        EmailAddress email,
        CancellationToken cancellationToken = default) =>
        dbContext.OtpChallenges
            .Where(challenge => challenge.Email == email && challenge.DeliveryStatus == OtpDeliveryStatus.Sent)
            .OrderByDescending(challenge => challenge.SentAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<OtpChallenge?> FindLatestPendingAsync(
        EmailAddress email,
        CancellationToken cancellationToken = default) =>
        dbContext.OtpChallenges
            .Where(challenge => challenge.Email == email && challenge.DeliveryStatus == OtpDeliveryStatus.Pending)
            .OrderByDescending(challenge => challenge.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public void Add(OtpChallenge challenge) => dbContext.OtpChallenges.Add(challenge);

    public async Task RemoveAllAsync(EmailAddress email, CancellationToken cancellationToken = default)
    {
        var challenges = await dbContext.OtpChallenges
            .Where(challenge => challenge.Email == email)
            .ToListAsync(cancellationToken);
        dbContext.OtpChallenges.RemoveRange(challenges);
    }
}

internal sealed class RefreshTokenRepository(ApplicationDbContext dbContext) : IRefreshTokenRepository
{
    public Task<RefreshToken?> FindByHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens.SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

    public void Add(RefreshToken refreshToken) => dbContext.RefreshTokens.Add(refreshToken);

    public async Task RevokeAllAsync(Guid customerId, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        var tokens = await dbContext.RefreshTokens
            .Where(token => token.CustomerId == customerId && token.RevokedAt == null)
            .ToListAsync(cancellationToken);
        foreach (var token in tokens) token.Revoke(now);
    }
}
