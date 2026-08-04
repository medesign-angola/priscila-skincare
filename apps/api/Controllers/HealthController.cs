using Microsoft.AspNetCore.Mvc;

namespace PriscilaSkincare.Api.Controllers;

[ApiController]
[Route("api/v1/health")]
public sealed class HealthController(IHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        status = "healthy",
        service = "priscila-skincare-api",
        environment = environment.EnvironmentName,
        timestamp = DateTimeOffset.UtcNow
    });
}
