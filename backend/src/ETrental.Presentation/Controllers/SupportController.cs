using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Support;
using ETrental.Application.Interfaces;
using ETrental.Domain.Enums;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/support")]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly ISupportService _supportService;

    public SupportController(ISupportService supportService)
    {
        _supportService = supportService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsStaff => User.IsInRole("Support") || User.IsInRole("Admin");

    [HttpPost("tickets")]
    public async Task<IActionResult> CreateTicket([FromBody] CreateSupportTicketDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _supportService.CreateTicketAsync(userId, dto);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("tickets/my")]
    public async Task<IActionResult> GetMyTickets()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _supportService.GetMyTicketsAsync(userId);
        return Ok(result);
    }

    [Authorize(Roles = "Support,Admin")]
    [HttpGet("tickets")]
    public async Task<IActionResult> GetAllTickets(
        [FromQuery] TicketStatus? status,
        [FromQuery] TicketCategory? category,
        [FromQuery] TicketPriority? priority,
        [FromQuery] string? assignedToId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var result = await _supportService.GetAllTicketsAsync(status, category, priority, assignedToId, page, pageSize);
        return Ok(result);
    }

    [Authorize(Roles = "Support,Admin")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _supportService.GetDashboardAsync(userId);
        return Ok(result);
    }

    [HttpGet("tickets/{ticketId:guid}")]
    public async Task<IActionResult> GetTicket(Guid ticketId)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _supportService.GetTicketAsync(ticketId, userId, IsStaff);
        if (!result.Succeeded) return NotFound(result);

        return Ok(result);
    }

    [HttpGet("tickets/{ticketId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid ticketId)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _supportService.GetTicketMessagesAsync(ticketId, userId, IsStaff);
        if (!result.Succeeded) return NotFound(result);

        return Ok(result);
    }

    [HttpPost("tickets/{ticketId:guid}/messages")]
    public async Task<IActionResult> Reply(Guid ticketId, [FromBody] ReplySupportTicketDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _supportService.ReplyToTicketAsync(ticketId, userId, IsStaff, dto);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [Authorize(Roles = "Support,Admin")]
    [HttpPut("tickets/{ticketId:guid}")]
    public async Task<IActionResult> UpdateTicket(Guid ticketId, [FromBody] UpdateSupportTicketDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _supportService.UpdateTicketAsync(ticketId, dto, userId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }
}
