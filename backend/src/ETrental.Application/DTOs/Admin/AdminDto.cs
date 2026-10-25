using System.ComponentModel.DataAnnotations;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Admin;

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public IList<string> Roles { get; set; } = new List<string>();
    public bool IsActive { get; set; }
    public bool IsRestricted { get; set; }
    public string? RestrictionReason { get; set; }
    public DateTime? RestrictedAtUtc { get; set; }
    public bool EmailConfirmed { get; set; }
    public bool PhoneNumberConfirmed { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    public string SubscriptionTier { get; set; } = "Free";
    public string? AgencyName { get; set; }
    public Guid? AgencyId { get; set; }
    public int PropertyCount { get; set; }
}

public class RestrictUserDto
{
    [Required]
    public bool IsRestricted { get; set; }

    [StringLength(500)]
    public string? Reason { get; set; }
}

public class AgencyVerificationDto
{
    [Required]
    public bool Approved { get; set; }

    [StringLength(100)]
    public string? RejectionReason { get; set; }

    [StringLength(1000)]
    public string? VerificationNotes { get; set; }
}

public class PlatformSettingDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public DateTime UpdatedAtUtc { get; set; }
    public string? UpdatedBy { get; set; }
}

public class UpdatePlatformSettingDto
{
    [Required]
    [StringLength(2000)]
    public string Value { get; set; } = string.Empty;
}

public class SubscriptionPlanAdminDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public SubscriptionTier Tier { get; set; }
    public decimal PriceETB { get; set; }
    public int BillingPeriodDays { get; set; }
    public int MaxActiveFavorites { get; set; }
    public int MaxWeeklyInquiries { get; set; }
    public bool CanViewDirectPhone { get; set; }
    public bool HasInstantAlerts { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateSubscriptionPlanDto
{
    [Range(0, 5000000)]
    public decimal PriceETB { get; set; }

    [Range(1, 365)]
    public int BillingPeriodDays { get; set; }

    [Range(0, 100000)]
    public int MaxActiveFavorites { get; set; }

    [Range(0, 100000)]
    public int MaxWeeklyInquiries { get; set; }

    public bool CanViewDirectPhone { get; set; }
    public bool HasInstantAlerts { get; set; }
    public bool IsActive { get; set; }
}

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int TotalRenters { get; set; }
    public int TotalLandlords { get; set; }
    public int TotalAgencies { get; set; }
    public int TotalSupportAgents { get; set; }
    public int ActiveUsers { get; set; }
    public int RestrictedUsers { get; set; }
    public int TotalProperties { get; set; }
    public int PublishedProperties { get; set; }
    public int PendingReviewProperties { get; set; }
    public int RejectedProperties { get; set; }
    public int RentedProperties { get; set; }
    public int TotalInquiries { get; set; }
    public int TotalAppointments { get; set; }
    public int TotalApplications { get; set; }
    public int OpenReports { get; set; }
    public int OpenTickets { get; set; }
    public int PendingAgencyVerifications { get; set; }
    public int ActivePremiumSubscriptions { get; set; }
    public decimal TotalSubscriptionRevenueETB { get; set; }
    public int VerifiedAgencies { get; set; }
}
