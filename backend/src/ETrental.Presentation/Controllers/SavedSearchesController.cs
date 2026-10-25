using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Interactions;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/saved-searches")]
[Authorize]
public class SavedSearchesController : ControllerBase
{
    private readonly IInteractionService _interactionService;

    public SavedSearchesController(IInteractionService interactionService)
    {
        _interactionService = interactionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSavedSearches(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.GetSavedSearchesAsync(userId, ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSavedSearch([FromBody] CreateSavedSearchDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.CreateSavedSearchAsync(dto, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSavedSearch(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.DeleteSavedSearchAsync(id, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }
}
