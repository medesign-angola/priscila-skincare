using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class ShoppingCartConfiguration : IEntityTypeConfiguration<ShoppingCart>
{
    public void Configure(EntityTypeBuilder<ShoppingCart> builder)
    {
        builder.ToTable("shopping_carts"); builder.HasKey(x => x.Id);
        builder.Property(x => x.CustomerId).HasColumnName("customer_id");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.HasIndex(x => x.CustomerId).IsUnique();
        builder.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.CartId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Items).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public sealed class ShoppingCartItemConfiguration : IEntityTypeConfiguration<ShoppingCartItem>
{
    public void Configure(EntityTypeBuilder<ShoppingCartItem> builder)
    {
        builder.ToTable("shopping_cart_items"); builder.HasKey(x => x.Id);
        builder.Property(x => x.CartId).HasColumnName("cart_id");
        builder.Property(x => x.ProductSku).HasConversion(x => x.Value, x => ProductSku.Create(x)).HasColumnName("product_sku").HasMaxLength(64);
        builder.Property(x => x.VariantId).HasColumnName("variant_id").HasMaxLength(64);
        builder.Property(x => x.VariantLabel).HasColumnName("variant_label").HasMaxLength(80);
        builder.Property(x => x.Quantity).HasColumnName("quantity");
        builder.HasIndex(x => new { x.CartId, x.ProductSku, x.VariantId }).IsUnique();
    }
}
