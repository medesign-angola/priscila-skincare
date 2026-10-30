namespace PriscilaSkincare.Application.Orders;

public interface ICommerceTransaction : IAsyncDisposable
{
    Task CommitAsync(CancellationToken token = default);
}

public interface ICommerceTransactions
{
    Task<ICommerceTransaction> BeginAsync(CancellationToken token = default);
}
