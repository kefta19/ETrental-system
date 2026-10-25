using System.ComponentModel.DataAnnotations;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Properties;

public class CreatePropertyDto
{
    [Required]
    [StringLength(120, MinimumLength = 10)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MinLength(20)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public PropertyType PropertyType { get; set; }

    // Ethiopian Location Details
    [Required]
    public string Region { get; set; } = "Addis Ababa";

    [Required]
    public string City { get; set; } = "Addis Ababa";

    [Required]
    public string SubCity { get; set; } = string.Empty;

    [Required]
    public string Neighborhood { get; set; } = string.Empty;

    public string? Landmark { get; set; }
    public string? StreetAddress { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Financials in Ethiopian Birr (ETB)
    [Required]
    [Range(100, 50000000)]
    public decimal RentAmountETB { get; set; }

    [Required]
    [Range(0, 50000000)]
    public decimal DepositAmountETB { get; set; }

    [Range(1, 24)]
    public int AdvanceMonthsRequired { get; set; } = 3;

    [Range(1, 60)]
    public int MinimumLeaseMonths { get; set; } = 6;

    public DateTime AvailableFromDate { get; set; } = DateTime.UtcNow;

    // Specifications
    [Range(0, 50)]
    public int Bedrooms { get; set; }

    [Range(1, 50)]
    public int Bathrooms { get; set; }

    public double? AreaSquareMeters { get; set; }
    public FurnishingStatus Furnishing { get; set; } = FurnishingStatus.Unfurnished;

    // Ethiopian Essential Amenities
    public bool HasWaterTank { get; set; }
    public bool HasGenerator { get; set; }
    public bool HasSecurityGuard { get; set; }
    public bool HasParking { get; set; }
    public bool HasElevator { get; set; }
    public bool HasWifi { get; set; }
    public bool HasBalcony { get; set; }
    public bool WaterBillIncluded { get; set; }
    public bool ElectricityBillIncluded { get; set; }

    // Photos (Uploaded URLs or references)
    public List<string> ImageUrls { get; set; } = new();

    // Save as Draft or Submit directly for review
    public bool SubmitForReview { get; set; } = true;
}

public class UpdatePropertyDto : CreatePropertyDto
{
    public Guid Id { get; set; }
}
