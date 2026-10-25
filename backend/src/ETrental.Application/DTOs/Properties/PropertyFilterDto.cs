using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Properties;

public class PropertyFilterDto
{
    public string? Keyword { get; set; }
    public string? Region { get; set; }
    public string? City { get; set; }
    public string? SubCity { get; set; }
    public string? Neighborhood { get; set; }
    public PropertyType? PropertyType { get; set; }
    public FurnishingStatus? Furnishing { get; set; }

    public decimal? MinPriceETB { get; set; }
    public decimal? MaxPriceETB { get; set; }
    public int? MinBedrooms { get; set; }
    public int? MaxBedrooms { get; set; }
    public int? MinBathrooms { get; set; }
    public int? MaxAdvanceMonths { get; set; }

    // Amenities filters
    public bool? HasWaterTank { get; set; }
    public bool? HasGenerator { get; set; }
    public bool? HasSecurityGuard { get; set; }
    public bool? HasParking { get; set; }
    public bool? HasElevator { get; set; }
    public bool? HasWifi { get; set; }

    // Sorting & Pagination
    public string SortBy { get; set; } = "newest"; // newest, price_asc, price_desc, bedrooms
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}
