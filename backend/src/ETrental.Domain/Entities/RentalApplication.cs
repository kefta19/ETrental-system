using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class RentalApplication : AuditableEntity
{
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;
    public string ApplicantId { get; set; } = string.Empty;
    public ApplicationUser Applicant { get; set; } = null!;
    public DateTime ProposedMoveInDate { get; set; }
    public int ProposedLeaseDurationMonths { get; set; } = 12;
    public int ProposedOccupantsCount { get; set; } = 1;
    public string EmploymentOrIncomeSummary { get; set; } = string.Empty;
    public string? AdditionalNotes { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public string? HostDecisionNotes { get; set; }
    public DateTime? DecidedAtUtc { get; set; }
}
