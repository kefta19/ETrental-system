using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Admin;
using ETrental.Application.DTOs.Subscriptions;
using ETrental.Application.Interfaces;
using ETrental.Domain.Enums;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _adminService.GetDashboardAsync();
        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] bool? isRestricted,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _adminService.GetUsersAsync(search, role, isRestricted, page, pageSize);
        return Ok(result);
    }

    [HttpGet("users/{userId}")]
    public async Task<IActionResult> GetUser(string userId)
    {
        var result = await _adminService.GetUserAsync(userId);
        if (!result.Succeeded) return NotFound(result);

        return Ok(result);
    }

    [HttpPost("users/{userId}/restriction")]
    public async Task<IActionResult> SetRestriction(string userId, [FromBody] RestrictUserDto dto)
    {
        var adminId = CurrentUserId;
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        var result = await _adminService.SetUserRestrictionAsync(userId, dto, adminId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("users/{userId}/active")]
    public async Task<IActionResult> SetActive(string userId, [FromBody] RestrictUserDto dto)
    {
        var adminId = CurrentUserId;
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        var result = await _adminService.SetUserActiveAsync(userId, dto.IsRestricted, dto.Reason ?? "Policy action", adminId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("agencies")]
    public async Task<IActionResult> GetAgencies([FromQuery] AgencyStatus? status)
    {
        var result = await _adminService.GetAgenciesAsync(status);
        return Ok(result);
    }

    [HttpPost("agencies/{agencyId:guid}/verification")]
    public async Task<IActionResult> VerifyAgency(Guid agencyId, [FromBody] AgencyVerificationDto dto)
    {
        var adminId = CurrentUserId;
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        var result = await _adminService.VerifyAgencyAsync(agencyId, dto, adminId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var result = await _adminService.GetSettingsAsync();
        return Ok(result);
    }

    [HttpPut("settings/{key}")]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdatePlatformSettingDto dto)
    {
        var adminId = CurrentUserId;
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        var result = await _adminService.UpdateSettingAsync(key, dto, adminId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("subscription-plans")]
    public async Task<IActionResult> GetSubscriptionPlans()
    {
        var result = await _adminService.GetSubscriptionPlansAsync();
        return Ok(result);
    }

    [HttpPut("subscription-plans/{planId:guid}")]
    public async Task<IActionResult> UpdateSubscriptionPlan(Guid planId, [FromBody] UpdateSubscriptionPlanDto dto)
    {
        var adminId = CurrentUserId;
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        var result = await _adminService.UpdateSubscriptionPlanAsync(planId, dto, adminId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _adminService.GetPaymentTransactionsAsync(page, pageSize);
        return Ok(result);
    }

    [HttpPost("payments/verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
    {
        var adminId = CurrentUserId;
        if (string.IsNullOrEmpty(adminId)) return Unauthorized();

        var result = await _adminService.VerifyPaymentTransactionAsync(dto.TransactionId, dto.Approved, dto.Note, adminId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var result = await _adminService.GetAuditLogsAsync(page, pageSize);
        return Ok(result);
    }
}
