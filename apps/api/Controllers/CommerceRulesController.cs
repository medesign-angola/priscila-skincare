using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Domain.Orders;
using PriscilaSkincare.Infrastructure.Persistence;

namespace PriscilaSkincare.Api.Controllers;
[ApiController, AllowAnonymous, Route("api/v1/integrations/strapi")]
public sealed class CommerceRulesController(ApplicationDbContext db, IConfiguration configuration) : ControllerBase
{
    [HttpGet("/api/v1/delivery/countries")]
    public async Task<IActionResult> DeliveryCountries(CancellationToken token)
    {
        var countries = await db.DeliveryRates.AsNoTracking().Where(x => x.IsActive)
            .Select(x => x.Country).Distinct().ToArrayAsync(token);
        return Ok(countries.Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToArray());
    }
    private bool Allowed()
    {
        var expected = configuration["Strapi:IntegrationSecret"] ?? "";
        var supplied = Request.Headers["X-Integration-Secret"].ToString();
        return expected.Length >= 32 && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(supplied));
    }
    [HttpGet("delivery-rates")]
    public async Task<IActionResult> Rates(CancellationToken token)
    { if (!Allowed()) return Unauthorized(); return Ok(await db.DeliveryRates.AsNoTracking().OrderBy(x => x.Name).ToArrayAsync(token)); }
    [HttpGet("promotions")]
    public async Task<IActionResult> Promotions(CancellationToken token)
    { if (!Allowed()) return Unauthorized(); return Ok(await db.Promotions.AsNoTracking().OrderBy(x => x.Name).ToArrayAsync(token)); }
    [HttpPost("delivery-rates")]
    public async Task<IActionResult> SaveRate(DeliveryRateWrite r, CancellationToken token)
    {
        if (!Allowed()) return Unauthorized();
        var value = r.Id.HasValue ? await db.DeliveryRates.FindAsync([r.Id.Value], token) : DeliveryRate.Create();
        if (value is null) return NotFound();
        if (r.Id.HasValue && value.Version != r.Version) return Changed();
        value.Update(r.Name, r.Country, r.Province, r.Carrier, r.Service, r.Currency, r.Amount, r.MinimumDays, r.MaximumDays, r.IsActive);
        if (!r.Id.HasValue) db.DeliveryRates.Add(value);
        try { await db.SaveChangesAsync(token); } catch (DbUpdateConcurrencyException) { return Changed(); }
        return Ok(value);
    }
    [HttpPost("promotions")]
    public async Task<IActionResult> SavePromotion(PromotionWrite r, CancellationToken token)
    {
        if (!Allowed()) return Unauthorized();
        var value = r.Id.HasValue ? await db.Promotions.FindAsync([r.Id.Value], token) : Promotion.Create();
        if (value is null) return NotFound();
        if (r.Id.HasValue && value.Version != r.Version) return Changed();
        value.Update(r.Name, r.Coupon, r.IsActive, r.StartsAt, r.EndsAt, r.Benefit, r.Value, r.Currency,
            r.MinimumSubtotal, r.MaximumUses, r.MaximumUsesPerCustomer, r.FirstPurchaseOnly, r.ItemType, r.ItemReference);
        if (value.Coupon is not null && await db.Promotions.AnyAsync(x => x.Coupon == value.Coupon && x.Id != value.Id, token))
            return Conflict(new { title = "Já existe uma promoção com este cupão." });
        if (!r.Id.HasValue) db.Promotions.Add(value);
        try { await db.SaveChangesAsync(token); }
        catch (DbUpdateConcurrencyException) { return Changed(); }
        catch (DbUpdateException e) when (e.InnerException is MySql.Data.MySqlClient.MySqlException { Number: 1062 })
        { return Conflict(new { title = "Já existe uma promoção com este cupão." }); }
        return Ok(value);
    }
    private ConflictObjectResult Changed() => Conflict(new { title = "Os dados foram alterados. Actualize a página antes de guardar." });
}
public sealed record DeliveryRateWrite(Guid? Id, Guid? Version, string Name, string Country, string? Province, string Carrier,
    string Service, string Currency, decimal Amount, int MinimumDays, int MaximumDays, bool IsActive);
public sealed record PromotionWrite(Guid? Id, Guid? Version, string Name, string? Coupon, bool IsActive, DateTimeOffset StartsAt,
    DateTimeOffset EndsAt, PromotionBenefit Benefit, decimal Value, string Currency, decimal MinimumSubtotal, int? MaximumUses,
    int? MaximumUsesPerCustomer, bool FirstPurchaseOnly, CommerceItemType? ItemType, string? ItemReference);
