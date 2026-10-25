using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Properties;

public class PropertySummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public PropertyType PropertyType { get; set; }
    public PropertyStatus Status { get; set; }
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string SubCity { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string? Landmark { get; set; }
    
    public decimal RentAmountETB { get; set; }
    public decimal DepositAmountETB { get; set; }
    public int AdvanceMonthsRequired { get; set; }
    
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public double? AreaSquareMeters { get; set; }
    public FurnishingStatus Furnishing { get; set; }

    public bool HasWaterTank { get; set; }
    public bool HasGenerator { get; set; }
    public bool HasSecurityGuard { get; set; }
    public bool HasParking { get; set; }
    public bool HasElevator { get; set; }

    public string? PrimaryImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();

    public string LandlordName { get; set; } = string.Empty;
    public bool IsVerifiedHost { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class PropertyDto : PropertySummaryDto
{
    public string Description { get; set; } = string.Empty;
    public string? StreetAddress { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public int MinimumLeaseMonths { get; set; }
    public DateTime AvailableFromDate { get; set; }
    public bool HasWifi { get; set; }
    public bool HasBalcony { get; set; }
    public bool WaterBillIncluded { get; set; }
    public bool ElectricityBillIncluded { get; set; }

    public string LandlordId { get; set; } = string.Empty;
    public string LandlordPhone { get; set; } = string.Empty;
    public string LandlordEmail { get; set; } = string.Empty;
    public Guid? AgencyId { get; set; }
    public string? AgencyName { get; set; }

    public string? RejectionReason { get; set; }
    public string? RejectionCategory { get; set; }

    public DateTime? TenancyStartDateUtc { get; set; }
    public decimal? AgreedRentAmountETB { get; set; }
    public int? AgreedLeaseMonths { get; set; }
    public string? RentedToTenantName { get; set; }
}
