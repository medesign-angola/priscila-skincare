using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Api.Tests.Domain;

public sealed class OrderPickupTests
{
    [Fact]
    public void PickupPreservesStoreAndCannotChargeDelivery()
    {
        var order = Order.Create(Guid.NewGuid(), DateTimeOffset.UtcNow);
        order.AddItem(CommerceItemType.Product, CommerceItemReference.Create("SOAP-1"), "Soap", null, Money.Create(100, "AOA"), 1);
        order.SetShipping(Money.Create(20, "AOA"));
        var store = new OrderPickup(Guid.NewGuid(), "Loja", "Angola", "Luanda", "Rua 1", "+244923000000", "Aguardar confirmação");
        order.SetPickup(store);
        Assert.Equal(store, order.Pickup);
        Assert.Equal(0, order.ShippingAmount);
        Assert.Equal(100, order.TotalAmount);
        Assert.Throws<InvalidOperationException>(() => order.SetShipping(Money.Create(20, "AOA")));
        order.ChangeStatus(OrderStatus.Confirmed, DateTimeOffset.UtcNow);
        Assert.Throws<InvalidOperationException>(() => order.SetPickup(store with { Name = "Outra loja" }));
        Assert.Equal(store, order.Pickup);
    }
}
