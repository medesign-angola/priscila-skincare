using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PriscilaSkincare.Application.Orders;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Infrastructure.Persistence;

namespace PriscilaSkincare.Infrastructure.Commerce;

internal sealed class CommerceTransactions(ApplicationDbContext db) : ICommerceTransactions
{
    public Task<ICommerceTransaction> BeginAsync(CancellationToken token = default) => BeginAsync(db, token);

    internal static async Task<ICommerceTransaction> BeginAsync(ApplicationDbContext db, CancellationToken token)
    {
        if (db.Database.CurrentTransaction is not null) return new Scope(null);
        var transaction = await db.Database.BeginTransactionAsync(token);
        try
        {
            // A shared lock orders stock/coupon/payment writes consistently, including retries.
            var rows = await db.StockLocations.FromSqlInterpolated($"SELECT * FROM stock_locations WHERE id = {StockLocation.CentralWarehouseId} FOR UPDATE").ToListAsync(token);
            if (rows.Count != 1) throw new InvalidOperationException("A gestão comercial ainda não foi inicializada.");
            return new Scope(transaction);
        }
        catch { await transaction.DisposeAsync(); throw; }
    }

    private sealed class Scope(IDbContextTransaction? transaction) : ICommerceTransaction
    {
        public Task CommitAsync(CancellationToken token = default) => transaction?.CommitAsync(token) ?? Task.CompletedTask;
        public ValueTask DisposeAsync() => transaction?.DisposeAsync() ?? ValueTask.CompletedTask;
    }
}
