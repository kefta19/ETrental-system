using System.Linq;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/properties")]
[Authorize]
[Produces("application/json")]
public class PropertiesController : ControllerBase
{
    private const string TelebirrPaymentProvider = "Telebirr";
    private const string CbePaymentProvider = "CBE";

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly INotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IFileStorageService _fileStorageService;

    public PropertiesController(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ISubscriptionService subscriptionService,
        INotificationService notificationService,
        UserManager<ApplicationUser> userManager,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _subscriptionService = subscriptionService;
        _notificationService = notificationService;
        _userManager = userManager;
        _fileStorageService = fileStorageService;
    }

    private static bool IsValidTikTokUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        return Uri.TryCreate(value, UriKind.Absolute, out var uri)
            && uri.Scheme == Uri.UriSchemeHttps
            && (uri.Host.Equals("tiktok.com", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("www.tiktok.com", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("m.tiktok.com", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("vm.tiktok.com", StringComparison.OrdinalIgnoreCase))
            && string.IsNullOrEmpty(uri.UserInfo);
    }

    private static bool IsValidTransactionUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        return Uri.TryCreate(value, UriKind.Absolute, out var uri)
            && uri.Scheme == Uri.UriSchemeHttps
            && !string.IsNullOrEmpty(uri.Host)
            && string.IsNullOrEmpty(uri.UserInfo);
    }

    private async Task NotifyAdminsOfPendingReviewAsync(Property property)
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        foreach (var admin in admins.Where(user => user.IsActive && !user.IsRestricted))
        {
            await _notificationService.CreateAsync(
                admin.Id,
                NotificationType.Listing,
                "New listing awaiting review",
                $"\"{property.Title}\" in {property.SubCity}, {property.City} was submitted for review.",
                "/admin/moderation");
        }
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] string? location,
        [FromQuery] string? city,
        [FromQuery] string? subCity,
        [FromQuery] string? neighborhood,
        [FromQuery] int? propertyType,
        [FromQuery] int? furnishing,
        [FromQuery] bool? furnished,
        [FromQuery] decimal? minPriceETB,
        [FromQuery] decimal? maxPriceETB,
        [FromQuery] int? minBedrooms,
        [FromQuery] int? minBathrooms,
        [FromQuery] double? minArea,
        [FromQuery] int? maxAdvanceMonths,
        [FromQuery] bool? hasWaterTank,
        [FromQuery] bool? hasGenerator,
        [FromQuery] bool? hasSecurityGuard,
        [FromQuery] bool? hasParking,
        [FromQuery] bool? hasElevator,
        [FromQuery] bool? hasWifi,
        [FromQuery] bool? hasBalcony,
        [FromQuery] string? sortBy = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 48);

        var query = _context.Properties
            .Where(p => p.Status == PropertyStatus.Published || p.Status == PropertyStatus.Approved);

        // One box for city, sub-city, neighborhood or landmark (the home page search sends this).
        if (!string.IsNullOrWhiteSpace(location))
        {
            var loc = location.Trim().ToLower();
            query = query.Where(p =>
                p.City.ToLower().Contains(loc) ||
                p.SubCity.ToLower().Contains(loc) ||
                p.Neighborhood.ToLower().Contains(loc) ||
                (p.Landmark != null && p.Landmark.ToLower().Contains(loc)));
        }
        if (!string.IsNullOrWhiteSpace(city))
        {
            var c = city.Trim().ToLower();
            query = query.Where(p => p.City.ToLower() == c);
        }
        if (!string.IsNullOrWhiteSpace(subCity))
        {
            var s = subCity.Trim().ToLower();
            query = query.Where(p => p.SubCity.ToLower() == s);
        }
        if (!string.IsNullOrWhiteSpace(neighborhood))
        {
            var n = neighborhood.Trim().ToLower();
            query = query.Where(p => p.Neighborhood.ToLower() == n);
        }

        if (propertyType.HasValue)
            query = query.Where(p => p.PropertyType == (PropertyType)propertyType.Value);
        if (furnishing.HasValue)
            query = query.Where(p => p.Furnishing == (FurnishingStatus)furnishing.Value);
        if (furnished == true)
            query = query.Where(p => p.Furnishing != FurnishingStatus.Unfurnished);
        if (minPriceETB.HasValue)
            query = query.Where(p => p.RentAmountETB >= minPriceETB.Value);
        if (maxPriceETB.HasValue)
            query = query.Where(p => p.RentAmountETB <= maxPriceETB.Value);
        if (minBedrooms.HasValue)
            query = query.Where(p => p.Bedrooms >= minBedrooms.Value);
        if (minBathrooms.HasValue)
            query = query.Where(p => p.Bathrooms >= minBathrooms.Value);
        if (minArea.HasValue)
            query = query.Where(p => p.AreaSquareMeters != null && p.AreaSquareMeters >= minArea.Value);
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
        if (hasBalcony.HasValue)
            query = query.Where(p => p.HasBalcony == hasBalcony.Value);

        var totalCount = await query.CountAsync();

        query = sortBy switch
        {
            "price_asc" => query.OrderBy(p => p.RentAmountETB).ThenByDescending(p => p.CreatedAtUtc),
            "price_desc" => query.OrderByDescending(p => p.RentAmountETB).ThenByDescending(p => p.CreatedAtUtc),
            "bedrooms" => query.OrderByDescending(p => p.Bedrooms).ThenByDescending(p => p.CreatedAtUtc),
            _ => query.OrderByDescending(p => p.CreatedAtUtc)
        };

        var items = await query
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
                primaryImageUrl = p.Images
                    .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
                    .Select(i => i.ImageUrl).FirstOrDefault(),
                imageUrls = p.Images
                    .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
                    .Select(i => i.ImageUrl).ToList(),
                landlordName = p.Landlord.FullName,
                isVerifiedHost = false,
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
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null)
        {
            return NotFound(Result<PropertySummaryDto>.Failure("Property not found."));
        }

        var userId = _currentUserService.UserId;
        var isOwner = !string.IsNullOrEmpty(userId) && property.LandlordId == userId;
        var isAdmin = User.IsInRole("Admin");
        var canSeePaymentDetails = isOwner || isAdmin;

        // Drafts, pending, rejected and archived listings are visible to the owner and admins only.
        var isViewable = property.Status == PropertyStatus.Published
            || property.Status == PropertyStatus.Approved
            || property.Status == PropertyStatus.Unavailable
            || property.Status == PropertyStatus.Rented;

        if (!isViewable && !isOwner && !isAdmin)
        {
            return NotFound(Result<PropertySummaryDto>.Failure("Property not found."));
        }

        // Phone and email are only sent when the server says this viewer may see them.
        var canSeeContact = isOwner || isAdmin;
        if (!canSeeContact && !string.IsNullOrEmpty(userId))
        {
            var entitlements = await _subscriptionService.GetEntitlementsAsync(userId);
            canSeeContact = entitlements.Succeeded
                && entitlements.Data != null
                && entitlements.Data.CanViewDirectPhone;
        }

        var imageUrls = property.Images
            .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
            .Select(i => i.ImageUrl)
            .ToList();

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
            VideoUrl = property.VideoUrl,
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
            PrimaryImageUrl = imageUrls.FirstOrDefault(),
            ImageUrls = imageUrls,
            LandlordId = property.LandlordId,
            LandlordName = property.Landlord.FullName,
            LandlordPhone = canSeeContact ? property.Landlord.PhoneNumber : null,
            LandlordEmail = canSeeContact ? property.Landlord.Email : null,
            ContactLocked = !canSeeContact,
            IsVerifiedHost = false,
            ListingFeeAmountETB = canSeePaymentDetails ? property.ListingFeeAmountETB : 0,
            ListingFeeProvider = canSeePaymentDetails ? property.ListingFeeProvider : null,
            ListingFeeReference = canSeePaymentDetails ? property.ListingFeeReference : null,
            ListingFeeTransactionUrl = canSeePaymentDetails ? property.ListingFeeTransactionUrl : null,
            ListingFeeStatus = canSeePaymentDetails ? property.ListingFeeStatus : ListingFeeStatus.NotRequired,
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

        if (!User.IsInRole("Landlord"))
        {
            return Forbid();
        }

        if (dto.SubmitForReview)
        {
            var owner = await _context.Users.FirstOrDefaultAsync(user => user.Id == userId);
            if (owner == null
                || string.IsNullOrWhiteSpace(owner.FirstName)
                || string.IsNullOrWhiteSpace(owner.LastName)
                || string.IsNullOrWhiteSpace(owner.PhoneNumber)
                || string.IsNullOrWhiteSpace(owner.Email))
            {
                return BadRequest(Result<PropertySummaryDto>.Failure(
                    "Complete your account name, phone number, and email before submitting a listing."));
            }
        }

        if (dto.SubmitForReview &&
            (string.IsNullOrWhiteSpace(dto.ListingFeeProvider)
                || string.IsNullOrWhiteSpace(dto.ListingFeeReference)))
        {
            return BadRequest(Result<PropertySummaryDto>.Failure(
                "Choose a payment method and enter the transaction reference before submitting for review."));
        }

        if (dto.SubmitForReview &&
            (string.IsNullOrWhiteSpace(dto.ListingFeeTransactionUrl)
                || !IsValidTransactionUrl(dto.ListingFeeTransactionUrl)))
        {
            return BadRequest(Result<PropertySummaryDto>.Failure("Provide the payment provider’s HTTPS transaction link."));
        }

        if (!IsValidTikTokUrl(dto.VideoUrl))
        {
            return BadRequest(Result<PropertySummaryDto>.Failure(
                "Enter a valid HTTPS TikTok video or post link."));
        }

        if (!DateTime.TryParse(
                dto.AvailableFromDate,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var availableFromDate))
        {
            return BadRequest(Result<PropertySummaryDto>.Failure("Enter a valid property availability date."));
        }

        if (dto.SubmitForReview &&
            await _context.Properties.AnyAsync(p =>
                p.ListingFeeProvider == dto.ListingFeeProvider
                && p.ListingFeeReference == dto.ListingFeeReference!.Trim()
                && p.ListingFeeStatus != ListingFeeStatus.NotRequired))
        {
            return BadRequest(Result<PropertySummaryDto>.Failure(
                "This payment reference has already been used for a listing."));
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
            VideoUrl = dto.VideoUrl?.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            RentAmountETB = dto.RentAmountETB,
            DepositAmountETB = dto.DepositAmountETB,
            AdvanceMonthsRequired = dto.AdvanceMonthsRequired,
            MinimumLeaseMonths = dto.MinimumLeaseMonths,
            AvailableFromDate = availableFromDate,
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
            Status = dto.SubmitForReview ? PropertyStatus.PendingReview : PropertyStatus.Draft,
            ListingFeeAmountETB = dto.SubmitForReview ? Property.RequiredListingFeeETB : 0,
            ListingFeeProvider = dto.SubmitForReview ? dto.ListingFeeProvider!.Trim() : null,
            ListingFeeReference = dto.SubmitForReview ? dto.ListingFeeReference!.Trim() : null,
            ListingFeeTransactionUrl = dto.SubmitForReview ? dto.ListingFeeTransactionUrl?.Trim() : null,
            ListingFeeStatus = dto.SubmitForReview ? ListingFeeStatus.Pending : ListingFeeStatus.NotRequired,
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
        if (property.Status == PropertyStatus.PendingReview)
        {
            await NotifyAdminsOfPendingReviewAsync(property);
        }

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
                listingFeeAmountETB = p.ListingFeeAmountETB,
                listingFeeProvider = p.ListingFeeProvider,
                listingFeeReference = p.ListingFeeReference,
                listingFeeTransactionUrl = p.ListingFeeTransactionUrl,
                listingFeeStatus = (int)p.ListingFeeStatus,
                createdAtUtc = p.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(Result<object>.Success(items));
    }

    [HttpPost("{id}/submit-review")]
    public async Task<IActionResult> SubmitForReview(Guid id, [FromBody] ListingFeeSubmissionDto dto)
    {
        var userId = _currentUserService.UserId;
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id && p.LandlordId == userId);

        if (property == null)
        {
            return NotFound(Result<PropertySummaryDto>.Failure("Property not found."));
        }

        if (property.Status != PropertyStatus.Draft && property.Status != PropertyStatus.Rejected)
        {
            return BadRequest(Result<PropertySummaryDto>.Failure(
                "Only a draft or rejected listing can be submitted for review."));
        }

        var owner = await _context.Users.FirstOrDefaultAsync(user => user.Id == userId);
        if (owner == null
            || string.IsNullOrWhiteSpace(owner.FirstName)
            || string.IsNullOrWhiteSpace(owner.LastName)
            || string.IsNullOrWhiteSpace(owner.PhoneNumber)
            || string.IsNullOrWhiteSpace(owner.Email))
        {
            return BadRequest(Result<PropertySummaryDto>.Failure(
                "Complete your account name, phone number, and email before submitting a listing."));
        }

        if (property.ListingFeeStatus != ListingFeeStatus.Pending
            && property.ListingFeeStatus != ListingFeeStatus.Verified)
        {
            var paymentReference = dto.ListingFeeReference.Trim();
            if (await _context.Properties.AnyAsync(p =>
                p.Id != property.Id
                && p.ListingFeeProvider == dto.ListingFeeProvider
                && p.ListingFeeReference == paymentReference
                && p.ListingFeeStatus != ListingFeeStatus.NotRequired))
            {
                return BadRequest(Result<PropertySummaryDto>.Failure(
                    "This payment reference has already been used for a listing."));
            }

            property.ListingFeeAmountETB = Property.RequiredListingFeeETB;
            property.ListingFeeProvider = dto.ListingFeeProvider;
            property.ListingFeeReference = paymentReference;
            property.ListingFeeTransactionUrl = dto.ListingFeeTransactionUrl?.Trim();
            property.ListingFeeStatus = ListingFeeStatus.Pending;
            property.ListingFeeVerifiedAtUtc = null;
            property.ListingFeeVerifiedBy = null;
        }

        if (string.IsNullOrWhiteSpace(dto.ListingFeeTransactionUrl)
            || !IsValidTransactionUrl(dto.ListingFeeTransactionUrl))
        {
            return BadRequest(Result<PropertySummaryDto>.Failure("Provide the payment provider’s HTTPS transaction link."));
        }
        property.ListingFeeTransactionUrl = dto.ListingFeeTransactionUrl.Trim();

        property.Status = PropertyStatus.PendingReview;
        await _context.SaveChangesAsync();
        await NotifyAdminsOfPendingReviewAsync(property);

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

        if (property.Status != PropertyStatus.Published && property.Status != PropertyStatus.Unavailable)
        {
            return BadRequest(Result<PropertySummaryDto>.Failure(
                "Only approved listings can change availability."));
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
    [Authorize(Roles = "Landlord")]
    public async Task<IActionResult> UploadImage(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(Result<object>.Failure("Choose an image to upload."));
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(Result<object>.Failure("Images must be 5 MB or smaller."));
        }

        if (!_fileStorageService.IsValidImage(file.ContentType, file.FileName))
        {
            return BadRequest(Result<object>.Failure("Only JPEG, PNG, and WebP images are permitted."));
        }

        string url;
        try
        {
            await using var stream = file.OpenReadStream();
            url = await _fileStorageService.SaveFileAsync(stream, file.FileName, file.ContentType);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(Result<object>.Failure(ex.Message));
        }

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
        [StringLength(500)]
        public string? VideoUrl { get; set; }
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
        public bool IsVerifiedHost { get; set; }
        public bool ContactLocked { get; set; }
        public decimal ListingFeeAmountETB { get; set; }
        public string? ListingFeeProvider { get; set; }
        public string? ListingFeeReference { get; set; }
        public string? ListingFeeTransactionUrl { get; set; }
        public ListingFeeStatus ListingFeeStatus { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }

    public class CreatePropertyDto
    {
        [Required]
        [StringLength(120, MinimumLength = 10)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MinLength(20)]
        public string Description { get; set; } = string.Empty;

        [Range(0, 6)]
        public int PropertyType { get; set; }

        [Required]
        public string Region { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public string SubCity { get; set; } = string.Empty;

        [Required]
        public string Neighborhood { get; set; } = string.Empty;
        public string? Landmark { get; set; }
        public string? StreetAddress { get; set; }
        [StringLength(500)]
        public string? VideoUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        [Range(100, 50000000)]
        public decimal RentAmountETB { get; set; }

        [Range(0, 50000000)]
        public decimal DepositAmountETB { get; set; }

        [Range(1, 24)]
        public int AdvanceMonthsRequired { get; set; }

        [Range(1, 60)]
        public int MinimumLeaseMonths { get; set; }

        [Required]
        public string AvailableFromDate { get; set; } = string.Empty;

        [Range(0, 50)]
        public int Bedrooms { get; set; }

        [Range(1, 50)]
        public int Bathrooms { get; set; }

        [Range(1, 10000)]
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

        [StringLength(20)]
        [RegularExpression("^(Telebirr|CBE)$")]
        public string? ListingFeeProvider { get; set; }

        [StringLength(200, MinimumLength = 1)]
        public string? ListingFeeReference { get; set; }

        [StringLength(2048)]
        public string? ListingFeeTransactionUrl { get; set; }
    }

    public class ListingFeeSubmissionDto
    {
        [Required]
        [RegularExpression("^(Telebirr|CBE)$")]
        public string ListingFeeProvider { get; set; } = string.Empty;

        [Required]
        [StringLength(200, MinimumLength = 1)]
        public string ListingFeeReference { get; set; } = string.Empty;

        [StringLength(2048)]
        public string? ListingFeeTransactionUrl { get; set; }
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