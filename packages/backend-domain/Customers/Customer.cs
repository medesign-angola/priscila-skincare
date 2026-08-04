using PriscilaSkincare.Domain.Common;

namespace PriscilaSkincare.Domain.Customers;

public sealed class Customer : AggregateRoot<Guid>
{
    private Customer() : base(Guid.Empty) { }

    private Customer(Guid id, EmailAddress email, DateTimeOffset createdAt) : base(id)
    {
        Email = email;
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
    }

    public EmailAddress Email { get; private set; } = null!;
    public string? Name { get; private set; }
    public string? Phone { get; private set; }
    public bool AcceptsMarketing { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public static Customer Register(EmailAddress email, DateTimeOffset now) =>
        new(Guid.NewGuid(), email, now);

    public void UpdateProfile(string name, string? phone, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("O nome do cliente é obrigatório.", nameof(name));
        }

        Name = name.Trim();
        Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();
        UpdatedAt = now;
    }

    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        UpdatedAt = now;
    }

    public void AcceptMarketing(DateTimeOffset now)
    {
        AcceptsMarketing = true;
        UpdatedAt = now;
    }
}
