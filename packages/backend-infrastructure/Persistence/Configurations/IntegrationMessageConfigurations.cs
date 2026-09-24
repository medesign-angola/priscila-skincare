using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Integration;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class IntegrationOutboxMessageConfiguration : IEntityTypeConfiguration<IntegrationOutboxMessage>
{
    public void Configure(EntityTypeBuilder<IntegrationOutboxMessage> builder)
    {
        builder.ToTable("integration_outbox");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Type).HasColumnName("type").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Destination).HasColumnName("destination").HasMaxLength(40).IsRequired();
        builder.Property(x => x.Payload).HasColumnName("payload").HasColumnType("longtext").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Attempts).HasColumnName("attempts");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.NextAttemptAt).HasColumnName("next_attempt_at");
        builder.Property(x => x.PublishedAt).HasColumnName("published_at");
        builder.Property(x => x.LastError).HasColumnName("last_error").HasMaxLength(1_000);
        builder.HasIndex(x => new { x.Status, x.NextAttemptAt });
    }
}

public sealed class IntegrationInboxMessageConfiguration : IEntityTypeConfiguration<IntegrationInboxMessage>
{
    public void Configure(EntityTypeBuilder<IntegrationInboxMessage> builder)
    {
        builder.ToTable("integration_inbox");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Type).HasColumnName("type").HasMaxLength(100).IsRequired();
        builder.Property(x => x.ProcessedAt).HasColumnName("processed_at");
    }
}
