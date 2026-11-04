using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("renter")]
    public async Task<IActionResult> GetRenterDashboard()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _dashboardService.GetRenterDashboardAsync(userId);
        return Ok(result);
    }

    [HttpGet("landlord")]
    public async Task<IActionResult> GetLandlordDashboard()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _dashboardService.GetLandlordDashboardAsync(userId);
        return Ok(result);
    }

}
