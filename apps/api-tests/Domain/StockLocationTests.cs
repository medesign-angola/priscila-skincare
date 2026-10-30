using PriscilaSkincare.Domain.Fulfillment;

namespace PriscilaSkincare.Api.Tests.Domain;

public sealed class StockLocationTests
{
    [Fact]
    public void CentralWarehouse_HasStableIdentityAndCannotOfferPickup()
    {
        var warehouse = StockLocation.CentralWarehouse();
        Assert.Equal(StockLocation.CentralWarehouseId, warehouse.Id);
        Assert.False(warehouse.PickupEnabled);
        Assert.Throws<InvalidOperationException>(() => warehouse.Update("Central", true, true,
            "Angola", "Luanda", "Rua 1", "+244900000000", "Segunda a sexta"));
        Assert.Equal("Armazém central", warehouse.Name);
    }

    [Fact]
    public void NewStore_IsNotAutomaticallyAvailableForPickup()
    {
        var store = StockLocation.Create(" Loja ", false);
        Assert.Equal("Loja", store.Name);
        Assert.False(store.PickupEnabled);
    }

    [Fact]
    public void Pickup_RequiresCompleteContactAndAddress()
    {
        var store = StockLocation.Create("Loja", false);
        var version = store.Version;
        Assert.Throws<InvalidOperationException>(() => store.Update("Loja", true, true,
            "Angola", "Luanda", null, null, null));
        Assert.Equal(version, store.Version);
        Assert.False(store.PickupEnabled);
    }

    [Fact]
    public void CompleteActiveStore_CanOfferPickupAndUpdatesVersion()
    {
        var store = StockLocation.Create("Loja", false);
        var version = store.Version;
        Assert.Throws<InvalidOperationException>(() => store.Update("Loja", true, true, "Angola", "Luanda", "Rua 1", "+244900000000", "Aguardar confirmação"));
        store.Update("Loja", true, true, "Angola", "Luanda", "Rua 1", "+244900000000", "Aguardar confirmação", "Segunda a sexta: 8h–15h");
        Assert.True(store.PickupEnabled);
        Assert.NotEqual(version, store.Version);
        Assert.Throws<InvalidOperationException>(() => store.Update("Loja", false, true,
            "Angola", "Luanda", "Rua 1", "+244900000000", "Segunda a sexta"));
        store.Update("Loja", false, false, "Angola", "Luanda", "Rua 1", "+244900000000", "Segunda a sexta");
        Assert.False(store.IsActive);
    }
}
