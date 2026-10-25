using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Interactions;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IInteractionService _interactionService;

    public AppointmentsController(IInteractionService interactionService)
    {
        _interactionService = interactionService;
    }

    [HttpPost]
    public async Task<IActionResult> RequestAppointment([FromBody] CreateAppointmentDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.RequestAppointmentAsync(dto, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyAppointments(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var isLandlord = User.IsInRole("Landlord") || User.IsInRole("Agency") || User.IsInRole("Admin");
        var result = await _interactionService.GetMyAppointmentsAsync(userId, isLandlord, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateAppointmentStatus(Guid id, [FromBody] UpdateAppointmentStatusDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.UpdateAppointmentStatusAsync(id, dto, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }
}
