using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Customers;
using PriscilaSkincare.Application.Reviews;
using PriscilaSkincare.Application.Orders;
using PriscilaSkincare.Infrastructure.Authentication;
using PriscilaSkincare.Infrastructure.Catalog;
using PriscilaSkincare.Infrastructure.Commerce;
using PriscilaSkincare.Infrastructure.Email;
using PriscilaSkincare.Infrastructure.Persistence;
using PriscilaSkincare.Infrastructure.Persistence.Repositories;
using PriscilaSkincare.Infrastructure.Integration;

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
        services.AddScoped<IShoppingCartRepository, ShoppingCartRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IStockMovementRepository, StockMovementRepository>();
        services.AddScoped<IOrderEmailOutbox, OrderEmailOutbox>();
        services.AddScoped<IntegrationMessageStore>();
        services.AddScoped<IIntegrationOutbox>(provider => provider.GetRequiredService<IntegrationMessageStore>());
        services.AddScoped<IIntegrationInbox>(provider => provider.GetRequiredService<IntegrationMessageStore>());
        AddPaymentIntegration(services, configuration);
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<AuthenticationService>();
        services.AddScoped<CustomerAddressService>();
        services.AddScoped<ReviewService>();
        services.AddScoped<CartService>();
        services.AddScoped<OrderService>();
        services.AddSingleton<IOtpCodeGenerator, OtpCodeGenerator>();
        AddEmailDelivery(services, configuration);
        AddNotificationIntegration(services, configuration);
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
            FromName = section["FromName"] ?? string.Empty,
            TimeoutSeconds = ReadPositiveInt(configuration, "Email:TimeoutSeconds", 30),
            OrderConfirmationEnabled = !bool.TryParse(section["OrderConfirmationEnabled"], out var enabled) || enabled,
            StorefrontUrl = section["StorefrontUrl"] ?? "http://localhost:4300",
            SupportEmail = string.IsNullOrWhiteSpace(section["SupportEmail"])
                ? section["FromEmail"] ?? string.Empty
                : section["SupportEmail"]!,
            OutboxPollSeconds = ReadPositiveInt(configuration, "Email:OutboxPollSeconds", 10)
        };

        services.AddSingleton(options);
        services.AddHostedService<OrderEmailOutboxWorker>();
    }

    private static void AddStrapiIntegration(IServiceCollection services, IConfiguration configuration)
    {
        var baseUrl = configuration["Strapi:BaseUrl"] ?? "http://localhost:1337";
        var publicBaseUrl = configuration["Strapi:PublicBaseUrl"] ?? baseUrl;
        var secret = configuration["Strapi:IntegrationSecret"] ?? string.Empty;
        if (secret.Length < 32)
            throw new InvalidOperationException("Strapi:IntegrationSecret deve ter pelo menos 32 caracteres.");

        var options = new StrapiOptions
        {
            BaseUrl = baseUrl,
            PublicBaseUrl = publicBaseUrl,
            IntegrationSecret = secret
        };
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
        services.AddHttpClient<IOrderProjection, StrapiOrderProjection>(client =>
        {
            client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(8);
        });
    }

    private static void AddNotificationIntegration(IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection(NotificationServiceOptions.SectionName);
        var options = new NotificationServiceOptions
        {
            BaseUrl = section["BaseUrl"] ?? "http://localhost:5052",
            InternalApiKey = section["InternalApiKey"] ?? string.Empty,
            TimeoutSeconds = ReadPositiveInt(configuration, "Notifications:TimeoutSeconds", 15)
        };
        if (!Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var baseUri))
            throw new InvalidOperationException("Notifications:BaseUrl deve ser um endereço absoluto.");
        if (options.InternalApiKey.Length < 32)
            throw new InvalidOperationException("Notifications:InternalApiKey deve ter pelo menos 32 caracteres.");
        services.AddSingleton(options);
        services.AddSingleton<IOtpCodeProtector, OtpCodeProtector>();
        services.AddHttpClient("integration-notifications", client =>
        {
            client.BaseAddress = new Uri(baseUri.ToString().TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
        });
        services.AddHttpClient<IOrderEmailSender, RemoteOrderEmailSender>(client =>
        {
            client.BaseAddress = new Uri(baseUri.ToString().TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
        });
    }

    private static void AddPaymentIntegration(IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection(PaymentServiceOptions.SectionName);
        var options = new PaymentServiceOptions
        {
            BaseUrl = section["BaseUrl"] ?? "http://localhost:5053",
            InternalApiKey = section["InternalApiKey"] ?? string.Empty,
            TimeoutSeconds = ReadPositiveInt(configuration, "Payments:TimeoutSeconds", 15)
        };
        if (!Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var baseUri))
            throw new InvalidOperationException("Payments:BaseUrl deve ser um endereço absoluto válido.");
        if (options.InternalApiKey.Length < 32)
            throw new InvalidOperationException("Payments:InternalApiKey deve ter pelo menos 32 caracteres.");

        services.AddSingleton(options);
        services.AddHttpClient("integration-payments", client =>
        {
            client.BaseAddress = new Uri(baseUri.ToString().TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
        });
        services.AddHostedService<IntegrationOutboxWorker>();
    }
}

internal sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
