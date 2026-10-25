using System.ComponentModel.DataAnnotations;

namespace ETrental.Application.DTOs.Dashboard;

public class RenterDashboardDto
{
    public int FavoriteCount { get; set; }
    public int SavedSearchCount { get; set; }
    public int SentInquiryCount { get; set; }
    public int UnreadInquiryCount { get; set; }
    public int AppointmentCount { get; set; }
    public int UpcomingAppointmentCount { get; set; }
    public int ApplicationCount { get; set; }
    public int ActiveApplicationCount { get; set; }
    public int UnreadNotificationCount { get; set; }
    public string SubscriptionTier { get; set; } = "Free";
    public int RecommendedPropertyCount { get; set; }
}

public class LandlordDashboardDto
{
    public int TotalProperties { get; set; }
    public int PublishedProperties { get; set; }
    public int DraftProperties { get; set; }
    public int PendingReviewProperties { get; set; }
    public int RejectedProperties { get; set; }
    public int RentedProperties { get; set; }
    public int UnavailableProperties { get; set; }
    public int UnreadInquiries { get; set; }
    public int TotalInquiries { get; set; }
    public int PendingAppointments { get; set; }
    public int TotalAppointments { get; set; }
    public int PendingApplications { get; set; }
    public int TotalApplications { get; set; }
    public int ActiveAgreements { get; set; }
    public decimal MonthlyPortfolioValueETB { get; set; }
    public int UnreadNotificationCount { get; set; }
}

public class AgencyDashboardDto
{
    public string AgencyName { get; set; } = string.Empty;
    public string AgencyStatus { get; set; } = "Pending";
    public int TotalProperties { get; set; }
    public int PublishedProperties { get; set; }
    public int PendingReviewProperties { get; set; }
    public int RentedProperties { get; set; }
    public int UnreadInquiries { get; set; }
    public int PendingApplications { get; set; }
    public int UpcomingAppointments { get; set; }
    public int ActiveStaff { get; set; }
    public int UnreadNotificationCount { get; set; }
}
