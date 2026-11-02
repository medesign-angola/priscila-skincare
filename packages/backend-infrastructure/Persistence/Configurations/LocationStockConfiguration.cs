using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Fulfillment;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;
public sealed class LocationStockConfiguration : IEntityTypeConfiguration<LocationStock>
{
    public void Configure(EntityTypeBuilder<LocationStock> b)
    {
        b.ToTable("location_stock"); b.HasKey(x => x.Id); b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Sku).HasMaxLength(100).IsRequired(); b.HasIndex(x => new { x.LocationId, x.Sku }).IsUnique();
        b.HasOne<StockLocation>().WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
        b.Ignore(x => x.Available);
    }
}
public sealed class StockReservationConfiguration : IEntityTypeConfiguration<StockReservation>
{
    public void Configure(EntityTypeBuilder<StockReservation> b)
    {
        b.ToTable("stock_reservations"); b.HasKey(x => x.Id); b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Status).HasMaxLength(20); b.HasIndex(x => new { x.Status, x.ExpiresAt }); b.HasIndex(x => x.OrderId);
        b.HasOne<LocationStock>().WithMany().HasForeignKey(x => x.StockId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class StockAdjustmentConfiguration : IEntityTypeConfiguration<StockAdjustment>
{
    public void Configure(EntityTypeBuilder<StockAdjustment> b)
    {
        b.ToTable("stock_adjustments"); b.HasKey(x => x.Id); b.Property(x => x.Id).ValueGeneratedNever();
        b.Property(x => x.Sku).HasMaxLength(100); b.Property(x => x.Reason).HasMaxLength(500);
        b.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("received");
        b.HasIndex(x => x.CreatedAt);
        b.HasOne<StockLocation>().WithMany().HasForeignKey(x => x.DestinationLocationId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<StockLocation>().WithMany().HasForeignKey(x => x.SourceLocationId).OnDelete(DeleteBehavior.Restrict);
    }
}
