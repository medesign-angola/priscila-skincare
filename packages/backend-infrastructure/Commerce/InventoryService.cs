using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Orders;
using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace PriscilaSkincare.Infrastructure.Commerce;

internal sealed class InventoryService(IStockMovementRepository movements, ApplicationDbContext db, IClock clock, IConfiguration configuration):IInventoryService
{
    private int ReservationMinutes => Math.Clamp(configuration.GetValue("Inventory:ReservationMinutes", 1440), 5, 10080);
    // All writers lock the seeded warehouse row, including the first import of a SKU.
    // This prevents two concurrent checkouts from importing or reserving the same stock.
    private async Task Lock(CancellationToken token)
    {
        var rows = await db.StockLocations.FromSqlInterpolated($"SELECT * FROM stock_locations WHERE id = {StockLocation.CentralWarehouseId} FOR UPDATE").ToListAsync(token);
        if (rows.Count != 1) throw new InvalidOperationException("A gestão de stock ainda não foi inicializada.");
    }

    private async Task Expire(CancellationToken token)
    {
        var expired = await db.StockReservations.Where(x => x.Status == "reserved" && x.ExpiresAt <= clock.UtcNow).ToListAsync(token);
        foreach (var row in expired) { (await db.LocationStocks.FindAsync([row.StockId], token))!.Release(row.Quantity); row.Release(); }
    }

    private async Task<LocationStock?> Stock(InventoryRequest item, CancellationToken token)
    {
        var locationId = item.LocationId ?? StockLocation.CentralWarehouseId;
        if (!item.LocationId.HasValue && !await db.StockLocations.AnyAsync(x => x.Id == locationId && x.IsActive, token))
            throw new CommerceException("delivery_unavailable", "O armazém de expedição não está disponível.");
        if (item.LocationId.HasValue && !await db.StockLocations.AnyAsync(x => x.Id == locationId && x.IsActive && x.PickupEnabled && !x.IsWarehouse, token))
            throw new CommerceException("pickup_unavailable", "A loja já não está disponível para levantamento.");
        var existing = db.LocationStocks.Local.FirstOrDefault(x => x.LocationId == locationId && x.Sku == item.ProductSku)
            ?? await db.LocationStocks.SingleOrDefaultAsync(x => x.LocationId == locationId && x.Sku == item.ProductSku, token);
        if (existing is not null) return existing;
        if (item.LocationId.HasValue) throw Insufficient(item.ProductSku);
        // Null means untracked legacy inventory, not zero. It cannot qualify for store pickup.
        if (item.CatalogStock is null) return null;
        var remaining = Math.Max(0, item.CatalogStock.Value - await movements.NetDebitedAsync(item.ProductSku, token));
        var stock = LocationStock.Create(StockLocation.CentralWarehouseId, item.ProductSku, remaining);
        db.LocationStocks.Add(stock);
        return stock;
    }

    public async Task<IReadOnlyList<PickupLocation>> PickupLocationsAsync(IReadOnlyList<InventoryRequest> items, CancellationToken token=default)
    {
        var required = Aggregate(items);
        if (required.Count == 0) return [];
        var locations = await db.StockLocations.AsNoTracking().Where(x => x.IsActive && x.PickupEnabled && !x.IsWarehouse).OrderBy(x => x.Name).ToListAsync(token);
        var balances = await db.LocationStocks.AsNoTracking().ToListAsync(token);
        var reservations = await db.StockReservations.AsNoTracking().Where(x => x.Status == "reserved" && x.ExpiresAt > clock.UtcNow).ToListAsync(token);
        return locations.Where(location => required.All(item => {
            var stock = balances.SingleOrDefault(x => x.LocationId == location.Id && x.Sku == item.ProductSku);
            return stock is not null && stock.OnHand - reservations.Where(x => x.StockId == stock.Id).Sum(x => x.Quantity) >= item.Quantity;
        })).Select(x => new PickupLocation(x.Id, x.Name, x.Country!, x.City!, x.Address!, x.Phone!, string.Join("\n", new[] { x.PickupHours, x.PickupInstructions }.Where(value => !string.IsNullOrWhiteSpace(value))), x.PickupHours, x.PickupInstructions)).ToArray();
    }

    public async Task ValidateAsync(IReadOnlyList<InventoryRequest> items, CancellationToken token=default)
    {
        await using var tx = await CommerceTransactions.BeginAsync(db, token); await Lock(token); await Expire(token);
        foreach (var item in Aggregate(items)) { var stock = await Stock(item, token); if (stock is not null && stock.Available < item.Quantity) throw Insufficient(item.ProductSku); }
        await db.SaveChangesAsync(token); await tx.CommitAsync(token);
    }

    public async Task ReserveAsync(Guid orderId, IReadOnlyList<InventoryRequest> items, CancellationToken token=default)
    {
        await using var tx = await CommerceTransactions.BeginAsync(db, token); await Lock(token); await Expire(token);
        if (!await db.StockReservations.AnyAsync(x => x.OrderId == orderId && x.Status == "reserved" && x.ExpiresAt > clock.UtcNow, token))
            await Reserve(orderId, items, token);
        await db.SaveChangesAsync(token); await tx.CommitAsync(token);
    }

    private async Task Reserve(Guid orderId, IReadOnlyList<InventoryRequest> items, CancellationToken token)
    {
        foreach (var item in Aggregate(items))
        {
            var stock = await Stock(item, token); if (stock is null) continue;
            if (stock.Available < item.Quantity) throw Insufficient(item.ProductSku);
            stock.Reserve(item.Quantity);
            db.StockReservations.Add(StockReservation.Create(orderId, stock.Id, item.Quantity, clock.UtcNow.AddMinutes(ReservationMinutes)));
        }
    }

    public async Task ReleaseAsync(Guid orderId, CancellationToken token=default)
    {
        await using var tx = await CommerceTransactions.BeginAsync(db, token); await Lock(token);
        foreach (var row in await db.StockReservations.Where(x => x.OrderId == orderId && x.Status == "reserved").ToListAsync(token))
        { (await db.LocationStocks.FindAsync([row.StockId], token))!.Release(row.Quantity); row.Release(); }
        await db.SaveChangesAsync(token); await tx.CommitAsync(token);
    }

    public async Task DebitAsync(Guid orderId, IReadOnlyList<InventoryRequest> items, CancellationToken token=default)
    {
        await using var tx = await CommerceTransactions.BeginAsync(db, token); await Lock(token);
        if ((await movements.ListByOrderAsync(orderId, token)).Any(x => x.Type == StockMovementType.Debit)) return;
        await Expire(token);
        var rows = await db.StockReservations.Where(x => x.OrderId == orderId && x.Status == "reserved").ToListAsync(token);
        // Query results can include rows expired above but not saved yet.
        rows = rows.Where(x => x.Status == "reserved").ToList();
        if (rows.Count == 0)
        {
            await Reserve(orderId, items, token);
            rows = db.StockReservations.Local.Where(x => x.OrderId == orderId && x.Status == "reserved").ToList();
        }
        foreach (var row in rows) { (await db.LocationStocks.FindAsync([row.StockId], token))!.Dispatch(row.Quantity); row.Consume(); }
        foreach (var item in Aggregate(items)) movements.Add(StockMovement.Create(orderId, item.ProductSku, item.Quantity, StockMovementType.Debit, clock.UtcNow));
        await db.SaveChangesAsync(token); await tx.CommitAsync(token);
    }

    public async Task CreditAsync(Guid orderId, CancellationToken token=default)
    {
        await using var tx = await CommerceTransactions.BeginAsync(db, token); await Lock(token);
        var movementsForOrder = await movements.ListByOrderAsync(orderId, token);
        if (movementsForOrder.Any(x => x.Type == StockMovementType.Credit)) return;
        foreach (var debit in movementsForOrder.Where(x => x.Type == StockMovementType.Debit))
        {
            var consumed = await db.StockReservations.Where(x => x.OrderId == orderId && x.Status == "consumed").ToListAsync(token);
            var restored = false;
            foreach (var reservation in consumed)
            {
                var reservedStock = await db.LocationStocks.FindAsync([reservation.StockId], token);
                if (reservedStock?.Sku != debit.ProductSku) continue;
                reservedStock.Receive(reservation.Quantity); restored = true;
            }
            if (!restored) {
                var stock = await db.LocationStocks.SingleOrDefaultAsync(x => x.LocationId == StockLocation.CentralWarehouseId && x.Sku == debit.ProductSku, token);
                stock?.Receive(debit.Quantity);
            }
            movements.Add(StockMovement.Create(orderId, debit.ProductSku, debit.Quantity, StockMovementType.Credit, clock.UtcNow));
        }
        await db.SaveChangesAsync(token); await tx.CommitAsync(token);
    }

    private static IReadOnlyList<InventoryRequest> Aggregate(IReadOnlyList<InventoryRequest> items) => items.GroupBy(x => new { x.ProductSku, x.LocationId }).Select(g => new InventoryRequest(g.Key.ProductSku, g.Sum(x => x.Quantity), g.First().CatalogStock, g.Key.LocationId)).ToArray();
    private static CommerceException Insufficient(string sku) => new("insufficient_stock", $"Stock insuficiente para {sku}.");
}
