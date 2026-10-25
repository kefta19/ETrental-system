using System.ComponentModel.DataAnnotations;
using ETrental.Application.DTOs.Properties;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Interactions;

public class RentalApplicationDto
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public PropertySummaryDto? Property { get; set; }
    public string ApplicantId { get; set; } = string.Empty;
    public string ApplicantName { get; set; } = string.Empty;
    public string? ApplicantEmail { get; set; }
    public string? ApplicantPhone { get; set; }
    public DateTime ProposedMoveInDate { get; set; }
    public int ProposedLeaseDurationMonths { get; set; }
    public int ProposedOccupantsCount { get; set; }
    public string EmploymentOrIncomeSummary { get; set; } = string.Empty;
    public string? AdditionalNotes { get; set; }
    public ApplicationStatus Status { get; set; }
    public string? HostDecisionNotes { get; set; }
    public DateTime? DecidedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateApplicationDto
{
    [Required]
    public Guid PropertyId { get; set; }

    [Required]
    public DateTime ProposedMoveInDate { get; set; }

    [Range(1, 60)]
    public int ProposedLeaseDurationMonths { get; set; } = 12;

    [Range(1, 20)]
    public int ProposedOccupantsCount { get; set; } = 1;

    [Required]
    [StringLength(1000, MinimumLength = 5)]
    public string EmploymentOrIncomeSummary { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? AdditionalNotes { get; set; }
}

public class UpdateApplicationStatusDto
{
    [Required]
    public ApplicationStatus Status { get; set; }

    [StringLength(500)]
    public string? HostDecisionNotes { get; set; }
}
