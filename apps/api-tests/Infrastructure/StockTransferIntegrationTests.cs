using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PriscilaSkincare.Api.Controllers;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Infrastructure.Persistence;
using PriscilaSkincare.Infrastructure.Persistence.Repositories;

namespace PriscilaSkincare.Api.Tests.Infrastructure;

public sealed class StockTransferIntegrationTests
{
    private sealed class Clock : IClock { public DateTimeOffset UtcNow => DateTimeOffset.UtcNow; }
    private sealed class Catalog : ICatalogGateway
    {
        public Task<CatalogProduct?> FindBySkuAsync(ProductSku sku, string locale, CancellationToken cancellationToken = default) =>
            Task.FromResult<CatalogProduct?>(new(sku, "Soap", 100, 1, true, 5));
        public Task<CatalogItem?> FindAsync(CommerceItemType type, CommerceItemReference reference, string locale, CancellationToken cancellationToken = default) =>
            Task.FromResult<CatalogItem?>(null);
    }

    [MySqlFact]
    public async Task TransferIsUnavailableUntilReceiptAndRetriesDoNotDuplicateStock()
    {
        var connection = new MySql.Data.MySqlClient.MySqlConnectionStringBuilder(Environment.GetEnvironmentVariable("PRISCILA_TEST_MYSQL"))
        { Database = "priscila_tests_" + Guid.NewGuid().ToString("N") };
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseMySQL(connection.ConnectionString).Options;
        await using var db = new ApplicationDbContext(options);
        try
        {
            await db.Database.MigrateAsync();
            var shop = StockLocation.Create("Loja", false); db.StockLocations.Add(shop); await db.SaveChangesAsync();
            const string secret = "isolated-test-secret-not-for-production-123";
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Strapi:IntegrationSecret"] = secret }).Build();
            var controller = new LocationIntegrationsController(db, config, new Catalog(), new StockMovementRepository(db), new Clock())
            { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
            controller.Request.Headers["X-Integration-Secret"] = secret;
            var request = new AdjustStockRequest(Guid.NewGuid(), "SOAP-001", 2, "Reposição da loja", StockLocation.CentralWarehouseId);
            Assert.IsType<OkObjectResult>(await controller.Adjust(shop.Id, request, default));
            Assert.IsType<OkObjectResult>(await controller.Adjust(shop.Id, request, default));
            Assert.Equal(3, (await db.LocationStocks.SingleAsync(x => x.LocationId == StockLocation.CentralWarehouseId)).OnHand);
            var destination = await db.LocationStocks.SingleAsync(x => x.LocationId == shop.Id);
            Assert.Equal(0, destination.Available);
            Assert.Equal("in_transit", (await db.StockAdjustments.SingleAsync()).Status);
            var central = await db.LocationStocks.SingleAsync(x => x.LocationId == StockLocation.CentralWarehouseId);
            central.Reserve(1);
            db.StockMovements.Add(StockMovement.Create(Guid.NewGuid(), "NEW-001", 3, StockMovementType.Debit, DateTimeOffset.UtcNow));
            await db.SaveChangesAsync();
            var initial = new ImportCentralStockRequest([
                new("SOAP-001", 5), new("NEW-001", 10), new("ZERO-001", 0), new("UNTRACKED-001", null)
            ]);
            Assert.IsType<OkObjectResult>(await controller.ImportCentralStock(initial, default));
            Assert.IsType<OkObjectResult>(await controller.ImportCentralStock(initial, default));
            Assert.Equal(3, central.OnHand);
            Assert.Equal(1, central.Reserved);
            Assert.Equal(0, destination.OnHand);
            Assert.Equal(7, (await db.LocationStocks.SingleAsync(x => x.Sku == "NEW-001")).OnHand);
            Assert.Equal(0, (await db.LocationStocks.SingleAsync(x => x.Sku == "ZERO-001")).OnHand);
            Assert.False(await db.LocationStocks.AnyAsync(x => x.Sku == "UNTRACKED-001"));
            Assert.Equal(4, await db.LocationStocks.CountAsync());
            Assert.IsType<OkObjectResult>(await controller.Receive(shop.Id, new(request.OperationId), default));
            Assert.IsType<OkObjectResult>(await controller.Receive(shop.Id, new(request.OperationId), default));
            Assert.Equal(2, destination.OnHand);
            Assert.Equal("received", (await db.StockAdjustments.SingleAsync()).Status);
        }
        finally { await db.Database.EnsureDeletedAsync(); }
    }
}
