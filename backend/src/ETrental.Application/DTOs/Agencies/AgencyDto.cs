using System.ComponentModel.DataAnnotations;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Agencies;

public class AgencyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string TaxIdentificationNumber { get; set; } = string.Empty;
    public string BusinessLicenseNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string SubCity { get; set; } = string.Empty;
    public string? OfficeAddress { get; set; }
    public string OfficialPhone { get; set; } = string.Empty;
    public string OfficialEmail { get; set; } = string.Empty;
    public AgencyStatus Status { get; set; }
    public string? VerificationNotes { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public DateTime SubmittedAtUtc { get; set; }
    public int MemberCount { get; set; }
    public int PropertyCount { get; set; }
}

public class AgencyMemberDto
{
    public Guid MembershipId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public AgencyStaffRole Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime JoinedAtUtc { get; set; }
    public int AssignedPropertyCount { get; set; }
    public string? TemporaryPassword { get; set; }
}

public class UpdateAgencyDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string City { get; set; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string SubCity { get; set; } = string.Empty;

    [StringLength(300)]
    public string? OfficeAddress { get; set; }

    [Required]
    [Phone]
    public string OfficialPhone { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string OfficialEmail { get; set; } = string.Empty;

    [StringLength(50)]
    public string? LogoUrl { get; set; }
}

public class InviteStaffDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string FullName { get; set; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; set; }

    [Required]
    public AgencyStaffRole Role { get; set; } = AgencyStaffRole.Agent;
}

public class UpdateStaffRoleDto
{
    [Required]
    public AgencyStaffRole Role { get; set; }
}

public class AssignStaffToPropertyDto
{
    [Required]
    public Guid PropertyId { get; set; }
}

public class AgencyReportDto
{
    public int TotalProperties { get; set; }
    public int ActiveProperties { get; set; }
    public int PublishedProperties { get; set; }
    public int PendingReviewProperties { get; set; }
    public int RejectedProperties { get; set; }
    public int RentedProperties { get; set; }
    public int UnavailableProperties { get; set; }
    public int TotalInquiries { get; set; }
    public int UnreadInquiries { get; set; }
    public int TotalApplications { get; set; }
    public int PendingApplications { get; set; }
    public int TotalAppointments { get; set; }
    public int UpcomingAppointments { get; set; }
    public int ActiveStaff { get; set; }
    public string SubscriptionTier { get; set; } = "Free";
}
