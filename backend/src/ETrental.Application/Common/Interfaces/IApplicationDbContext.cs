using Microsoft.EntityFrameworkCore;
using ETrental.Domain.Entities;

namespace ETrental.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ApplicationUser> Users { get; }
    DbSet<RenterProfile> RenterProfiles { get; }
    DbSet<LandlordProfile> LandlordProfiles { get; }
    DbSet<Agency> Agencies { get; }
    DbSet<AgencyMembership> AgencyMemberships { get; }
    DbSet<Property> Properties { get; }
    DbSet<PropertyImage> PropertyImages { get; }
    DbSet<PropertyInquiry> PropertyInquiries { get; }
    DbSet<ViewingAppointment> ViewingAppointments { get; }
    DbSet<RentalApplication> RentalApplications { get; }
    DbSet<Favorite> Favorites { get; }
    DbSet<SavedSearch> SavedSearches { get; }
    DbSet<SupportTicket> SupportTickets { get; }
    DbSet<SupportTicketMessage> SupportTicketMessages { get; }
    DbSet<UserReport> UserReports { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<Subscription> Subscriptions { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<PlatformSetting> PlatformSettings { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<ListingReview> ListingReviews { get; }
    DbSet<AgencyPropertyAssignment> AgencyPropertyAssignments { get; }
    DbSet<RentalAgreement> RentalAgreements { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
