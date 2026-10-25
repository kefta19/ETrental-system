using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Interactions;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IInteractionService _interactionService;

    public ApplicationsController(IInteractionService interactionService)
    {
        _interactionService = interactionService;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitApplication([FromBody] CreateApplicationDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.SubmitApplicationAsync(dto, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("sent")]
    public async Task<IActionResult> GetMyApplications(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.GetMyApplicationsAsync(userId, ct);
        return Ok(result);
    }

    [Authorize(Roles = "Landlord,Agency,Admin")]
    [HttpGet("received")]
    public async Task<IActionResult> GetReceivedApplications([FromQuery] Guid? propertyId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.GetReceivedApplicationsAsync(userId, propertyId, ct);
        return Ok(result);
    }

    [Authorize(Roles = "Landlord,Agency,Admin")]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateApplicationStatus(Guid id, [FromBody] UpdateApplicationStatusDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.UpdateApplicationStatusAsync(id, dto, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }
}
