using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Fulfillment;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class StockLocationConfiguration : IEntityTypeConfiguration<StockLocation>
{
    public void Configure(EntityTypeBuilder<StockLocation> builder)
    {
        builder.ToTable("stock_locations");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(160).IsRequired();
        builder.Property(x => x.IsWarehouse).HasColumnName("is_warehouse");
        builder.Property(x => x.IsActive).HasColumnName("is_active");
        builder.Property(x => x.PickupEnabled).HasColumnName("pickup_enabled");
        builder.Property(x => x.Country).HasColumnName("country").HasMaxLength(80);
        builder.Property(x => x.City).HasColumnName("city").HasMaxLength(100);
        builder.Property(x => x.Address).HasColumnName("address").HasMaxLength(500);
        builder.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(40);
        builder.Property(x => x.PickupInstructions).HasColumnName("pickup_instructions").HasMaxLength(1000);
        builder.Property(x => x.PickupHours).HasColumnName("pickup_hours").HasMaxLength(500);
        builder.Property(x => x.Version).HasColumnName("version").IsConcurrencyToken();
        builder.HasData(StockLocation.CentralWarehouse());
    }
}
