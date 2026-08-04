using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Authentication;

namespace PriscilaSkincare.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/customers")]
public sealed class CustomersController(AuthenticationService authentication) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<CustomerResponse>> Me(CancellationToken cancellationToken)
    {
        var customer = await authentication.GetCustomerAsync(CustomerId(), cancellationToken);
        return customer is null ? NotFound() : Ok(CustomerResponse.From(customer));
    }

    [HttpPut("me")]
    public async Task<ActionResult<CustomerResponse>> Update(
        UpdateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var customer = await authentication.UpdateCustomerAsync(
            CustomerId(),
            request.Name,
            request.Phone,
            cancellationToken);
        return Ok(CustomerResponse.From(customer));
    }

    private Guid CustomerId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out var customerId)
            ? customerId
            : throw new AuthenticationException("invalid_identity", "A sessão não contém um cliente válido.");
    }
}

public sealed record UpdateCustomerRequest(string Name, string? Phone);
public sealed record CustomerResponse(Guid Id, string Email, string? Name, string? Phone, bool AcceptsMarketing)
{
    public static CustomerResponse From(AuthenticatedCustomer customer) =>
        new(customer.Id, customer.Email, customer.Name, customer.Phone, customer.AcceptsMarketing);
}
