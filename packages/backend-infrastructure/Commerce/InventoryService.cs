using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Orders;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Infrastructure.Commerce;

internal sealed class InventoryService(IStockMovementRepository movements,IUnitOfWork unitOfWork,IClock clock):IInventoryService
{
    public async Task ValidateAsync(IReadOnlyList<InventoryRequest> items,CancellationToken token=default)
    {
        foreach(var item in items){if(item.CatalogStock is null)continue;var used=await movements.NetDebitedAsync(item.ProductSku,token);if(item.Quantity>item.CatalogStock.Value-used)throw new CommerceException("insufficient_stock",$"Stock insuficiente para {item.ProductSku}.");}
    }
    public async Task DebitAsync(Guid orderId,IReadOnlyList<InventoryRequest> items,CancellationToken token=default)
    {if((await movements.ListByOrderAsync(orderId,token)).Any(x=>x.Type==StockMovementType.Debit))return;await ValidateAsync(items,token);foreach(var item in items)movements.Add(StockMovement.Create(orderId,item.ProductSku,item.Quantity,StockMovementType.Debit,clock.UtcNow));}
    public async Task CreditAsync(Guid orderId,CancellationToken token=default)
    {var rows=await movements.ListByOrderAsync(orderId,token);if(rows.Any(x=>x.Type==StockMovementType.Credit))return;foreach(var debit in rows.Where(x=>x.Type==StockMovementType.Debit))movements.Add(StockMovement.Create(orderId,debit.ProductSku,debit.Quantity,StockMovementType.Credit,clock.UtcNow));await unitOfWork.SaveChangesAsync(token);}
}
