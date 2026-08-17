using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders"); builder.HasKey(x => x.Id);
        builder.Property(x => x.CustomerId).HasColumnName("customer_id");
        builder.Property(x => x.Number).HasColumnName("number").HasMaxLength(40).IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(24);
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.SubtotalAmount).HasColumnName("subtotal").HasPrecision(18, 2);
        builder.Property(x => x.ShippingAmount).HasColumnName("shipping").HasPrecision(18, 2);
        builder.Property(x => x.TotalAmount).HasColumnName("total").HasPrecision(18, 2);
        builder.Property(x => x.Recipient).HasColumnName("recipient").HasMaxLength(160);
        builder.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(32);
        builder.Property(x => x.Country).HasColumnName("country").HasMaxLength(80);
        builder.Property(x => x.Province).HasColumnName("province").HasMaxLength(100);
        builder.Property(x => x.City).HasColumnName("city").HasMaxLength(100);
        builder.Property(x => x.Neighborhood).HasColumnName("neighborhood").HasMaxLength(120);
        builder.Property(x => x.Street).HasColumnName("street").HasMaxLength(240);
        builder.Property(x => x.HouseNumber).HasColumnName("house_number").HasMaxLength(40);
        builder.Property(x => x.Apartment).HasColumnName("apartment").HasMaxLength(120);
        builder.Property(x => x.PostalCode).HasColumnName("postal_code").HasMaxLength(24);
        builder.Property(x => x.IdempotencyKey).HasColumnName("idempotency_key").HasMaxLength(80);
        builder.Property(x => x.StrapiDocumentId).HasColumnName("strapi_document_id").HasMaxLength(64);
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => x.Number).IsUnique();
        builder.HasIndex(x => new { x.CustomerId, x.IdempotencyKey }).IsUnique();
        builder.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Timeline).WithOne().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Items).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(x => x.Timeline).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items"); builder.HasKey(x => x.Id);
        builder.Property(x => x.OrderId).HasColumnName("order_id");
        builder.Property(x => x.ItemType).HasColumnName("item_type").HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Reference).HasConversion(x => x.Value, x => CommerceItemReference.Create(x)).HasColumnName("item_reference").HasMaxLength(100);
        builder.Property(x => x.ProductName).HasColumnName("product_name").HasMaxLength(200);
        builder.Property(x => x.Variant).HasColumnName("variant").HasMaxLength(80);
        builder.Property(x => x.UnitPriceAmount).HasColumnName("unit_price").HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(x => x.Quantity).HasColumnName("quantity");
        builder.Property(x => x.ImageUrl).HasColumnName("image_url").HasMaxLength(500);
        builder.Ignore(x => x.UnitPrice);
    }
}

public sealed class OrderStatusEntryConfiguration : IEntityTypeConfiguration<OrderStatusEntry>
{
    public void Configure(EntityTypeBuilder<OrderStatusEntry> builder)
    {
        builder.ToTable("order_status_history"); builder.HasKey(x => x.Id);
        builder.Property(x => x.OrderId).HasColumnName("order_id");
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(24);
        builder.Property(x => x.OccurredAt).HasColumnName("occurred_at");
    }
}
