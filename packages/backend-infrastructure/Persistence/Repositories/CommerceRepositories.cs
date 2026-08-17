using Microsoft.EntityFrameworkCore;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Persistence.Repositories;

internal sealed class ShoppingCartRepository(ApplicationDbContext db) : IShoppingCartRepository
{
    public Task<ShoppingCart?> FindAsync(Guid customerId, CancellationToken token = default) =>
        db.ShoppingCarts.Include(x => x.Items).SingleOrDefaultAsync(x => x.CustomerId == customerId, token);
    public void Add(ShoppingCart cart) => db.ShoppingCarts.Add(cart);
}

internal sealed class OrderRepository(ApplicationDbContext db) : IOrderRepository
{
    private IQueryable<Order> Query => db.Orders.Include(x => x.Items).Include(x => x.Timeline);
    public Task<Order?> FindByIdAsync(Guid id, CancellationToken token = default) =>
        Query.SingleOrDefaultAsync(x => x.Id == id, token);
    public Task<Order?> FindByIdAsync(Guid customerId, Guid id, CancellationToken token = default) =>
        Query.SingleOrDefaultAsync(x => x.CustomerId == customerId && x.Id == id, token);
    public Task<Order?> FindByIdempotencyKeyAsync(Guid customerId, string key, CancellationToken token = default) =>
        Query.SingleOrDefaultAsync(x => x.CustomerId == customerId && x.IdempotencyKey == key, token);
    public async Task<IReadOnlyList<Order>> ListAsync(Guid customerId, CancellationToken token = default) =>
        await Query.Where(x => x.CustomerId == customerId).OrderByDescending(x => x.CreatedAt).ToListAsync(token);
    public void Add(Order order) => db.Orders.Add(order);
}

internal sealed class PaymentRepository(ApplicationDbContext db) : IPaymentRepository
{
    public Task<Payment?> FindByOrderAsync(Guid orderId,CancellationToken token=default)=>db.Payments.FirstOrDefaultAsync(x=>x.OrderId==orderId,token);
    public void Add(Payment payment)=>db.Payments.Add(payment);
}
internal sealed class StockMovementRepository(ApplicationDbContext db) : IStockMovementRepository
{
    public async Task<int> NetDebitedAsync(string sku,CancellationToken token=default)=>await db.StockMovements.Where(x=>x.ProductSku==sku).SumAsync(x=>x.Type==StockMovementType.Debit?x.Quantity:-x.Quantity,token);
    public async Task<IReadOnlyList<StockMovement>> ListByOrderAsync(Guid orderId,CancellationToken token=default)=>await db.StockMovements.Where(x=>x.OrderId==orderId).ToListAsync(token);
    public void Add(StockMovement movement)=>db.StockMovements.Add(movement);
}
