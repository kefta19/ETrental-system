using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/properties")]
[Authorize]
[Produces("application/json")]
public class PropertiesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public PropertiesController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] string? keyword,
        [FromQuery] string? city,
        [FromQuery] string? subCity,
        [FromQuery] string? neighborhood,
        [FromQuery] int? propertyType,
        [FromQuery] int? furnishing,
        [FromQuery] decimal? minPriceETB,
        [FromQuery] decimal? maxPriceETB,
        [FromQuery] int? minBedrooms,
        [FromQuery] int? minBathrooms,
        [FromQuery] int? maxAdvanceMonths,
        [FromQuery] bool? hasWaterTank,
        [FromQuery] bool? hasGenerator,
        [FromQuery] bool? hasSecurityGuard,
        [FromQuery] bool? hasParking,
        [FromQuery] bool? hasElevator,
        [FromQuery] bool? hasWifi,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = _context.Properties
            .Include(p => p.Landlord)
            .Where(p => p.Status == PropertyStatus.Published || p.Status == PropertyStatus.Approved);

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(p => p.Title.Contains(keyword) || p.Description.Contains(keyword));
        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(p => p.City == city);
        if (!string.IsNullOrWhiteSpace(subCity))
            query = query.Where(p => p.SubCity == subCity);
        if (!string.IsNullOrWhiteSpace(neighborhood))
            query = query.Where(p => p.Neighborhood == neighborhood);
        if (propertyType.HasValue)
            query = query.Where(p => p.PropertyType == (PropertyType)propertyType.Value);
        if (furnishing.HasValue)
            query = query.Where(p => p.Furnishing == (FurnishingStatus)furnishing.Value);
        if (minPriceETB.HasValue)
            query = query.Where(p => p.RentAmountETB >= minPriceETB.Value);
        if (maxPriceETB.HasValue)
            query = query.Where(p => p.RentAmountETB <= maxPriceETB.Value);
        if (minBedrooms.HasValue)
            query = query.Where(p => p.Bedrooms >= minBedrooms.Value);
        if (minBathrooms.HasValue)
            query = query.Where(p => p.Bathrooms >= minBathrooms.Value);
        if (maxAdvanceMonths.HasValue)
            query = query.Where(p => p.AdvanceMonthsRequired <= maxAdvanceMonths.Value);
        if (hasWaterTank.HasValue)
            query = query.Where(p => p.HasWaterTank == hasWaterTank.Value);
        if (hasGenerator.HasValue)
            query = query.Where(p => p.HasGenerator == hasGenerator.Value);
        if (hasSecurityGuard.HasValue)
            query = query.Where(p => p.HasSecurityGuard == hasSecurityGuard.Value);
        if (hasParking.HasValue)
            query = query.Where(p => p.HasParking == hasParking.Value);
        if (hasElevator.HasValue)
            query = query.Where(p => p.HasElevator == hasElevator.Value);
        if (hasWifi.HasValue)
            query = query.Where(p => p.HasWifi == hasWifi.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                id = p.Id,
                title = p.Title,
                propertyType = (int)p.PropertyType,
                status = (int)p.Status,
                region = p.Region,
                city = p.City,
                subCity = p.SubCity,
                neighborhood = p.Neighborhood,
                landmark = p.Landmark,
                rentAmountETB = p.RentAmountETB,
                depositAmountETB = p.DepositAmountETB,
                advanceMonthsRequired = p.AdvanceMonthsRequired,
                bedrooms = p.Bedrooms,
                bathrooms = p.Bathrooms,
                areaSquareMeters = p.AreaSquareMeters,
                furnishing = (int)p.Furnishing,
                hasWaterTank = p.HasWaterTank,
                hasGenerator = p.HasGenerator,
                hasSecurityGuard = p.HasSecurityGuard,
                hasParking = p.HasParking,
                hasElevator = p.HasElevator,
                primaryImageUrl = p.Images.Any() ? p.Images.First().ImageUrl : null,
                imageUrls = p.Images.Select(i => i.ImageUrl).ToList(),
                landlordName = p.Landlord.FullName,
                isVerifiedHost = p.Landlord.IsActive,
                createdAtUtc = p.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(Result<object>.Success(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            hasPreviousPage = page > 1,
            hasNextPage = page * pageSize < totalCount
        }));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var property = await _context.Properties
            .Include(p => p.Landlord)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null)
        {
            return NotFound(Result<PropertySummaryDto>.Failure("Property not found."));
        }

        var dto = new PropertySummaryDto
        {
            Id = property.Id.ToString(),
            Title = property.Title,
            Description = property.Description,
            PropertyType = (int)property.PropertyType,
            Status = (int)property.Status,
            Region = property.Region,
            City = property.City,
            SubCity = property.SubCity,
            Neighborhood = property.Neighborhood,
            Landmark = property.Landmark,
            StreetAddress = property.StreetAddress,
            Latitude = property.Latitude,
            Longitude = property.Longitude,
            RentAmountETB = property.RentAmountETB,
            DepositAmountETB = property.DepositAmountETB,
            AdvanceMonthsRequired = property.AdvanceMonthsRequired,
            MinimumLeaseMonths = property.MinimumLeaseMonths,
            AvailableFromDate = property.AvailableFromDate,
            Bedrooms = property.Bedrooms,
            Bathrooms = property.Bathrooms,
            AreaSquareMeters = property.AreaSquareMeters,
            Furnishing = (int)property.Furnishing,
            HasWaterTank = property.HasWaterTank,
            HasGenerator = property.HasGenerator,
            HasSecurityGuard = property.HasSecurityGuard,
            HasParking = property.HasParking,
            HasElevator = property.HasElevator,
            HasWifi = property.HasWifi,
            HasBalcony = property.HasBalcony,
            WaterBillIncluded = property.WaterBillIncluded,
            ElectricityBillIncluded = property.ElectricityBillIncluded,
            PrimaryImageUrl = property.Images.FirstOrDefault()?.ImageUrl,
            ImageUrls = property.Images.Select(i => i.ImageUrl).ToList(),
            LandlordId = property.LandlordId,
            LandlordName = property.Landlord.FullName,
            LandlordPhone = property.Landlord.PhoneNumber,
            LandlordEmail = property.Landlord.Email,
            CreatedAtUtc = property.CreatedAtUtc
        };

        return Ok(Result<PropertySummaryDto>.Success(dto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePropertyDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Result<PropertySummaryDto>.Failure(
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToArray()));
        }

        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(Result<PropertySummaryDto>.Failure("User not authenticated."));
        }

        var property = new Property
        {
            Title = dto.Title,
            Description = dto.Description,
            PropertyType = (PropertyType)dto.PropertyType,
            Region = dto.Region,
            City = dto.City,
            SubCity = dto.SubCity,
            Neighborhood = dto.Neighborhood,
            Landmark = dto.Landmark,
            StreetAddress = dto.StreetAddress,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            RentAmountETB = dto.RentAmountETB,
            DepositAmountETB = dto.DepositAmountETB,
            AdvanceMonthsRequired = dto.AdvanceMonthsRequired,
            MinimumLeaseMonths = dto.MinimumLeaseMonths,
            AvailableFromDate = DateTime.Parse(dto.AvailableFromDate),
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            AreaSquareMeters = dto.AreaSquareMeters,
            Furnishing = (FurnishingStatus)dto.Furnishing,
            HasWaterTank = dto.HasWaterTank,
            HasGenerator = dto.HasGenerator,
            HasSecurityGuard = dto.HasSecurityGuard,
            HasParking = dto.HasParking,
            HasElevator = dto.HasElevator,
            HasWifi = dto.HasWifi,
            HasBalcony = dto.HasBalcony,
            WaterBillIncluded = dto.WaterBillIncluded,
            ElectricityBillIncluded = dto.ElectricityBillIncluded,
            LandlordId = userId,
            Status = dto.SubmitForReview ? PropertyStatus.PendingReview : PropertyStatus.Published,
            CreatedAtUtc = DateTime.UtcNow
        };

        // Add property images
        if (dto.ImageUrls != null && dto.ImageUrls.Any())
        {
            foreach (var imageUrl in dto.ImageUrls)
            {
                property.Images.Add(new PropertyImage
                {
                    ImageUrl = imageUrl,
                    IsPrimary = property.Images.Count == 0
                });
            }
        }

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        return Ok(Result<PropertySummaryDto>.Success(new PropertySummaryDto
        {
            Id = property.Id.ToString(),
            Title = property.Title,
            Status = (int)property.Status,
            CreatedAtUtc = property.CreatedAtUtc
        }));
    }

    [HttpGet("landlord/my-listings")]
    public async Task<IActionResult> GetMyListings([FromQuery] int? status)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(Result<object>.Failure("User not authenticated."));
        }

        var query = _context.Properties
            .Where(p => p.LandlordId == userId);

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == (PropertyStatus)status.Value);
        }

        var items = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new
            {
                id = p.Id,
                title = p.Title,
                propertyType = (int)p.PropertyType,
                status = (int)p.Status,
                city = p.City,
                subCity = p.SubCity,
                rentAmountETB = p.RentAmountETB,
                bedrooms = p.Bedrooms,
                primaryImageUrl = p.Images.Any() ? p.Images.First().ImageUrl : null,
                createdAtUtc = p.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(Result<object>.Success(items));
    }

    [HttpPost("{id}/submit-review")]
    public async Task<IActionResult> SubmitForReview(Guid id)
    {
        var userId = _currentUserService.UserId;
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id && p.LandlordId == userId);

        if (property == null)
        {
            return NotFound(Result<PropertySummaryDto>.Failure("Property not found."));
        }

        property.Status = PropertyStatus.PendingReview;
        await _context.SaveChangesAsync();

        return Ok(Result<PropertySummaryDto>.Success(new PropertySummaryDto
        {
            Id = property.Id.ToString(),
            Status = (int)property.Status
        }));
    }

    [HttpPost("{id}/toggle-availability")]
    public async Task<IActionResult> ToggleAvailability(Guid id)
    {
        var userId = _currentUserService.UserId;
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id && p.LandlordId == userId);

        if (property == null)
        {
            return NotFound(Result<PropertySummaryDto>.Failure("Property not found."));
        }

        property.Status = property.Status == PropertyStatus.Published
            ? PropertyStatus.Unavailable
            : PropertyStatus.Published;

        await _context.SaveChangesAsync();

        return Ok(Result<PropertySummaryDto>.Success(new PropertySummaryDto
        {
            Id = property.Id.ToString(),
            Status = (int)property.Status
        }));
    }

    [HttpPost("{id}/mark-as-rented")]
    public async Task<IActionResult> MarkAsRented(Guid id, [FromBody] MarkAsRentedDto dto)
    {
        var userId = _currentUserService.UserId;
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id && p.LandlordId == userId);

        if (property == null)
        {
            return NotFound(Result<PropertySummaryDto>.Failure("Property not found."));
        }

        property.Status = PropertyStatus.Rented;
        await _context.SaveChangesAsync();

        return Ok(Result<PropertySummaryDto>.Success(new PropertySummaryDto
        {
            Id = property.Id.ToString(),
            Status = (int)property.Status
        }));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = _currentUserService.UserId;
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id && p.LandlordId == userId);

        if (property == null)
        {
            return NotFound(Result<PropertySummaryDto>.Failure("Property not found."));
        }

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();

        return Ok(Result<bool>.Success(true));
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{fileName}";
        return Ok(new { succeeded = true, data = new { url } });
    }

    public class PropertySummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PropertyType { get; set; }
        public int Status { get; set; }
        public string Region { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string SubCity { get; set; } = string.Empty;
        public string Neighborhood { get; set; } = string.Empty;
        public string? Landmark { get; set; }
        public string? StreetAddress { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public decimal RentAmountETB { get; set; }
        public decimal DepositAmountETB { get; set; }
        public int AdvanceMonthsRequired { get; set; }
        public int MinimumLeaseMonths { get; set; }
        public DateTime AvailableFromDate { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public double? AreaSquareMeters { get; set; }
        public int Furnishing { get; set; }
        public bool HasWaterTank { get; set; }
        public bool HasGenerator { get; set; }
        public bool HasSecurityGuard { get; set; }
        public bool HasParking { get; set; }
        public bool HasElevator { get; set; }
        public bool HasWifi { get; set; }
        public bool HasBalcony { get; set; }
        public bool WaterBillIncluded { get; set; }
        public bool ElectricityBillIncluded { get; set; }
        public string? PrimaryImageUrl { get; set; }
        public List<string> ImageUrls { get; set; } = new();
        public string LandlordId { get; set; } = string.Empty;
        public string LandlordName { get; set; } = string.Empty;
        public string? LandlordPhone { get; set; }
        public string? LandlordEmail { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }

    public class CreatePropertyDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PropertyType { get; set; }
        public string Region { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string SubCity { get; set; } = string.Empty;
        public string Neighborhood { get; set; } = string.Empty;
        public string? Landmark { get; set; }
        public string? StreetAddress { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public decimal RentAmountETB { get; set; }
        public decimal DepositAmountETB { get; set; }
        public int AdvanceMonthsRequired { get; set; }
        public int MinimumLeaseMonths { get; set; }
        public string AvailableFromDate { get; set; } = string.Empty;
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public double? AreaSquareMeters { get; set; }
        public int Furnishing { get; set; }
        public bool HasWaterTank { get; set; }
        public bool HasGenerator { get; set; }
        public bool HasSecurityGuard { get; set; }
        public bool HasParking { get; set; }
        public bool HasElevator { get; set; }
        public bool HasWifi { get; set; }
        public bool HasBalcony { get; set; }
        public bool WaterBillIncluded { get; set; }
        public bool ElectricityBillIncluded { get; set; }
        public List<string> ImageUrls { get; set; } = new();
        public bool SubmitForReview { get; set; }
    }

    public class MarkAsRentedDto
    {
        public string TenantName { get; set; } = string.Empty;
        public string? TenantId { get; set; }
        public decimal AgreedRentAmountETB { get; set; }
        public int AgreedLeaseMonths { get; set; }
        public string TenancyStartDateUtc { get; set; } = string.Empty;
    }
}
