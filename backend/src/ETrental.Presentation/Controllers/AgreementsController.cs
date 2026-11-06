using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgreementsController : ControllerBase
{
    private readonly IInteractionService _interactionService;

    public AgreementsController(IInteractionService interactionService)
    {
        _interactionService = interactionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyAgreements(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.GetAgreementsAsync(userId, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAgreementById(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.GetAgreementByIdAsync(id, userId, ct);
        if (!result.Succeeded) return NotFound(result);

        return Ok(result);
    }

    public record TerminateAgreementRequest(string? Notes);

    [HttpPut("{id:guid}/terminate")]
    public async Task<IActionResult> TerminateAgreement(Guid id, [FromBody] TerminateAgreementRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.TerminateAgreementAsync(id, userId, request?.Notes, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }
}
