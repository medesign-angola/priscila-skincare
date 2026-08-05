using PriscilaSkincare.Domain.Catalog;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Api.Tests.Domain;

public sealed class ShoppingCartTests
{
    [Fact]
    public void Add_MergesSameSkuAndVariant()
    {
        var cart = ShoppingCart.Create(Guid.NewGuid(), DateTimeOffset.UtcNow);
        cart.Add(ProductSku.Create("SNOW-001"), "500ml", "500 ml", 1, DateTimeOffset.UtcNow);
        cart.Add(ProductSku.Create("SNOW-001"), "500ml", "500 ml", 2, DateTimeOffset.UtcNow);
        var item = Assert.Single(cart.Items);
        Assert.Equal(3, item.Quantity);
    }

    [Fact]
    public void SetQuantity_ZeroRemovesItem()
    {
        var cart = ShoppingCart.Create(Guid.NewGuid(), DateTimeOffset.UtcNow);
        cart.Add(ProductSku.Create("SNOW-001"), null, null, 1, DateTimeOffset.UtcNow);
        cart.SetQuantity(cart.Items.Single().Id, 0, DateTimeOffset.UtcNow);
        Assert.Empty(cart.Items);
    }
}
