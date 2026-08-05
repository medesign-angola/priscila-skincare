using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Authentication;
using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class OtpChallengeConfiguration : IEntityTypeConfiguration<OtpChallenge>
{
    public void Configure(EntityTypeBuilder<OtpChallenge> builder)
    {
        builder.ToTable("otp_challenges");
        builder.HasKey(challenge => challenge.Id);
        builder.Property(challenge => challenge.Email)
            .HasConversion(email => email.Value, value => EmailAddress.Create(value))
            .HasColumnName("email").HasMaxLength(320).IsRequired();
        builder.HasIndex(challenge => new { challenge.Email, challenge.CreatedAt });
        builder.Property(challenge => challenge.CodeHash).HasColumnName("code_hash").HasMaxLength(128).IsRequired();
        builder.Property(challenge => challenge.FailedAttempts).HasColumnName("failed_attempts");
        builder.Property(challenge => challenge.CreatedAt).HasColumnName("created_at");
        builder.Property(challenge => challenge.ExpiresAt).HasColumnName("expires_at");
        builder.Property(challenge => challenge.ConsumedAt).HasColumnName("consumed_at");
        builder.Property(challenge => challenge.DeliveryStatus)
            .HasConversion<string>()
            .HasColumnName("delivery_status")
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(challenge => challenge.SentAt).HasColumnName("sent_at");
        builder.HasIndex(challenge => new { challenge.Email, challenge.DeliveryStatus, challenge.SentAt });
    }
}

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.HasKey(token => token.Id);
        builder.Property(token => token.CustomerId).HasColumnName("customer_id");
        builder.Property(token => token.TokenHash).HasColumnName("token_hash").HasMaxLength(128).IsRequired();
        builder.HasIndex(token => token.TokenHash).IsUnique();
        builder.Property(token => token.CreatedAt).HasColumnName("created_at");
        builder.Property(token => token.ExpiresAt).HasColumnName("expires_at");
        builder.Property(token => token.RevokedAt).HasColumnName("revoked_at");
    }
}
