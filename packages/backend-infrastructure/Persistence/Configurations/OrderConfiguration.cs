using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");
        builder.HasKey(order => order.Id);
        builder.Property(order => order.CustomerId).HasColumnName("customer_id");
        builder.Property(order => order.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(24);
        builder.Property(order => order.CreatedAt).HasColumnName("created_at");
        builder.HasMany(order => order.Items).WithOne().HasForeignKey(item => item.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(order => order.Items).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");
        builder.HasKey(item => item.Id);
        builder.Property(item => item.OrderId).HasColumnName("order_id");
        builder.Property(item => item.ProductSku)
            .HasConversion(sku => sku.Value, value => ProductSku.Create(value))
            .HasColumnName("product_sku").HasMaxLength(64).IsRequired();
        builder.Property(item => item.ProductName).HasColumnName("product_name").HasMaxLength(200).IsRequired();
        builder.Property(item => item.Variant).HasColumnName("variant").HasMaxLength(80);
        builder.Property(item => item.UnitPriceAmount).HasColumnName("unit_price").HasPrecision(18, 2);
        builder.Property(item => item.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(item => item.Quantity).HasColumnName("quantity");
        builder.Ignore(item => item.UnitPrice);
    }
}
