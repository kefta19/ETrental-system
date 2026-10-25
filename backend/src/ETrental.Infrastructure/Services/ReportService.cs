using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Properties;
using ETrental.Application.DTOs.Reports;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public ReportService(
        IApplicationDbContext context,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _context = context;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    private static UserReportDto MapReport(UserReport report, string reporterName, string? propertyTitle, string? reportedUserName, string? assignedToName)
    {
        return new UserReportDto
        {
            Id = report.Id,
            ReporterId = report.ReporterId,
            ReporterName = reporterName,
            ReportedPropertyId = report.ReportedPropertyId,
            ReportedPropertyTitle = propertyTitle,
            ReportedUserId = report.ReportedUserId,
            ReportedUserName = reportedUserName,
            Category = report.Category,
            Reason = report.Reason,
            Description = report.Description,
            Status = report.Status,
            ResolutionNotes = report.ResolutionNotes,
            ActionTaken = report.ActionTaken,
            AssignedToId = report.AssignedToId,
            AssignedToName = assignedToName,
            CreatedAtUtc = report.CreatedAtUtc,
            ResolvedAtUtc = report.ResolvedAtUtc
        };
    }

    public async Task<Result<UserReportDto>> CreateReportAsync(string reporterId, CreateUserReportDto dto)
    {
        if (!dto.ReportedPropertyId.HasValue && string.IsNullOrWhiteSpace(dto.ReportedUserId))
        {
            return Result<UserReportDto>.Failure("Select a listing or a user to report.");
        }

        if (dto.ReportedUserId == reporterId)
        {
            return Result<UserReportDto>.Failure("You cannot report your own account.");
        }

        string propertyTitle = string.Empty;

        if (dto.ReportedPropertyId.HasValue)
        {
            var property = await _context.Properties
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == dto.ReportedPropertyId.Value);

            if (property == null)
            {
                return Result<UserReportDto>.Failure("The listing you are reporting could not be found.");
            }

            if (property.LandlordId == reporterId)
            {
                return Result<UserReportDto>.Failure("You cannot report your own listing.");
            }

            propertyTitle = property.Title;

            // Avoid duplicate open reports for the same listing by the same user.
            var duplicate = await _context.UserReports.AnyAsync(r =>
                r.ReporterId == reporterId &&
                r.ReportedPropertyId == dto.ReportedPropertyId.Value &&
                (r.Status == ReportStatus.Open || r.Status == ReportStatus.UnderReview));

            if (duplicate)
            {
                return Result<UserReportDto>.Failure("You have already reported this listing. Our team is reviewing it.");
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.ReportedUserId))
        {
            var exists = await _context.Users.AnyAsync(u => u.Id == dto.ReportedUserId);
            if (!exists)
            {
                return Result<UserReportDto>.Failure("The account you are reporting could not be found.");
            }
        }

        var report = new UserReport
        {
            ReporterId = reporterId,
            ReportedPropertyId = dto.ReportedPropertyId,
            ReportedUserId = dto.ReportedUserId,
            Category = dto.Category,
            Reason = dto.Reason.Trim(),
            Description = dto.Description.Trim(),
            Status = ReportStatus.Open
        };

        _context.UserReports.Add(report);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(reporterId, "ContentReported", "UserReport", report.Id.ToString(), dto.Reason);

        var admins = await _context.Users.Where(u => u.IsActive).ToListAsync();
        foreach (var admin in admins)
        {
            await _notificationService.CreateAsync(admin.Id, NotificationType.System,
                "New content report received",
                $"A user reported {dto.Category} on ETrental. Report reference: {report.Id}.",
                "/admin/reports");
        }

        var reporter = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == reporterId);
        var reportedUser = dto.ReportedUserId == null
            ? null
            : await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == dto.ReportedUserId);

        return Result<UserReportDto>.Success(MapReport(report, reporter?.FullName ?? string.Empty, propertyTitle, reportedUser?.FullName, null));
    }

    public async Task<Result<List<UserReportDto>>> GetMyReportsAsync(string reporterId)
    {
        var reports = await _context.UserReports
            .AsNoTracking()
            .Include(r => r.ReportedProperty)
            .Include(r => r.ReportedUser)
            .Where(r => r.ReporterId == reporterId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync();

        var result = reports
            .Select(r => MapReport(r, string.Empty, r.ReportedProperty?.Title, r.ReportedUser?.FullName, null))
            .ToList();

        return Result<List<UserReportDto>>.Success(result);
    }

    public async Task<Result<PaginatedResult<UserReportDto>>> GetAllReportsAsync(ReportStatus? status, ReportCategory? category, int page, int pageSize)
    {
        IQueryable<UserReport> query = _context.UserReports
            .AsNoTracking()
            .Include(r => r.Reporter)
            .Include(r => r.ReportedProperty)
            .Include(r => r.ReportedUser);

        if (status.HasValue) query = query.Where(r => r.Status == status.Value);
        if (category.HasValue) query = query.Where(r => r.Category == category.Value);

        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 25 : pageSize;

        var totalCount = await query.CountAsync();

        var reports = await query
            .OrderByDescending(r => r.Status == ReportStatus.ActionRequired ? 2 : r.Status == ReportStatus.Open ? 1 : 0)
            .ThenByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var assigneeNames = await _context.Users
            .Where(u => reports.Select(r => r.AssignedToId).Where(x => x != null).Contains(u.Id))
            .Select(u => new { u.Id, u.FullName })
            .ToDictionaryAsync(x => x.Id, x => x.FullName);

        var items = reports.Select(r => MapReport(
            r,
            r.Reporter?.FullName ?? string.Empty,
            r.ReportedProperty?.Title,
            r.ReportedUser?.FullName,
            r.AssignedToId != null && assigneeNames.TryGetValue(r.AssignedToId, out var name) ? name : null)).ToList();

        return Result<PaginatedResult<UserReportDto>>.Success(new PaginatedResult<UserReportDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<Result<UserReportDto>> UpdateReportAsync(Guid reportId, UpdateUserReportDto dto, string staffId)
    {
        var report = await _context.UserReports
            .Include(r => r.Reporter)
            .Include(r => r.ReportedProperty)
            .Include(r => r.ReportedUser)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
        {
            return Result<UserReportDto>.Failure("Report not found.");
        }

        var previousStatus = report.Status;

        if (dto.Status.HasValue)
        {
            report.Status = dto.Status.Value;
            report.ResolvedAtUtc = dto.Status.Value is ReportStatus.Resolved or ReportStatus.Dismissed
                ? DateTime.UtcNow
                : null;
        }

        if (dto.ResolutionNotes != null) report.ResolutionNotes = dto.ResolutionNotes;
        if (dto.ActionTaken != null) report.ActionTaken = dto.ActionTaken;
        if (dto.AssignedToId != null) report.AssignedToId = dto.AssignedToId;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(staffId, "ReportUpdated", "UserReport", report.Id.ToString(),
            dto.ActionTaken, previousStatus.ToString(), report.Status.ToString());

        await _notificationService.CreateAsync(report.ReporterId, NotificationType.System,
            $"Report {report.Id} updated",
            $"Your report is now {report.Status}.",
            "/support");

        return Result<UserReportDto>.Success(MapReport(
            report,
            report.Reporter?.FullName ?? string.Empty,
            report.ReportedProperty?.Title,
            report.ReportedUser?.FullName,
            null));
    }

    public async Task<Result<ReportDashboardDto>> GetDashboardAsync()
    {
        var dashboard = new ReportDashboardDto
        {
            OpenReports = await _context.UserReports.CountAsync(r => r.Status == ReportStatus.Open),
            UnderReviewReports = await _context.UserReports.CountAsync(r => r.Status == ReportStatus.UnderReview),
            ActionRequiredReports = await _context.UserReports.CountAsync(r => r.Status == ReportStatus.ActionRequired),
            ResolvedReports = await _context.UserReports.CountAsync(r => r.Status == ReportStatus.Resolved),
            DismissedReports = await _context.UserReports.CountAsync(r => r.Status == ReportStatus.Dismissed),
            FraudReports = await _context.UserReports.CountAsync(r => r.Category == ReportCategory.Fraud || r.Category == ReportCategory.FakeListing)
        };

        return Result<ReportDashboardDto>.Success(dashboard);
    }
}
