using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class UserReport : AuditableEntity
{
    public string ReporterId { get; set; } = string.Empty;
    public ApplicationUser Reporter { get; set; } = null!;
    public Guid? ReportedPropertyId { get; set; }
    public Property? ReportedProperty { get; set; }
    public string? ReportedUserId { get; set; }
    public ApplicationUser? ReportedUser { get; set; }
    public ReportCategory Category { get; set; } = ReportCategory.Other;
    public string Reason { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ReportStatus Status { get; set; } = ReportStatus.Open;
    public string? AssignedToId { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? ActionTaken { get; set; }
}
