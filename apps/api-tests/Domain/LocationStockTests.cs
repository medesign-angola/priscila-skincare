using PriscilaSkincare.Domain.Fulfillment;

namespace PriscilaSkincare.Api.Tests.Domain;
public sealed class LocationStockTests
{
    [Fact]
    public void ReservationsDoNotRemovePhysicalStockUntilDispatch()
    {
        var stock = LocationStock.Create(Guid.NewGuid(), "SOAP-001", 10);
        stock.Reserve(3);
        Assert.Equal(10, stock.OnHand); Assert.Equal(7, stock.Available);
        stock.Dispatch(3);
        Assert.Equal(7, stock.OnHand); Assert.Equal(0, stock.Reserved);
    }
    [Fact]
    public void ReservedUnitsCannotBeSoldOrTransferredTwice()
    {
        var stock = LocationStock.Create(Guid.NewGuid(), "SOAP-001", 2);
        stock.Reserve(2);
        Assert.Throws<InvalidOperationException>(() => stock.Reserve(1));
        Assert.Throws<InvalidOperationException>(() => stock.Remove(1));
        stock.Release(2); Assert.Equal(2, stock.Available);
    }
    [Fact]
    public void RejectsNegativeQuantities()
    {
        var stock = LocationStock.Create(Guid.NewGuid(), "SOAP-001", 2);
        Assert.Throws<ArgumentOutOfRangeException>(() => stock.Receive(-1));
        Assert.Throws<ArgumentOutOfRangeException>(() => stock.Reserve(0));
        Assert.Throws<InvalidOperationException>(() => stock.Release(1));
    }
    [Fact]
    public void ReleasedReservationCannotBeConsumed()
    {
        var row = StockReservation.Create(Guid.NewGuid(), Guid.NewGuid(), 1, DateTimeOffset.UtcNow);
        row.Release(); row.Release();
        Assert.Throws<InvalidOperationException>(() => row.Consume());
    }
}
