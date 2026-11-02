using PriscilaSkincare.Domain.Customers;

namespace PriscilaSkincare.Application.Orders;
public sealed record DeliveryOption(Guid Id, string Name, string Carrier, string Service, decimal Amount, int MinimumDays, int MaximumDays);
public sealed record CommerceQuote(decimal Shipping, decimal Discount, Guid? PromotionId, string? PromotionName, Guid? DeliveryRateId, IReadOnlyList<DeliveryOption> DeliveryOptions);
public interface ICommercePricing
{
    Task<CommerceQuote> QuoteAsync(Guid customerId, CustomerAddress address, string currency, IReadOnlyList<CheckoutItemResult> items,
        string? coupon, Guid? deliveryRateId, Guid? reserveForOrder = null, CancellationToken token = default, bool pickup = false);
    Task CompleteAsync(Guid orderId, bool approved, CancellationToken token = default);
}
