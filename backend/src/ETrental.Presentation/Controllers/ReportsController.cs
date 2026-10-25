using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Reports;
using ETrental.Application.Interfaces;
using ETrental.Domain.Enums;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsStaff => User.IsInRole("Admin") || User.IsInRole("Support");

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateReport([FromBody] CreateUserReportDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _reportService.CreateReportAsync(userId, dto);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyReports()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _reportService.GetMyReportsAsync(userId);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Support")]
    [HttpGet]
    public async Task<IActionResult> GetAllReports(
        [FromQuery] ReportStatus? status,
        [FromQuery] ReportCategory? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var result = await _reportService.GetAllReportsAsync(status, category, page, pageSize);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Support")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _reportService.GetDashboardAsync();
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Support")]
    [HttpPut("{reportId:guid}")]
    public async Task<IActionResult> UpdateReport(Guid reportId, [FromBody] UpdateUserReportDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _reportService.UpdateReportAsync(reportId, dto, userId);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }
}
