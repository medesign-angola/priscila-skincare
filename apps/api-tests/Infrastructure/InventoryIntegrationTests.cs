using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Orders;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Infrastructure.Commerce;
using PriscilaSkincare.Infrastructure.Persistence;
using PriscilaSkincare.Infrastructure.Persistence.Repositories;

namespace PriscilaSkincare.Api.Tests.Infrastructure;

public sealed class MySqlFactAttribute : FactAttribute
{
    public MySqlFactAttribute()
    {
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PRISCILA_TEST_MYSQL")))
            Skip = "Set PRISCILA_TEST_MYSQL to an isolated test MySQL instance.";
    }
}

public sealed class InventoryIntegrationTests
{
    private sealed class TestClock : IClock { public DateTimeOffset UtcNow { get; set; } = DateTimeOffset.UtcNow; }

    [MySqlFact]
    public async Task ReservationsAreAtomicExpireAndCannotDoubleDebitOrCredit()
    {
        // Always generate our own database name; never delete a configured application database.
        var builder = new MySql.Data.MySqlClient.MySqlConnectionStringBuilder(Environment.GetEnvironmentVariable("PRISCILA_TEST_MYSQL"))
        { Database = "priscila_tests_" + Guid.NewGuid().ToString("N") };
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseMySQL(builder.ConnectionString).Options;
        var clock = new TestClock();
        var configuration = new ConfigurationBuilder().Build();
        await using var setup = new ApplicationDbContext(options);
        try
        {
            await setup.Database.MigrateAsync();
            Assert.False((await setup.StockLocations.SingleAsync()).PickupEnabled);
            var first = Guid.NewGuid(); var second = Guid.NewGuid();
            InventoryRequest[] items = [new("SOAP-001", 3, 5)];
            async Task<bool> Attempt(Guid id)
            {
                await using var db = new ApplicationDbContext(options);
                try { await new InventoryService(new StockMovementRepository(db), db, clock, configuration).ReserveAsync(id, items); return true; }
                catch (CommerceException e) when (e.Code == "insufficient_stock") { return false; }
            }
            var results = await Task.WhenAll(Attempt(first), Attempt(second));
            Assert.Single(results, x => x);
            var winner = results[0] ? first : second;
            await using (var db = new ApplicationDbContext(options))
            {
                var inventory = new InventoryService(new StockMovementRepository(db), db, clock, configuration);
                await inventory.DebitAsync(winner, items);
                await inventory.DebitAsync(winner, items);
                Assert.Equal(2, (await db.LocationStocks.SingleAsync()).OnHand);
                Assert.Single(await db.StockMovements.ToListAsync());
                await inventory.CreditAsync(winner); await inventory.CreditAsync(winner);
                Assert.Equal(5, (await db.LocationStocks.SingleAsync()).OnHand);
                Assert.Equal(2, await db.StockMovements.CountAsync());
            }
            var abandoned = Guid.NewGuid();
            Assert.True(await Attempt(abandoned));
            clock.UtcNow = clock.UtcNow.AddDays(2);
            Assert.True(await Attempt(Guid.NewGuid()));
            await using var verify = new ApplicationDbContext(options);
            var stock = await verify.LocationStocks.SingleAsync();
            Assert.Equal(5, stock.OnHand); Assert.Equal(3, stock.Reserved); Assert.Equal(2, stock.Available);
            Assert.Equal("released", (await verify.StockReservations.SingleAsync(x => x.OrderId == abandoned)).Status);
            var shop = StockLocation.Create("Loja teste", false);
            shop.Update("Loja teste", true, true, "Angola", "Luanda", "Rua teste", "+244923000000", "Aguardar confirmação", "Segunda a sexta: 8h–15h");
            verify.StockLocations.Add(shop);
            var shopStock = LocationStock.Create(shop.Id, "SOAP-001", 1);
            verify.LocationStocks.Add(shopStock); await verify.SaveChangesAsync();
            var pickupInventory = new InventoryService(new StockMovementRepository(verify), verify, clock, configuration);
            Assert.Empty(await pickupInventory.PickupLocationsAsync(items));
            shopStock.Receive(2); await verify.SaveChangesAsync();
            Assert.Equal(shop.Id, Assert.Single(await pickupInventory.PickupLocationsAsync(items)).Id);
            var pickupOrder = Guid.NewGuid();
            InventoryRequest[] pickupItems = [new("SOAP-001", 3, 5, shop.Id)];
            await pickupInventory.ReserveAsync(pickupOrder, pickupItems);
            Assert.Empty(await pickupInventory.PickupLocationsAsync(items));
            await pickupInventory.DebitAsync(pickupOrder, pickupItems);
            Assert.Equal(0, shopStock.OnHand);
            await pickupInventory.CreditAsync(pickupOrder);
            await pickupInventory.CreditAsync(pickupOrder);
            Assert.Equal(3, shopStock.OnHand);
            Assert.Equal(5, stock.OnHand); // Returns belong to the original store, not the warehouse.
            var rolledBackOrder = Guid.NewGuid();
            await using (var transactionDb = new ApplicationDbContext(options))
            {
                await using var transaction = await new CommerceTransactions(transactionDb).BeginAsync();
                var transactionalInventory = new InventoryService(new StockMovementRepository(transactionDb), transactionDb, clock, configuration);
                await transactionalInventory.ReserveAsync(rolledBackOrder, [new("SOAP-001", 1, 5)]);
                // Simulate a failure later in checkout: disposing without committing must undo the reservation.
            }
            await using var afterRollback = new ApplicationDbContext(options);
            Assert.False(await afterRollback.StockReservations.AnyAsync(x => x.OrderId == rolledBackOrder));
            Assert.Equal(3, (await afterRollback.LocationStocks.SingleAsync(x => x.LocationId == StockLocation.CentralWarehouseId)).Reserved);
        }
        finally { await setup.Database.EnsureDeletedAsync(); }
    }
}
