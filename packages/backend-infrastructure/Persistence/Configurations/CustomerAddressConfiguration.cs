using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class CustomerAddressConfiguration : IEntityTypeConfiguration<CustomerAddress>
{
    public void Configure(EntityTypeBuilder<CustomerAddress> builder)
    {
        builder.ToTable("customer_addresses");
        builder.HasKey(address => address.Id);
        builder.Property(address => address.CustomerId).HasColumnName("customer_id").IsRequired();
        builder.HasIndex(address => new { address.CustomerId, address.IsDefault });
        builder.HasOne<Customer>().WithMany().HasForeignKey(address => address.CustomerId).OnDelete(DeleteBehavior.Cascade);
        builder.Property(address => address.Label).HasColumnName("label").HasMaxLength(60).IsRequired();
        builder.Property(address => address.Recipient).HasColumnName("recipient").HasMaxLength(160).IsRequired();
        builder.Property(address => address.Phone).HasColumnName("phone").HasMaxLength(32).IsRequired();
        builder.Property(address => address.Country).HasColumnName("country").HasMaxLength(80).IsRequired();
        builder.Property(address => address.Province).HasColumnName("province").HasMaxLength(100).IsRequired();
        builder.Property(address => address.City).HasColumnName("city").HasMaxLength(100).IsRequired();
        builder.Property(address => address.Neighborhood).HasColumnName("neighborhood").HasMaxLength(120).IsRequired();
        builder.Property(address => address.Street).HasColumnName("street").HasMaxLength(240).IsRequired();
        builder.Property(address => address.HouseNumber).HasColumnName("house_number").HasMaxLength(40);
        builder.Property(address => address.Apartment).HasColumnName("apartment").HasMaxLength(120);
        builder.Property(address => address.PostalCode).HasColumnName("postal_code").HasMaxLength(24);
        builder.Property(address => address.IsDefault).HasColumnName("is_default");
        builder.Property(address => address.CreatedAt).HasColumnName("created_at");
        builder.Property(address => address.UpdatedAt).HasColumnName("updated_at");
    }
}
