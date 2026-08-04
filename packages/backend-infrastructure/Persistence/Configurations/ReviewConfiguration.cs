using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Reviews;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class ReviewConfiguration : IEntityTypeConfiguration<ProductReview>
{
    public void Configure(EntityTypeBuilder<ProductReview> builder)
    {
        builder.ToTable("reviews");
        builder.HasKey(review => review.Id);
        builder.Property(review => review.CustomerId).HasColumnName("customer_id");
        builder.Property(review => review.ProductSku)
            .HasConversion(sku => sku.Value, value => ProductSku.Create(value))
            .HasColumnName("product_sku").HasMaxLength(64).IsRequired();
        builder.HasIndex(review => new { review.CustomerId, review.ProductSku }).IsUnique();
        builder.Property(review => review.Rating).HasColumnName("rating");
        builder.Property(review => review.Title).HasColumnName("title").HasMaxLength(80).IsRequired();
        builder.Property(review => review.Comment).HasColumnName("comment").HasMaxLength(2000).IsRequired();
        builder.Property(review => review.Recommends).HasColumnName("recommends");
        builder.Property(review => review.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(24);
        builder.Property(review => review.SyncStatus).HasColumnName("sync_status").HasConversion<string>().HasMaxLength(24);
        builder.Property(review => review.CreatedAt).HasColumnName("created_at");
        builder.Property(review => review.UpdatedAt).HasColumnName("updated_at");
        builder.Property(review => review.ModeratedAt).HasColumnName("moderated_at");
        builder.Property(review => review.LastSyncAttemptAt).HasColumnName("last_sync_attempt_at");
        builder.Property(review => review.LastSyncError).HasColumnName("last_sync_error").HasMaxLength(500);
        builder.Property(review => review.StrapiDocumentId).HasColumnName("strapi_document_id").HasMaxLength(64);
    }
}
