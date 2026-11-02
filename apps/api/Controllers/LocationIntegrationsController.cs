using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriscilaSkincare.Domain.Fulfillment;
using PriscilaSkincare.Infrastructure.Persistence;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Catalog;

namespace PriscilaSkincare.Api.Controllers;

// Server-to-server only. The CMS must enforce commercial permissions before
// proxying requests. Never expose the integration secret to the browser.
[ApiController, AllowAnonymous, Route("api/v1/integrations/strapi/locations")]
public sealed class LocationIntegrationsController(ApplicationDbContext db, IConfiguration configuration,
    ICatalogGateway catalog, IStockMovementRepository movements, IClock clock) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken token)
    {
        if (!IsAuthorized()) return Unauthorized();
        return Ok(await db.StockLocations.AsNoTracking().OrderBy(x => x.Name).ToListAsync(token));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateLocationRequest request, CancellationToken token)
    {
        if (!IsAuthorized()) return Unauthorized();
        var location = StockLocation.Create(request.Name, request.IsWarehouse);
        db.StockLocations.Add(location);
        await db.SaveChangesAsync(token);
        return StatusCode(StatusCodes.Status201Created, location);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateLocationRequest request, CancellationToken token)
    {
        if (!IsAuthorized()) return Unauthorized();
        var location = await db.StockLocations.SingleOrDefaultAsync(x => x.Id == id, token);
        if (location is null) return NotFound();
        if (location.Version != request.Version) return Stale();
        location.Update(request.Name, request.IsActive, request.PickupEnabled, request.Country,
            request.City, request.Address, request.Phone, request.PickupInstructions, request.PickupHours);
        try { await db.SaveChangesAsync(token); }
        catch (DbUpdateConcurrencyException) { return Stale(); }
        return Ok(location);
    }

    private ConflictObjectResult Stale() => Conflict(new
    {
        code = "location_changed", title = "Esta localização foi alterada. Actualize a página antes de guardar."
    });

    [HttpGet("{id:guid}/stock")]
    public async Task<IActionResult> Stock(Guid id, CancellationToken token)
    {
        if (!IsAuthorized()) return Unauthorized();
        return Ok(await db.LocationStocks.AsNoTracking().Where(x => x.LocationId == id).OrderBy(x => x.Sku).ToListAsync(token));
    }

    // Receives raw catalogue quantities from the trusted CMS, never the
    // availability calculated from location balances/reservations.
    [HttpPost("central-stock/import")]
    public async Task<IActionResult> ImportCentralStock(ImportCentralStockRequest request, CancellationToken token)
    {
        if (!IsAuthorized()) return Unauthorized();
        if (request.Products is null || request.Products.Count > 1000 ||
            request.Products.Any(p => string.IsNullOrWhiteSpace(p.Sku) || p.Sku.Length > 100 || p.Stock < 0))
            return BadRequest(new { title = "Dados de stock inicial inválidos." });
        var products = request.Products.GroupBy(p => ProductSku.Create(p.Sku).Value).ToArray();
        if (products.Any(group => group.Select(p => p.Stock).Distinct().Count() > 1))
            return BadRequest(new { title = "Quantidades iniciais inconsistentes para a mesma referência." });
        await using var tx = await db.Database.BeginTransactionAsync(token);
        var warehouse = await db.StockLocations.FromSqlInterpolated($"SELECT * FROM stock_locations WHERE id = {StockLocation.CentralWarehouseId} FOR UPDATE").ToListAsync(token);
        if (warehouse.Count != 1) return Conflict(new { title = "O Armazém central ainda não foi criado." });
        var existing = (await db.LocationStocks.Where(s => s.LocationId == StockLocation.CentralWarehouseId)
            .Select(s => s.Sku).ToListAsync(token)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var imported = 0;
        foreach (var group in products)
        {
            var product = group.First();
            if (product.Stock is null || !existing.Add(group.Key)) continue;
            var remaining = Math.Max(0, product.Stock.Value - await movements.NetDebitedAsync(group.Key, token));
            db.LocationStocks.Add(LocationStock.Create(StockLocation.CentralWarehouseId, group.Key, remaining));
            imported++;
        }
        await db.SaveChangesAsync(token);
        await tx.CommitAsync(token);
        return Ok(new { imported });
    }

    [HttpPost("{id:guid}/stock")]
    public async Task<IActionResult> Adjust(Guid id, AdjustStockRequest request, CancellationToken token)
    {
        if (!IsAuthorized()) return Unauthorized();
        if (request.OperationId == Guid.Empty || request.Quantity <= 0 || string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length > 500)
            return BadRequest(new { title = "Indique quantidade positiva, motivo e identificação da operação." });
        if (request.SourceLocationId == id) return BadRequest(new { title = "Escolha localizações diferentes." });
        var sku = ProductSku.Create(request.Sku);
        var product = await catalog.FindBySkuAsync(sku, "pt", token);
        if (product is null) return NotFound(new { title = "Produto não encontrado." });
        await using var tx = await db.Database.BeginTransactionAsync(token);
        await db.StockLocations.FromSqlInterpolated($"SELECT * FROM stock_locations WHERE id = {StockLocation.CentralWarehouseId} FOR UPDATE").ToListAsync(token);
        var existing = await db.StockAdjustments.FindAsync([request.OperationId], token);
        if (existing is not null)
        {
            if (existing.DestinationLocationId != id || existing.SourceLocationId != request.SourceLocationId || existing.Sku != sku.Value || existing.Quantity != request.Quantity)
                return Conflict(new { title = "A identificação já foi usada para outra operação." });
            return Ok(existing);
        }
        if (!await db.StockLocations.AnyAsync(x => x.Id == id && x.IsActive, token)) return BadRequest(new { title = "Localização de destino inactiva ou inexistente." });
        // Import the legacy balance once before the first receipt/transfer for this SKU.
        var central = await db.LocationStocks.SingleOrDefaultAsync(x => x.LocationId == StockLocation.CentralWarehouseId && x.Sku == sku.Value, token);
        if (central is null)
        {
            if (product.Stock is null) return BadRequest(new { title = "Defina primeiro a quantidade inicial do produto no catálogo." });
            central = LocationStock.Create(StockLocation.CentralWarehouseId, sku.Value, Math.Max(0, product.Stock.Value - await movements.NetDebitedAsync(sku.Value, token)));
            db.LocationStocks.Add(central);
        }
        if (request.SourceLocationId is { } sourceId)
        {
            var source = sourceId == StockLocation.CentralWarehouseId ? central : await db.LocationStocks.SingleOrDefaultAsync(x => x.LocationId == sourceId && x.Sku == sku.Value, token);
            if (source is null || source.Available < request.Quantity) return BadRequest(new { title = "Stock disponível insuficiente na origem." });
            source.Remove(request.Quantity);
        }
        var destination = id == StockLocation.CentralWarehouseId ? central : await db.LocationStocks.SingleOrDefaultAsync(x => x.LocationId == id && x.Sku == sku.Value, token);
        if (destination is null) { destination = LocationStock.Create(id, sku.Value, 0); db.LocationStocks.Add(destination); }
        if (!request.SourceLocationId.HasValue) destination.Receive(request.Quantity);
        var adjustment = new StockAdjustment { Id = request.OperationId, SourceLocationId = request.SourceLocationId, DestinationLocationId = id, Sku = sku.Value, Quantity = request.Quantity, Reason = request.Reason.Trim(), CreatedAt = clock.UtcNow,
            Status = request.SourceLocationId.HasValue ? "in_transit" : "received", ReceivedAt = request.SourceLocationId.HasValue ? null : clock.UtcNow };
        db.StockAdjustments.Add(adjustment);
        await db.SaveChangesAsync(token); await tx.CommitAsync(token);
        return Ok(adjustment);
    }

    [HttpGet("{id:guid}/transfers")]
    public async Task<IActionResult> Transfers(Guid id, CancellationToken token)
    {
        if (!IsAuthorized()) return Unauthorized();
        return Ok(await db.StockAdjustments.AsNoTracking().Where(x => x.Status == "in_transit" &&
            (x.SourceLocationId == id || x.DestinationLocationId == id)).OrderBy(x => x.CreatedAt).ToListAsync(token));
    }

    [HttpPost("{id:guid}/transfers")]
    public async Task<IActionResult> Receive(Guid id, ReceiveStockRequest request, CancellationToken token)
    {
        if (!IsAuthorized()) return Unauthorized();
        await using var tx = await db.Database.BeginTransactionAsync(token);
        await db.StockLocations.FromSqlInterpolated($"SELECT * FROM stock_locations WHERE id = {StockLocation.CentralWarehouseId} FOR UPDATE").ToListAsync(token);
        var transfer = await db.StockAdjustments.SingleOrDefaultAsync(x => x.Id == request.OperationId && x.DestinationLocationId == id && x.SourceLocationId != null, token);
        if (transfer is null) return NotFound();
        if (transfer.Status == "received") return Ok(transfer);
        if (transfer.Status != "in_transit") return Conflict();
        var stock = await db.LocationStocks.SingleAsync(x => x.LocationId == id && x.Sku == transfer.Sku, token);
        stock.Receive(transfer.Quantity); transfer.Status = "received"; transfer.ReceivedAt = clock.UtcNow;
        await db.SaveChangesAsync(token); await tx.CommitAsync(token);
        return Ok(transfer);
    }

    private bool IsAuthorized()
    {
        var expected = configuration["Strapi:IntegrationSecret"] ?? string.Empty;
        var supplied = Request.Headers["X-Integration-Secret"].ToString();
        if (expected.Length < 32 || string.IsNullOrEmpty(supplied)) return false;
        var left = Encoding.UTF8.GetBytes(expected);
        var right = Encoding.UTF8.GetBytes(supplied);
        return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
    }
}

public sealed record CreateLocationRequest(string Name, bool IsWarehouse = false);
public sealed record InitialProductStock(string Sku, int? Stock);
public sealed record ImportCentralStockRequest(IReadOnlyList<InitialProductStock> Products);
public sealed record ReceiveStockRequest(Guid OperationId);
public sealed record AdjustStockRequest(Guid OperationId, string Sku, int Quantity, string Reason, Guid? SourceLocationId = null);
public sealed record UpdateLocationRequest(Guid Version, string Name, bool IsActive, bool PickupEnabled,
    string? Country, string? City, string? Address, string? Phone, string? PickupInstructions, string? PickupHours = null);
