using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b){b.ToTable("payments");b.HasKey(x=>x.Id);b.Property(x=>x.OrderId).HasColumnName("order_id");b.Property(x=>x.Provider).HasColumnName("provider").HasMaxLength(40);b.Property(x=>x.Reference).HasColumnName("reference").HasMaxLength(100);b.Property(x=>x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);b.Property(x=>x.Amount).HasColumnName("amount").HasPrecision(18,2);b.Property(x=>x.Currency).HasColumnName("currency").HasMaxLength(3);b.Property(x=>x.CreatedAt).HasColumnName("created_at");b.Property(x=>x.UpdatedAt).HasColumnName("updated_at");b.HasIndex(x=>x.OrderId).IsUnique();b.HasIndex(x=>x.Reference).IsUnique();}
}
public sealed class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> b){b.ToTable("stock_movements");b.HasKey(x=>x.Id);b.Property(x=>x.OrderId).HasColumnName("order_id");b.Property(x=>x.ProductSku).HasColumnName("product_sku").HasMaxLength(64);b.Property(x=>x.Quantity).HasColumnName("quantity");b.Property(x=>x.Type).HasColumnName("type").HasConversion<string>().HasMaxLength(10);b.Property(x=>x.OccurredAt).HasColumnName("occurred_at");b.HasIndex(x=>new{x.OrderId,x.ProductSku,x.Type}).IsUnique();b.HasIndex(x=>x.ProductSku);}
}
