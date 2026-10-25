using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Moderation;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class ModerationController : ControllerBase
{
    private readonly IModerationService _moderationService;

    public ModerationController(IModerationService moderationService)
    {
        _moderationService = moderationService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingListings([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
    {
        var result = await _moderationService.GetPendingListingsAsync(page, pageSize);
        return Ok(result);
    }

    [HttpPost("properties/{id:guid}/decision")]
    public async Task<IActionResult> ModerateProperty(Guid id, [FromBody] ModerationDecisionDto decision)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        var result = await _moderationService.ModerateListingAsync(id, decision, adminId);
        if (!result.Succeeded)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("properties/{id:guid}/unpublish")]
    public async Task<IActionResult> UnpublishProperty(Guid id, [FromBody] UnpublishListingDto request)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        var result = await _moderationService.UnpublishListingAsync(id, request.Reason, adminId);
        if (!result.Succeeded)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}

public class UnpublishListingDto
{
    [Required]
    [StringLength(500, MinimumLength = 5)]
    public string Reason { get; set; } = string.Empty;
}
