using System.ComponentModel.DataAnnotations;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Reports;

public class UserReportDto
{
    public Guid Id { get; set; }
    public string ReporterId { get; set; } = string.Empty;
    public string ReporterName { get; set; } = string.Empty;
    public Guid? ReportedPropertyId { get; set; }
    public string? ReportedPropertyTitle { get; set; }
    public string? ReportedUserId { get; set; }
    public string? ReportedUserName { get; set; }
    public ReportCategory Category { get; set; } = ReportCategory.Other;
    public string Reason { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ReportStatus Status { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? ActionTaken { get; set; }
    public string? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
}

public class CreateUserReportDto
{
    public Guid? ReportedPropertyId { get; set; }
    public string? ReportedUserId { get; set; }

    [Required]
    public ReportCategory Category { get; set; } = ReportCategory.Other;

    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Reason { get; set; } = string.Empty;

    [Required]
    [StringLength(2000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;
}

public class UpdateUserReportDto
{
    public ReportStatus? Status { get; set; }

    [StringLength(2000)]
    public string? ResolutionNotes { get; set; }

    [StringLength(1000)]
    public string? ActionTaken { get; set; }

    [StringLength(100)]
    public string? AssignedToId { get; set; }
}

public class ReportDashboardDto
{
    public int OpenReports { get; set; }
    public int UnderReviewReports { get; set; }
    public int ActionRequiredReports { get; set; }
    public int ResolvedReports { get; set; }
    public int DismissedReports { get; set; }
    public int FraudReports { get; set; }
}
