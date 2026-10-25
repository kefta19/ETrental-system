using Microsoft.AspNetCore.Identity;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string? ProfilePictureUrl { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAtUtc { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTimeUtc { get; set; }

    // Account restriction (admin moderation of user accounts)
    public bool IsRestricted { get; set; } = false;
    public string? RestrictionReason { get; set; }
    public DateTime? RestrictedAtUtc { get; set; }
    public string? RestrictedBy { get; set; }
    public DateTime? RestrictionLiftedAtUtc { get; set; }

    // Navigation properties
    public RenterProfile? RenterProfile { get; set; }
    public LandlordProfile? LandlordProfile { get; set; }
    public AgencyMembership? AgencyMembership { get; set; }
    public ICollection<Property> OwnedProperties { get; set; } = new List<Property>();
    public ICollection<PropertyInquiry> SentInquiries { get; set; } = new List<PropertyInquiry>();
    public ICollection<ViewingAppointment> Appointments { get; set; } = new List<ViewingAppointment>();
    public ICollection<RentalApplication> RentalApplications { get; set; } = new List<RentalApplication>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<SavedSearch> SavedSearches { get; set; } = new List<SavedSearch>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<SupportTicket> SupportTickets { get; set; } = new List<SupportTicket>();
    public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
    public ICollection<RentalAgreement> RentalAgreements { get; set; } = new List<RentalAgreement>();
}
