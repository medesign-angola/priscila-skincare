using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Orders;

namespace PriscilaSkincare.Api.Controllers;

[ApiController, Authorize, Route("api/v1/orders")]
public sealed class OrdersController(OrderService orders) : ControllerBase
{
    [HttpPost("preview")]
    public async Task<ActionResult<CheckoutPreviewResult>> Preview(CheckoutRequest request, CancellationToken token) =>
        Ok(await orders.PreviewAsync(CustomerId(), new(request.AddressId, request.Currency, request.Locale), token));

    [HttpPost]
    public async Task<ActionResult<OrderResult>> Create(CreateOrderRequest request, CancellationToken token)
    {
        var result = await orders.CreateAsync(CustomerId(), new(request.AddressId, request.Currency, request.Locale, request.IdempotencyKey), token);
        return Created($"/api/v1/orders/{result.Id}", result);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderResult>>> List(CancellationToken token) => Ok(await orders.ListAsync(CustomerId(), token));

    [HttpGet("{orderId:guid}")]
    public async Task<ActionResult<OrderResult>> Find(Guid orderId, CancellationToken token) => Ok(await orders.FindAsync(CustomerId(), orderId, token));

    private Guid CustomerId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id)
        ? id : throw new AuthenticationException("invalid_identity", "A sessão não contém um cliente válido.");
}

public sealed record CheckoutRequest(Guid AddressId, string Currency = "AOA", string Locale = "pt");
public sealed record CreateOrderRequest(Guid AddressId, string Currency, string Locale, string IdempotencyKey);
