using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Customers;
using PriscilaSkincare.Application.Reviews;
using PriscilaSkincare.Infrastructure.Authentication;
using PriscilaSkincare.Infrastructure.Catalog;
using PriscilaSkincare.Infrastructure.Email;
using PriscilaSkincare.Infrastructure.Persistence;
using PriscilaSkincare.Infrastructure.Persistence.Repositories;

namespace PriscilaSkincare.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("ApplicationDatabase")
            ?? throw new InvalidOperationException("A ligação à base priscila_app não foi configurada.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseMySQL(connectionString, mysql =>
            {
                mysql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                mysql.MigrationsHistoryTable("ef_migrations_history");
            }));
        services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<ICustomerAddressRepository, CustomerAddressRepository>();
        services.AddScoped<IOtpChallengeRepository, OtpChallengeRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<AuthenticationService>();
        services.AddScoped<CustomerAddressService>();
        services.AddScoped<ReviewService>();
        services.AddSingleton<IOtpCodeGenerator, OtpCodeGenerator>();
        AddEmailDelivery(services, configuration);
        AddStrapiIntegration(services, configuration);

        var authenticationOptions = new AuthenticationOptions
        {
            OtpLifetimeMinutes = ReadPositiveInt(configuration, "Authentication:OtpLifetimeMinutes", 10),
            ResendCooldownSeconds = ReadPositiveInt(configuration, "Authentication:ResendCooldownSeconds", 60),
            RefreshTokenDays = ReadPositiveInt(configuration, "Authentication:RefreshTokenDays", 30)
        };
        services.AddSingleton(authenticationOptions);

        var hashSecret = configuration["Authentication:HashSecret"];
        if (string.IsNullOrWhiteSpace(hashSecret) || hashSecret.Length < 32)
        {
            throw new InvalidOperationException("Authentication:HashSecret deve ter pelo menos 32 caracteres.");
        }
        services.AddSingleton<ISecretHasher>(new SecretHasher(hashSecret));
        services.AddSingleton<IClock, SystemClock>();
        return services;
    }

    private static int ReadPositiveInt(IConfiguration configuration, string key, int fallback) =>
        int.TryParse(configuration[key], out var value) && value > 0 ? value : fallback;

    private static void AddEmailDelivery(IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection(SmtpEmailOptions.SectionName);
        var options = new SmtpEmailOptions
        {
            DeliveryMode = section["DeliveryMode"] ?? "Log",
            Host = section["Host"] ?? string.Empty,
            Port = ReadPositiveInt(configuration, "Email:Port", 587),
            Username = section["Username"] ?? string.Empty,
            Password = section["Password"] ?? string.Empty,
            FromEmail = section["FromEmail"] ?? string.Empty,
            FromName = section["FromName"] ?? string.Empty
        };

        if (!string.Equals(options.DeliveryMode, "Smtp", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IOtpSender, DevelopmentOtpSender>();
            return;
        }

        if (string.IsNullOrWhiteSpace(options.Host) ||
            string.IsNullOrWhiteSpace(options.Username) ||
            string.IsNullOrWhiteSpace(options.Password) ||
            string.IsNullOrWhiteSpace(options.FromEmail) ||
            string.IsNullOrWhiteSpace(options.FromName))
        {
            throw new InvalidOperationException(
                "A entrega SMTP está ativa, mas a configuração Email está incompleta. " +
                "Guarde Email:Password nos User Secrets e confirme os restantes dados SMTP.");
        }

        services.AddSingleton(options);
        services.AddSingleton<IOtpSender, SmtpOtpSender>();
    }

    private static void AddStrapiIntegration(IServiceCollection services, IConfiguration configuration)
    {
        var baseUrl = configuration["Strapi:BaseUrl"] ?? "http://localhost:1337";
        var secret = configuration["Strapi:IntegrationSecret"] ?? string.Empty;
        if (secret.Length < 32)
            throw new InvalidOperationException("Strapi:IntegrationSecret deve ter pelo menos 32 caracteres.");

        var options = new StrapiOptions { BaseUrl = baseUrl, IntegrationSecret = secret };
        services.AddSingleton(options);
        services.AddHttpClient<ICatalogGateway, StrapiCatalogGateway>(client =>
            client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/"));
        services.AddHttpClient<IReviewProjection, StrapiReviewProjection>(client =>
            client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/"));
        services.AddHttpClient<ICustomerProjection, StrapiCustomerProjection>(client =>
        {
            client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(5);
        });
    }
}

internal sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
