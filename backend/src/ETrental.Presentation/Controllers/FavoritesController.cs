using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly IInteractionService _interactionService;

    public FavoritesController(IInteractionService interactionService)
    {
        _interactionService = interactionService;
    }

    [HttpPost("toggle/{propertyId:guid}")]
    public async Task<IActionResult> ToggleFavorite(Guid propertyId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.ToggleFavoriteAsync(propertyId, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetFavorites(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.GetFavoritesAsync(userId, ct);
        return Ok(result);
    }

    [HttpGet("check/{propertyId:guid}")]
    public async Task<IActionResult> CheckFavorite(Guid propertyId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.IsFavoritedAsync(propertyId, userId, ct);
        return Ok(result);
    }
}
