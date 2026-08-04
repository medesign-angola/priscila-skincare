using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Infrastructure.Persistence.Configurations;

public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");
        builder.HasKey(customer => customer.Id);
        builder.Property(customer => customer.Email)
            .HasConversion(email => email.Value, value => EmailAddress.Create(value))
            .HasColumnName("email").HasMaxLength(320).IsRequired();
        builder.HasIndex(customer => customer.Email).IsUnique();
        builder.Property(customer => customer.Name).HasColumnName("name").HasMaxLength(160);
        builder.Property(customer => customer.Phone).HasColumnName("phone").HasMaxLength(32);
        builder.Property(customer => customer.AcceptsMarketing).HasColumnName("accepts_marketing");
        builder.Property(customer => customer.IsActive).HasColumnName("is_active");
        builder.Property(customer => customer.CreatedAt).HasColumnName("created_at");
        builder.Property(customer => customer.UpdatedAt).HasColumnName("updated_at");
    }
}
