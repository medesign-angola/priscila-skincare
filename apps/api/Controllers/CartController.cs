using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Orders;

namespace PriscilaSkincare.Api.Controllers;

[ApiController, Authorize, Route("api/v1/cart")]
public sealed class CartController(CartService cart) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CartResult>> Get([FromQuery] string locale = "pt", CancellationToken token = default) => Ok(await cart.GetAsync(CustomerId(), locale, token));

    [HttpPost("items")]
    public async Task<ActionResult<CartResult>> Add(AddCartItemRequest request, [FromQuery] string locale = "pt", CancellationToken token = default) =>
        Ok(await cart.AddAsync(CustomerId(), new(request.ProductSku, request.VariantId, request.VariantLabel, request.Quantity), locale, token));

    [HttpPost("merge")]
    public async Task<ActionResult<CartResult>> Merge(MergeCartRequest request, [FromQuery] string locale = "pt", CancellationToken token = default) =>
        Ok(await cart.MergeAsync(CustomerId(), request.Items.Select(x => new MergeCartItem(x.ProductSku, x.VariantId, x.VariantLabel, x.Quantity)).ToArray(), locale, token));

    [HttpPut("items/{itemId:guid}")]
    public async Task<ActionResult<CartResult>> Quantity(Guid itemId, ChangeCartQuantityRequest request, [FromQuery] string locale = "pt", CancellationToken token = default) =>
        Ok(await cart.SetQuantityAsync(CustomerId(), itemId, request.Quantity, locale, token));

    [HttpDelete("items/{itemId:guid}")]
    public async Task<ActionResult<CartResult>> Remove(Guid itemId, [FromQuery] string locale = "pt", CancellationToken token = default) =>
        Ok(await cart.RemoveAsync(CustomerId(), itemId, locale, token));

    [HttpDelete]
    public async Task<IActionResult> Clear(CancellationToken token) { await cart.ClearAsync(CustomerId(), token); return NoContent(); }

    private Guid CustomerId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id)
        ? id : throw new AuthenticationException("invalid_identity", "A sessão não contém um cliente válido.");
}

public sealed record AddCartItemRequest(string ProductSku, string? VariantId, string? VariantLabel, int Quantity = 1);
public sealed record MergeCartRequest(IReadOnlyList<AddCartItemRequest> Items);
public sealed record ChangeCartQuantityRequest(int Quantity);
