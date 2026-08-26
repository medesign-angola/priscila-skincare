using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Notifications;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class EmailOutboxConfiguration : IEntityTypeConfiguration<EmailOutboxMessage>
{
    public void Configure(EntityTypeBuilder<EmailOutboxMessage> builder)
    {
        builder.ToTable("email_outbox");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Kind).HasColumnName("kind").HasMaxLength(60).IsRequired();
        builder.Property(x => x.AggregateId).HasColumnName("aggregate_id");
        builder.Property(x => x.Recipient).HasColumnName("recipient").HasMaxLength(320).IsRequired();
        builder.Property(x => x.Payload).HasColumnName("payload").HasColumnType("longtext").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Attempts).HasColumnName("attempts");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.NextAttemptAt).HasColumnName("next_attempt_at");
        builder.Property(x => x.SentAt).HasColumnName("sent_at");
        builder.Property(x => x.LastError).HasColumnName("last_error").HasMaxLength(1_000);
        builder.HasIndex(x => new { x.Kind, x.AggregateId }).IsUnique();
        builder.HasIndex(x => new { x.Status, x.NextAttemptAt });
    }
}
