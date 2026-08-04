using PriscilaSkincare.Domain.Catalog;

namespace PriscilaSkincare.Api.Tests.Domain;

public sealed class ProductSkuTests
{
    [Fact]
    public void Create_NormalizesSku()
    {
        var sku = ProductSku.Create("  snow-001 ");

        Assert.Equal("SNOW-001", sku.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_RejectsEmptySku(string value) =>
        Assert.Throws<ArgumentException>(() => ProductSku.Create(value));
}
