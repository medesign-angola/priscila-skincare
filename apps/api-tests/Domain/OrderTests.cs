using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Api.Tests.Domain;

public sealed class OrderTests
{
    [Fact]
    public void AddItem_KeepsCommercialSnapshot()
    {
        var order = Order.Create(Guid.NewGuid(), DateTimeOffset.UtcNow);

        order.AddItem(
            ProductSku.Create("SNOW-001"),
            "Snow White Soap",
            "150G",
            Money.Create(12_500, "AOA"),
            2);

        var item = Assert.Single(order.Items);
        Assert.Equal("SNOW-001", item.ProductSku.Value);
        Assert.Equal("Snow White Soap", item.ProductName);
        Assert.Equal(12_500, item.UnitPrice.Amount);
        Assert.Equal(2, item.Quantity);
    }

    [Fact]
    public void Create_KeepsAddressAndTotalSnapshots()
    {
        var now = DateTimeOffset.UtcNow;
        var order = Order.Create(Guid.NewGuid(), "PSC-001", "AOA",
            new OrderAddress("Priscila", "+244900000000", "Angola", "Luanda", "Luanda", "Talatona", "Rua 1", "10", null, null), now, "checkout-1");
        order.AddItem(ProductSku.Create("SNOW-001"), "Snow White", "500 ml", Money.Create(10_000, "AOA"), 2);
        Assert.Equal(20_000, order.SubtotalAmount);
        Assert.Equal("Talatona", order.Neighborhood);
        Assert.Single(order.Timeline);
    }

    [Fact]
    public void ChangeStatus_RejectsBackwardTransition()
    {
        var order = Order.Create(Guid.NewGuid(), DateTimeOffset.UtcNow);
        order.ChangeStatus(OrderStatus.Confirmed, DateTimeOffset.UtcNow);
        order.ChangeStatus(OrderStatus.Processing, DateTimeOffset.UtcNow);
        Assert.Throws<InvalidOperationException>(() => order.ChangeStatus(OrderStatus.Pending, DateTimeOffset.UtcNow));
    }
}
