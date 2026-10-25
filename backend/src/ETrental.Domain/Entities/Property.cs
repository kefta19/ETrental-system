using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class Property : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PropertyType PropertyType { get; set; }
    public PropertyStatus Status { get; set; } = PropertyStatus.Draft;
    
    // Ethiopian Location Details
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string SubCity { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string? Landmark { get; set; }
    public string? StreetAddress { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Pricing in Ethiopian Birr (ETB)
    public decimal RentAmountETB { get; set; }
    public decimal DepositAmountETB { get; set; }
    public int AdvanceMonthsRequired { get; set; } = 3;
    public int MinimumLeaseMonths { get; set; } = 6;
    public DateTime AvailableFromDate { get; set; } = DateTime.UtcNow;

    // Specifications & Facilities
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public double? AreaSquareMeters { get; set; }
    public FurnishingStatus Furnishing { get; set; } = FurnishingStatus.Unfurnished;
    
    // Ethiopian Amenities
    public bool HasWaterTank { get; set; } = false;
    public bool HasGenerator { get; set; } = false;
    public bool HasSecurityGuard { get; set; } = false;
    public bool HasParking { get; set; } = false;
    public bool HasElevator { get; set; } = false;
    public bool HasWifi { get; set; } = false;
    public bool HasBalcony { get; set; } = false;
    public bool WaterBillIncluded { get; set; } = false;
    public bool ElectricityBillIncluded { get; set; } = false;

    // Moderation & Review
    public string? RejectionReason { get; set; }
    public string? RejectionCategory { get; set; }
    public DateTime? ModeratedAtUtc { get; set; }
    public string? ModeratedBy { get; set; }

    // Ownership & Foreign Keys
    public string LandlordId { get; set; } = string.Empty;
    public ApplicationUser Landlord { get; set; } = null!;
    public Guid? AgencyId { get; set; }
    public Agency? Agency { get; set; }
    public string? AssignedAgentId { get; set; }
    public ApplicationUser? AssignedAgent { get; set; }

    // Tenancy & Completed Rental Info
    public DateTime? TenancyStartDateUtc { get; set; }
    public decimal? AgreedRentAmountETB { get; set; }
    public int? AgreedLeaseMonths { get; set; }
    public string? RentedToTenantName { get; set; }
    public string? RentedToTenantId { get; set; }

    // Navigation Collections
    public ICollection<PropertyImage> Images { get; set; } = new List<PropertyImage>();
    public ICollection<PropertyInquiry> Inquiries { get; set; } = new List<PropertyInquiry>();
    public ICollection<ViewingAppointment> Appointments { get; set; } = new List<ViewingAppointment>();
    public ICollection<RentalApplication> Applications { get; set; } = new List<RentalApplication>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<ListingReview> Reviews { get; set; } = new List<ListingReview>();
    public ICollection<RentalAgreement> Agreements { get; set; } = new List<RentalAgreement>();
}
