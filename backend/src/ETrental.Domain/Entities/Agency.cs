using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class Agency : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string TaxIdentificationNumber { get; set; } = string.Empty; // Ethiopian 10-digit TIN
    public string BusinessLicenseNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string SubCity { get; set; } = string.Empty;
    public string? OfficeAddress { get; set; }
    public string OfficialPhone { get; set; } = string.Empty;
    public string OfficialEmail { get; set; } = string.Empty;
    public AgencyStatus Status { get; set; } = AgencyStatus.Pending;
    public string? VerificationNotes { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public string? VerifiedBy { get; set; }
    public string? RejectionReason { get; set; }
    public string? VerificationDocumentUrl { get; set; }
    public DateTime SubmittedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<AgencyMembership> Members { get; set; } = new List<AgencyMembership>();
    public ICollection<Property> Properties { get; set; } = new List<Property>();
    public ICollection<AgencyPropertyAssignment> PropertyAssignments { get; set; } = new List<AgencyPropertyAssignment>();
}
