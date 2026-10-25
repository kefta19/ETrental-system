namespace ETrental.Domain.Enums;

public enum UserRole
{
    Renter,
    Landlord,
    Agency,
    Support,
    Admin
}

public enum PropertyType
{
    Apartment,
    Condominium,
    Villa,
    GPlusOne,
    Studio,
    ServiceQuarter,
    Commercial
}

public enum PropertyStatus
{
    Draft,
    PendingReview,
    Approved,
    Rejected,
    Published,
    Unavailable,
    Rented,
    Archived
}

public enum FurnishingStatus
{
    Unfurnished,
    SemiFurnished,
    FullyFurnished
}

public enum AgencyStatus
{
    Pending,
    Verified,
    Rejected,
    Suspended
}

public enum AgencyStaffRole
{
    AgencyManager,
    Agent,
    Viewer
}

public enum AppointmentStatus
{
    Requested,
    Confirmed,
    Rescheduled,
    Cancelled,
    Completed
}

public enum ApplicationStatus
{
    Submitted,
    UnderReview,
    Accepted,
    Rejected,
    Withdrawn
}

public enum TicketStatus
{
    Open,
    InProgress,
    WaitingForUser,
    Escalated,
    Resolved
}

public enum TicketCategory
{
    Account,
    Listing,
    Agency,
    SubscriptionBilling,
    Technical,
    SafetyFraud,
    Payment,
    InquiryAppointment,
    Privacy,
    Other
}

public enum TicketPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum ReportStatus
{
    Open,
    UnderReview,
    ActionRequired,
    Resolved,
    Dismissed
}

public enum ReportCategory
{
    FakeListing,
    MisleadingInformation,
    DuplicateListing,
    SuspiciousUser,
    IncorrectPrice,
    Harassment,
    UnauthorizedPhotos,
    Fraud,
    Other
}

public enum SubscriptionTier
{
    Free,
    Premium
}

public enum SubscriptionStatus
{
    Free,
    PendingPayment,
    Active,
    Expired,
    Cancelled,
    PaymentFailed,
    PastDue
}

public enum ListingDecision
{
    Approved,
    Rejected,
    CorrectionRequested,
    Unpublished
}

public enum PaymentStatus
{
    Pending,
    Completed,
    Failed,
    Refunded,
    Cancelled
}

public enum RentalAgreementStatus
{
    Draft,
    Active,
    Completed,
    Terminated,
    Cancelled
}

public enum NotificationType
{
    Account,
    Listing,
    Inquiry,
    Appointment,
    Application,
    Agency,
    Support,
    Subscription,
    Security,
    System
}
