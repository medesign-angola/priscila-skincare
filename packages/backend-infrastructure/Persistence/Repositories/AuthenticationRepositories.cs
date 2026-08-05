using Microsoft.EntityFrameworkCore;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Authentication;
using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Infrastructure.Persistence.Repositories;

internal sealed class OtpChallengeRepository(ApplicationDbContext dbContext) : IOtpChallengeRepository
{
    public Task<OtpChallenge?> FindLatestSentAsync(
        EmailAddress email,
        CancellationToken cancellationToken = default) =>
        dbContext.OtpChallenges
            .Where(challenge => challenge.Email == email && challenge.DeliveryStatus == OtpDeliveryStatus.Sent)
            .OrderByDescending(challenge => challenge.SentAt)
            .FirstOrDefaultAsync(cancellationToken);

    public void Add(OtpChallenge challenge) => dbContext.OtpChallenges.Add(challenge);
}

internal sealed class RefreshTokenRepository(ApplicationDbContext dbContext) : IRefreshTokenRepository
{
    public Task<RefreshToken?> FindByHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens.SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

    public void Add(RefreshToken refreshToken) => dbContext.RefreshTokens.Add(refreshToken);
}
