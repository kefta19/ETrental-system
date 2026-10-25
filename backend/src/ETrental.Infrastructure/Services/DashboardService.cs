using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Dashboard;
using ETrental.Application.Interfaces;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;
    private readonly IAgencyAccessService _agencyAccess;

    public DashboardService(IApplicationDbContext context, IAgencyAccessService agencyAccess)
    {
        _context = context;
        _agencyAccess = agencyAccess;
    }

    public async Task<Result<RenterDashboardDto>> GetRenterDashboardAsync(string userId)
    {
        var now = DateTime.UtcNow;

        var subscription = await _context.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.StartDateUtc)
            .FirstOrDefaultAsync();

        var dashboard = new RenterDashboardDto
        {
            FavoriteCount = await _context.Favorites.CountAsync(f => f.UserId == userId),
            SavedSearchCount = await _context.SavedSearches.CountAsync(s => s.UserId == userId),
            SentInquiryCount = await _context.PropertyInquiries.CountAsync(i => i.RenterId == userId),
            UnreadInquiryCount = await _context.PropertyInquiries.CountAsync(i => i.RenterId == userId && !i.IsReadByRenter),
            AppointmentCount = await _context.ViewingAppointments.CountAsync(a => a.RenterId == userId),
            UpcomingAppointmentCount = await _context.ViewingAppointments.CountAsync(a => a.RenterId == userId
                && a.Status == AppointmentStatus.Confirmed && a.RequestedDateTimeUtc >= now),
            ApplicationCount = await _context.RentalApplications.CountAsync(a => a.ApplicantId == userId),
            ActiveApplicationCount = await _context.RentalApplications.CountAsync(a => a.ApplicantId == userId
                && (a.Status == ApplicationStatus.Submitted || a.Status == ApplicationStatus.UnderReview)),
            UnreadNotificationCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead),
            SubscriptionTier = subscription?.Plan.Name ?? "Free",
            RecommendedPropertyCount = await _context.Properties.CountAsync(p => p.Status == PropertyStatus.Published)
        };

        return Result<RenterDashboardDto>.Success(dashboard);
    }

    public async Task<Result<LandlordDashboardDto>> GetLandlordDashboardAsync(string userId)
    {
        var agencyContext = await _agencyAccess.GetContextAsync(userId);

        var query = _context.Properties.Where(p => p.LandlordId == userId);

        // Agency managers also see the whole agency portfolio.
        if (agencyContext != null)
        {
            var agencyId = agencyContext.AgencyId;
            query = _context.Properties.Where(p => p.LandlordId == userId || (p.AgencyId != null && p.AgencyId == agencyId));
        }

        var statuses = await query.Select(p => p.Status).ToListAsync();
        var rents = await query.Select(p => p.RentAmountETB).ToListAsync();
        var propertyIds = await query.Select(p => p.Id).ToListAsync();

        var now = DateTime.UtcNow;

        var dashboard = new LandlordDashboardDto
        {
            TotalProperties = statuses.Count,
            PublishedProperties = statuses.Count(s => s == PropertyStatus.Published),
            DraftProperties = statuses.Count(s => s == PropertyStatus.Draft),
            PendingReviewProperties = statuses.Count(s => s == PropertyStatus.PendingReview),
            RejectedProperties = statuses.Count(s => s == PropertyStatus.Rejected),
            RentedProperties = statuses.Count(s => s == PropertyStatus.Rented),
            UnavailableProperties = statuses.Count(s => s == PropertyStatus.Unavailable),
            TotalInquiries = await _context.PropertyInquiries.CountAsync(i => propertyIds.Contains(i.PropertyId)),
            UnreadInquiries = await _context.PropertyInquiries.CountAsync(i => propertyIds.Contains(i.PropertyId) && !i.IsReadByLandlord),
            TotalAppointments = await _context.ViewingAppointments.CountAsync(a => propertyIds.Contains(a.PropertyId)),
            PendingAppointments = await _context.ViewingAppointments.CountAsync(a => propertyIds.Contains(a.PropertyId)
                && (a.Status == AppointmentStatus.Requested || a.Status == AppointmentStatus.Rescheduled)),
            TotalApplications = await _context.RentalApplications.CountAsync(a => propertyIds.Contains(a.PropertyId)),
            PendingApplications = await _context.RentalApplications.CountAsync(a => propertyIds.Contains(a.PropertyId)
                && (a.Status == ApplicationStatus.Submitted || a.Status == ApplicationStatus.UnderReview)),
            ActiveAgreements = await _context.RentalAgreements.CountAsync(a => propertyIds.Contains(a.PropertyId)
                && a.Status == RentalAgreementStatus.Active),
            MonthlyPortfolioValueETB = rents.Where(r => r > 0).Sum(),
            UnreadNotificationCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead)
        };

        return Result<LandlordDashboardDto>.Success(dashboard);
    }

    public async Task<Result<AgencyDashboardDto>> GetAgencyDashboardAsync(string userId)
    {
        var context = await _agencyAccess.GetContextAsync(userId);
        if (context == null)
        {
            return Result<AgencyDashboardDto>.Failure("You are not a member of any agency.");
        }

        var agencyId = context.AgencyId;
        var now = DateTime.UtcNow;

        var agency = await _context.Agencies.AsNoTracking().FirstOrDefaultAsync(a => a.Id == agencyId);
        var statuses = await _context.Properties.Where(p => p.AgencyId == agencyId).Select(p => p.Status).ToListAsync();

        var dashboard = new AgencyDashboardDto
        {
            AgencyName = agency?.Name ?? string.Empty,
            AgencyStatus = agency?.Status.ToString() ?? "Pending",
            TotalProperties = statuses.Count,
            PublishedProperties = statuses.Count(s => s == PropertyStatus.Published),
            PendingReviewProperties = statuses.Count(s => s == PropertyStatus.PendingReview),
            RentedProperties = statuses.Count(s => s == PropertyStatus.Rented),
            UnreadInquiries = await _context.PropertyInquiries.CountAsync(i => i.Property.AgencyId == agencyId && !i.IsReadByLandlord),
            PendingApplications = await _context.RentalApplications.CountAsync(a => a.Property.AgencyId == agencyId
                && (a.Status == ApplicationStatus.Submitted || a.Status == ApplicationStatus.UnderReview)),
            UpcomingAppointments = await _context.ViewingAppointments.CountAsync(v => v.Property.AgencyId == agencyId
                && v.Status == AppointmentStatus.Confirmed && v.RequestedDateTimeUtc >= now),
            ActiveStaff = await _context.AgencyMemberships.CountAsync(m => m.AgencyId == agencyId && m.IsActive),
            UnreadNotificationCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead)
        };

        return Result<AgencyDashboardDto>.Success(dashboard);
    }
}
