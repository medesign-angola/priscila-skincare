using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Orders;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Infrastructure.Commerce;
using PriscilaSkincare.Infrastructure.Persistence;

namespace PriscilaSkincare.Api.Tests.Infrastructure;
public sealed class CommercePricingIntegrationTests
{
    private sealed class TestClock : IClock { public DateTimeOffset UtcNow { get; } = DateTimeOffset.UtcNow; }
    [MySqlFact]
    public async Task LastCouponUseCannotBeReservedByTwoCustomers()
    {
        var builder = new MySql.Data.MySqlClient.MySqlConnectionStringBuilder(Environment.GetEnvironmentVariable("PRISCILA_TEST_MYSQL"))
        { Database = "priscila_tests_" + Guid.NewGuid().ToString("N") };
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseMySQL(builder.ConnectionString).Options;
        var clock = new TestClock(); var config = new ConfigurationBuilder().Build();
        await using var setup = new ApplicationDbContext(options);
        try
        {
            await setup.Database.MigrateAsync();
            var rate = DeliveryRate.Create(); rate.Update("Luanda", "Angola", "Luanda", "Parceiro", "Normal", "AOA", 500, 1, 3, true);
            var promotion = Promotion.Create(); promotion.Update("Evento", "event", true, clock.UtcNow.AddDays(-1), clock.UtcNow.AddDays(1), PromotionBenefit.Percentage, 10, "AOA", 100, 1, 1, false, null, null);
            setup.DeliveryRates.Add(rate); setup.Promotions.Add(promotion); await setup.SaveChangesAsync();
            var inactive = DeliveryRate.Create();
            inactive.Update("Portugal", "Portugal", null, "Parceiro", "Expresso", "EUR", 10, 2, 4, false);
            setup.DeliveryRates.Add(inactive);
            await setup.SaveChangesAsync();
            var countryResponse = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(
                await new PriscilaSkincare.Api.Controllers.CommerceRulesController(setup, config).DeliveryCountries(default));
            Assert.Equal(new[] { "Angola" }, Assert.IsType<string[]>(countryResponse.Value));
            async Task<bool> Quote()
            {
                var customer = Guid.NewGuid();
                var address = CustomerAddress.Create(customer, "Casa", "Cliente", "+244923000000", "Angola", "Luanda", "Luanda", "Centro", "Rua 1", null, null, "0000", true, clock.UtcNow);
                await using var db = new ApplicationDbContext(options);
                try
                {
                    var quote = await new CommercePricing(db, clock, config).QuoteAsync(customer, address, "AOA", [new("product", "SOAP-001", "Soap", null, 1, 10000, 10000, null)], "event", null, Guid.NewGuid());
                    Assert.Equal(500, quote.Shipping); Assert.Equal(1000, quote.Discount); Assert.Single(quote.DeliveryOptions);
                    return true;
                }
                catch (CommerceException e) when (e.Code == "coupon_unavailable") { return false; }
            }
            Assert.Single(await Task.WhenAll(Quote(), Quote()), x => x);
            await using var verify = new ApplicationDbContext(options);
            Assert.Single(await verify.PromotionUsages.ToListAsync());
            var pickupCustomer = Guid.NewGuid();
            var pickupAddress = CustomerAddress.Create(pickupCustomer, "Casa", "Cliente", "+244923000000", "Portugal", "Lisboa", "Lisboa", "Centro", "Rua 1", null, null, "1000-001", true, clock.UtcNow);
            var pickupQuote = await new CommercePricing(verify, clock, config).QuoteAsync(pickupCustomer, pickupAddress, "AOA",
                [new("product", "SOAP-001", "Soap", null, 1, 10000, 10000, null)], null, null, pickup: true);
            Assert.Equal(0, pickupQuote.Shipping);
            Assert.Null(pickupQuote.DeliveryRateId);
            await Assert.ThrowsAsync<CommerceException>(() => new CommercePricing(verify, clock, config).QuoteAsync(pickupCustomer, pickupAddress, "AOA",
                [new("product", "SOAP-001", "Soap", null, 1, 10000, 10000, null)], null, null));
        }
        finally { await setup.Database.EnsureDeletedAsync(); }
    }
}
