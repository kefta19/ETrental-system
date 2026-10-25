using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Interactions;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InquiriesController : ControllerBase
{
    private readonly IInteractionService _interactionService;

    public InquiriesController(IInteractionService interactionService)
    {
        _interactionService = interactionService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateInquiry([FromBody] CreateInquiryDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.CreateInquiryAsync(dto, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("sent")]
    public async Task<IActionResult> GetInquiriesSent(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.GetInquiriesSentAsync(userId, ct);
        return Ok(result);
    }

    [Authorize(Roles = "Landlord,Agency,Admin")]
    [HttpGet("received")]
    public async Task<IActionResult> GetInquiriesReceived(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.GetInquiriesReceivedAsync(userId, ct);
        return Ok(result);
    }

    [Authorize(Roles = "Landlord,Agency,Admin")]
    [HttpPost("{id:guid}/reply")]
    public async Task<IActionResult> ReplyInquiry(Guid id, [FromBody] ReplyInquiryDto dto, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.ReplyInquiryAsync(id, dto, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _interactionService.MarkInquiryAsReadAsync(id, userId, ct);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }
}
