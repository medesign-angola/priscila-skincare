using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Domain.Fulfillment;

namespace PriscilaSkincare.Api.Tests.Domain;
public sealed class CommerceRulesTests
{
    [Theory]
    [InlineData(PromotionBenefit.Percentage, 25, 100, 20, 25)]
    [InlineData(PromotionBenefit.FixedAmount, 200, 100, 20, 100)]
    [InlineData(PromotionBenefit.FreeShipping, 0, 100, 20, 20)]
    public void DiscountIsCappedAndDoesNotStack(PromotionBenefit kind, decimal value, decimal subtotal, decimal shipping, decimal expected)
    {
        var promotion = Promotion.Create();
        promotion.Update("Campanha", " test ", true, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(1), kind, value, "AOA", 0, null, null, false, null, null);
        Assert.Equal(expected, promotion.Discount(subtotal, shipping));
        Assert.Equal("TEST", promotion.Coupon);
    }
    [Fact]
    public void InvalidPercentageAndDateRangeAreRejected()
    {
        var promotion = Promotion.Create(); var now = DateTimeOffset.UtcNow;
        Assert.Throws<ArgumentException>(() => promotion.Update("Campanha", null, true, now, now.AddDays(1), PromotionBenefit.Percentage, 101, "AOA", 0, null, null, false, null, null));
        Assert.Throws<ArgumentException>(() => promotion.Update("Campanha", null, true, now, now, PromotionBenefit.Percentage, 10, "AOA", 0, null, null, false, null, null));
    }
    [Fact]
    public void DeliveryRateMatchesCountryRegionAndCurrency()
    {
        var rate = DeliveryRate.Create();
        rate.Update("Luanda", "Angola", "Luanda", "Parceiro", "Normal", "AOA", 1000, 1, 3, true);
        Assert.True(rate.Covers("angola", "Luanda", "AOA"));
        Assert.False(rate.Covers("Angola", "Benguela", "AOA"));
        Assert.False(rate.Covers("Angola", "Luanda", "EUR"));
    }
}
