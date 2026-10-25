using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Agencies;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/agency")]
[Authorize(Roles = "Agency,Admin")]
public class AgenciesController : ControllerBase
{
    private readonly IAgencyService _agencyService;

    public AgenciesController(IAgencyService agencyService)
    {
        _agencyService = agencyService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("profile")]
    public async Task<IActionResult> GetMyAgency()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.GetMyAgencyAsync(userId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("staff")]
    public async Task<IActionResult> GetStaff()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.GetStaffAsync(userId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateAgency([FromBody] UpdateAgencyDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.UpdateMyAgencyAsync(userId, dto);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("submit-verification")]
    public async Task<IActionResult> SubmitVerification()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.SubmitVerificationAsync(userId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("staff/invite")]
    public async Task<IActionResult> InviteStaff([FromBody] InviteStaffDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.InviteStaffAsync(userId, dto);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpPut("staff/{membershipId:guid}/role")]
    public async Task<IActionResult> UpdateStaffRole(Guid membershipId, [FromBody] UpdateStaffRoleDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.UpdateStaffRoleAsync(userId, membershipId, dto);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpDelete("staff/{membershipId:guid}")]
    public async Task<IActionResult> DeactivateStaff(Guid membershipId)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.DeactivateStaffAsync(userId, membershipId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("staff/{staffUserId}/properties/{propertyId:guid}/assign")]
    public async Task<IActionResult> AssignStaff(string staffUserId, Guid propertyId)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.AssignStaffToPropertyAsync(userId, staffUserId, propertyId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpDelete("staff/{staffUserId}/properties/{propertyId:guid}/assign")]
    public async Task<IActionResult> RemoveStaffAssignment(string staffUserId, Guid propertyId)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.RemoveStaffFromPropertyAsync(userId, staffUserId, propertyId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("report")]
    public async Task<IActionResult> GetReport()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _agencyService.GetAgencyReportAsync(userId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }
}
