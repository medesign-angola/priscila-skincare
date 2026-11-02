using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;
public sealed class DeliveryRateConfiguration : IEntityTypeConfiguration<DeliveryRate>
{
    public void Configure(EntityTypeBuilder<DeliveryRate> b)
    {
        b.ToTable("delivery_rates"); b.HasKey(x => x.Id); b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Name).HasMaxLength(160); b.Property(x => x.Country).HasMaxLength(80); b.Property(x => x.Province).HasMaxLength(100);
        b.Property(x => x.Carrier).HasMaxLength(100); b.Property(x => x.Service).HasMaxLength(100); b.Property(x => x.Currency).HasMaxLength(3);
        b.Property(x => x.Amount).HasPrecision(18, 2); b.Property(x => x.Version).IsConcurrencyToken();
    }
}
public sealed class PromotionConfiguration : IEntityTypeConfiguration<Promotion>
{
    public void Configure(EntityTypeBuilder<Promotion> b)
    {
        b.ToTable("promotions"); b.HasKey(x => x.Id); b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Name).HasMaxLength(160); b.Property(x => x.Coupon).HasMaxLength(60); b.HasIndex(x => x.Coupon).IsUnique();
        b.Property(x => x.Currency).HasMaxLength(3); b.Property(x => x.ItemReference).HasMaxLength(100);
        b.Property(x => x.Value).HasPrecision(18, 2); b.Property(x => x.MinimumSubtotal).HasPrecision(18, 2); b.Property(x => x.Version).IsConcurrencyToken();
    }
}
public sealed class PromotionUsageConfiguration : IEntityTypeConfiguration<PromotionUsage>
{
    public void Configure(EntityTypeBuilder<PromotionUsage> b)
    {
        b.ToTable("promotion_usage"); b.HasKey(x => x.Id); b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Status).HasMaxLength(20); b.HasIndex(x => x.OrderId).IsUnique(); b.HasIndex(x => new { x.PromotionId, x.CustomerId });
        b.HasOne<Promotion>().WithMany().HasForeignKey(x => x.PromotionId).OnDelete(DeleteBehavior.Restrict);
    }
}
