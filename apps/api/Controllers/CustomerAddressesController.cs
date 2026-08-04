using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Customers;

namespace PriscilaSkincare.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/customers/me/addresses")]
public sealed class CustomerAddressesController(CustomerAddressService addresses) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CustomerAddressResult>>> List(CancellationToken cancellationToken) =>
        Ok(await addresses.ListAsync(CustomerId(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<CustomerAddressResult>> Create(
        SaveAddressRequest request,
        CancellationToken cancellationToken)
    {
        var result = await addresses.CreateAsync(CustomerId(), request.ToCommand(), cancellationToken);
        return Created($"/api/v1/customers/me/addresses/{result.Id}", result);
    }

    [HttpPut("{addressId:guid}")]
    public async Task<ActionResult<CustomerAddressResult>> Update(
        Guid addressId,
        SaveAddressRequest request,
        CancellationToken cancellationToken) =>
        Ok(await addresses.UpdateAsync(CustomerId(), addressId, request.ToCommand(), cancellationToken));

    [HttpPut("{addressId:guid}/default")]
    public async Task<IActionResult> MakeDefault(Guid addressId, CancellationToken cancellationToken)
    {
        await addresses.MakeDefaultAsync(CustomerId(), addressId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{addressId:guid}")]
    public async Task<IActionResult> Delete(Guid addressId, CancellationToken cancellationToken)
    {
        await addresses.DeleteAsync(CustomerId(), addressId, cancellationToken);
        return NoContent();
    }

    private Guid CustomerId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out var customerId)
            ? customerId
            : throw new AuthenticationException("invalid_identity", "A sessão não contém um cliente válido.");
    }
}

public sealed record SaveAddressRequest(
    string Label,
    string Recipient,
    string Phone,
    string Country,
    string Province,
    string City,
    string Neighborhood,
    string Street,
    string? HouseNumber,
    string? Apartment,
    string? PostalCode,
    bool IsDefault = false)
{
    public SaveAddressCommand ToCommand() => new(
        Label, Recipient, Phone, Country, Province, City, Neighborhood,
        Street, HouseNumber, Apartment, PostalCode, IsDefault);
}
