namespace ETrental.Domain.Enums;

public enum UserRole
{
    Renter = 0,
    Landlord = 1,
    Support = 3,
    Admin = 4
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
    Account = 0,
    Listing = 1,
    SubscriptionBilling = 3,
    Technical = 4,
    SafetyFraud = 5,
    Payment = 6,
    InquiryAppointment = 7,
    Privacy = 8,
    Other = 9
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

public enum ListingFeeStatus
{
    NotRequired,
    Pending,
    Verified,
    Rejected
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
    Account = 0,
    Listing = 1,
    Inquiry = 2,
    Appointment = 3,
    Application = 4,
    Support = 6,
    Subscription = 7,
    Security = 8,
    System = 9
}
