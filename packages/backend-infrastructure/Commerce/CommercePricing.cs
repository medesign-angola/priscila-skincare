using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Orders;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Infrastructure.Persistence;

namespace PriscilaSkincare.Infrastructure.Commerce;
internal sealed class CommercePricing(ApplicationDbContext db, IClock clock, IConfiguration configuration) : ICommercePricing
{
    public async Task<CommerceQuote> QuoteAsync(Guid customerId, CustomerAddress address, string currency,
        IReadOnlyList<CheckoutItemResult> items, string? coupon, Guid? deliveryRateId, Guid? reserveForOrder = null, CancellationToken token = default, bool pickup = false)
    {
        await using var tx = await CommerceTransactions.BeginAsync(db, token);
        await db.StockLocations.FromSqlInterpolated($"SELECT * FROM stock_locations WHERE id = {StockLocation.CentralWarehouseId} FOR UPDATE").ToListAsync(token);
        var allRates = await db.DeliveryRates.AsNoTracking().Where(x => x.IsActive).ToListAsync(token);
        var rates = allRates.Where(x => x.Covers(address.Country, address.Province, currency)).OrderBy(x => x.Amount).ThenBy(x => x.Id).ToArray();
        var selected = pickup ? null : deliveryRateId.HasValue ? rates.FirstOrDefault(x => x.Id == deliveryRateId) : rates.FirstOrDefault();
        if (!pickup && (deliveryRateId.HasValue || allRates.Count > 0 || configuration.GetValue("Delivery:RequireConfiguredRate", true)) && selected is null)
            throw new CommerceException("delivery_unavailable", "Não existe uma opção de entrega disponível para esta morada e moeda.");
        var shipping = selected?.Amount ?? 0;
        var subtotal = items.Sum(x => x.Total);
        var normalizedCoupon = string.IsNullOrWhiteSpace(coupon) ? null : coupon.Trim().ToUpperInvariant();
        var now = clock.UtcNow;
        var promotions = await db.Promotions.AsNoTracking().Where(x => x.IsActive && x.StartsAt <= now && x.EndsAt > now && x.Currency == currency).ToListAsync(token);
        var uses = await db.PromotionUsages.AsNoTracking().Where(x => x.Status == "consumed" || (x.Status == "reserved" && x.ExpiresAt > now)).ToListAsync(token);
        var hasPurchase = await db.Orders.AnyAsync(x => x.CustomerId == customerId && (x.Status == OrderStatus.Paid || x.Status == OrderStatus.Processing || x.Status == OrderStatus.Shipped || x.Status == OrderStatus.Delivered || x.Status == OrderStatus.Refunded), token);
        Promotion? best = null; decimal discount = 0; var couponEligible = normalizedCoupon is null;
        foreach (var p in promotions.OrderBy(x => x.Id))
        {
            if (p.Coupon is not null && p.Coupon != normalizedCoupon) continue;
            if (subtotal < p.MinimumSubtotal || (p.FirstPurchaseOnly && hasPurchase)) continue;
            var promotionUses = uses.Where(x => x.PromotionId == p.Id && x.OrderId != reserveForOrder).ToArray();
            if (p.FirstPurchaseOnly && promotionUses.Any(x => x.CustomerId == customerId)) continue;
            if (p.MaximumUses is int max && promotionUses.Length >= max) continue;
            if (p.MaximumUsesPerCustomer is int perCustomer && promotionUses.Count(x => x.CustomerId == customerId) >= perCustomer) continue;
            var eligible = items.Where(x => (!p.ItemType.HasValue || x.ItemType == p.ItemType.Value.ToString().ToLowerInvariant()) &&
                (p.ItemReference is null || string.Equals(x.Reference, p.ItemReference, StringComparison.OrdinalIgnoreCase))).Sum(x => x.Total);
            if (eligible <= 0) continue;
            var value = p.Discount(eligible, shipping);
            if (p.Coupon == normalizedCoupon && normalizedCoupon is not null) couponEligible = true;
            if (value > discount) { best = p; discount = value; }
        }
        if (!couponEligible) throw new CommerceException("coupon_unavailable", "Este cupão não está disponível para esta encomenda.");
        if (reserveForOrder is Guid orderId && best is not null)
        {
            if (!await db.PromotionUsages.AnyAsync(x => x.OrderId == orderId, token))
                db.PromotionUsages.Add(new() { Id = Guid.NewGuid(), OrderId = orderId, CustomerId = customerId, PromotionId = best.Id,
                    ExpiresAt = now.AddMinutes(Math.Clamp(configuration.GetValue("Inventory:ReservationMinutes", 1440), 5, 10080)) });
            await db.SaveChangesAsync(token);
        }
        await tx.CommitAsync(token);
        return new(shipping, discount, best?.Id, best?.Name, selected?.Id, rates.Select(x => new DeliveryOption(x.Id, x.Name, x.Carrier, x.Service, x.Amount, x.MinimumDays, x.MaximumDays)).ToArray());
    }

    public async Task CompleteAsync(Guid orderId, bool approved, CancellationToken token = default)
    {
        await using var tx = await CommerceTransactions.BeginAsync(db, token);
        await db.StockLocations.FromSqlInterpolated($"SELECT * FROM stock_locations WHERE id = {StockLocation.CentralWarehouseId} FOR UPDATE").ToListAsync(token);
        var usage = await db.PromotionUsages.SingleOrDefaultAsync(x => x.OrderId == orderId, token);
        if (usage is null || (approved && usage.Status == "consumed") || usage.Status == "released") return;
        if (approved && usage.ExpiresAt <= clock.UtcNow)
            throw new CommerceException("promotion_reservation_expired", "A reserva da promoção expirou. Reveja a encomenda antes de confirmar o pagamento.");
        usage.Status = approved ? "consumed" : "released";
        await db.SaveChangesAsync(token);
        await tx.CommitAsync(token);
    }
}
