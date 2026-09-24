using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
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
        // The domain assigns the identifier before the item is attached to a
        // cart. Without this hint EF treats a newly discovered item with a
        // non-empty Guid as an existing row and issues UPDATE instead of
        // INSERT when the cart itself was loaded from the database.
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CartId).HasColumnName("cart_id");
        builder.Property(x => x.ItemType).HasColumnName("item_type").HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Reference).HasConversion(x => x.Value, x => CommerceItemReference.Create(x)).HasColumnName("item_reference").HasMaxLength(100);
        builder.Property(x => x.VariantId).HasColumnName("variant_id").HasMaxLength(64);
        builder.Property(x => x.VariantLabel).HasColumnName("variant_label").HasMaxLength(80);
        builder.Property(x => x.Quantity).HasColumnName("quantity");
        builder.HasIndex(x => new { x.CartId, x.ItemType, x.Reference, x.VariantId }).IsUnique();
    }
}
