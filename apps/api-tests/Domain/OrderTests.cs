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
}
