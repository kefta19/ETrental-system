using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Properties;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class PropertyService : IPropertyService
{
    private readonly IApplicationDbContext _context;
    private readonly IAgencyAccessService _agencyAccess;
    private readonly ISubscriptionService _subscriptionService;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public PropertyService(
        IApplicationDbContext context,
        IAgencyAccessService agencyAccess,
        ISubscriptionService subscriptionService,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _context = context;
        _agencyAccess = agencyAccess;
        _subscriptionService = subscriptionService;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    public async Task<Result<PaginatedResult<PropertySummaryDto>>> SearchPropertiesAsync(PropertyFilterDto filter)
    {
        var query = _context.Properties
            .Include(p => p.Images)
            .Include(p => p.Landlord)
            .Where(p => p.Status == PropertyStatus.Published)
            .AsNoTracking();

        // 1. Keyword search (Title, Description, Landmark, Neighborhood)
        if (!string.IsNullOrWhiteSpace(filter.Keyword))
        {
            var kw = filter.Keyword.Trim().ToLower();
            query = query.Where(p => p.Title.ToLower().Contains(kw)
                                  || p.Description.ToLower().Contains(kw)
                                  || p.Neighborhood.ToLower().Contains(kw)
                                  || (p.Landmark != null && p.Landmark.ToLower().Contains(kw)));
        }

        // 2. Ethiopian Location filtering
        if (!string.IsNullOrWhiteSpace(filter.Region))
        {
            query = query.Where(p => p.Region.ToLower() == filter.Region.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(filter.City))
        {
            query = query.Where(p => p.City.ToLower() == filter.City.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(filter.SubCity))
        {
            query = query.Where(p => p.SubCity.ToLower() == filter.SubCity.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(filter.Neighborhood))
        {
            query = query.Where(p => p.Neighborhood.ToLower().Contains(filter.Neighborhood.Trim().ToLower()));
        }

        // 3. Property Type & Furnishing
        if (filter.PropertyType.HasValue)
        {
            query = query.Where(p => p.PropertyType == filter.PropertyType.Value);
        }

        if (filter.Furnishing.HasValue)
        {
            query = query.Where(p => p.Furnishing == filter.Furnishing.Value);
        }

        // 4. Financials in Ethiopian Birr (ETB)
        if (filter.MinPriceETB.HasValue)
        {
            query = query.Where(p => p.RentAmountETB >= filter.MinPriceETB.Value);
        }

        if (filter.MaxPriceETB.HasValue && filter.MaxPriceETB.Value > 0)
        {
            query = query.Where(p => p.RentAmountETB <= filter.MaxPriceETB.Value);
        }

        if (filter.MaxAdvanceMonths.HasValue)
        {
            query = query.Where(p => p.AdvanceMonthsRequired <= filter.MaxAdvanceMonths.Value);
        }

        // 5. Rooms
        if (filter.MinBedrooms.HasValue)
        {
            query = query.Where(p => p.Bedrooms >= filter.MinBedrooms.Value);
        }

        if (filter.MaxBedrooms.HasValue)
        {
            query = query.Where(p => p.Bedrooms <= filter.MaxBedrooms.Value);
        }

        if (filter.MinBathrooms.HasValue)
        {
            query = query.Where(p => p.Bathrooms >= filter.MinBathrooms.Value);
        }

        // 6. Amenities
        if (filter.HasWaterTank == true) query = query.Where(p => p.HasWaterTank);
        if (filter.HasGenerator == true) query = query.Where(p => p.HasGenerator);
        if (filter.HasSecurityGuard == true) query = query.Where(p => p.HasSecurityGuard);
        if (filter.HasParking == true) query = query.Where(p => p.HasParking);
        if (filter.HasElevator == true) query = query.Where(p => p.HasElevator);
        if (filter.HasWifi == true) query = query.Where(p => p.HasWifi);

        // 7. Sorting
        query = filter.SortBy.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.RentAmountETB),
            "price_desc" => query.OrderByDescending(p => p.RentAmountETB),
            "bedrooms" => query.OrderByDescending(p => p.Bedrooms),
            _ => query.OrderByDescending(p => p.CreatedAtUtc)
        };

        var totalCount = await query.CountAsync();
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 12 : filter.PageSize;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PropertySummaryDto
            {
                Id = p.Id,
                Title = p.Title,
                PropertyType = p.PropertyType,
                Status = p.Status,
                Region = p.Region,
                City = p.City,
                SubCity = p.SubCity,
                Neighborhood = p.Neighborhood,
                Landmark = p.Landmark,
                RentAmountETB = p.RentAmountETB,
                DepositAmountETB = p.DepositAmountETB,
                AdvanceMonthsRequired = p.AdvanceMonthsRequired,
                Bedrooms = p.Bedrooms,
                Bathrooms = p.Bathrooms,
                AreaSquareMeters = p.AreaSquareMeters,
                Furnishing = p.Furnishing,
                HasWaterTank = p.HasWaterTank,
                HasGenerator = p.HasGenerator,
                HasSecurityGuard = p.HasSecurityGuard,
                HasParking = p.HasParking,
                HasElevator = p.HasElevator,
                PrimaryImageUrl = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                ImageUrls = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
                LandlordName = p.Landlord.FullName,
                IsVerifiedHost = p.AgencyId != null,
                CreatedAtUtc = p.CreatedAtUtc
            })
            .ToListAsync();

        return Result<PaginatedResult<PropertySummaryDto>>.Success(new PaginatedResult<PropertySummaryDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<Result<PropertyDto>> GetPropertyByIdAsync(Guid id, string? currentUserId = null, bool isAdmin = false)
    {
        var property = await _context.Properties
            .Include(p => p.Images)
            .Include(p => p.Landlord)
            .Include(p => p.Agency)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null)
        {
            return Result<PropertyDto>.Failure("Property listing not found.");
        }

        var canManage = false;
        var canViewUnpublished = false;

        if (!string.IsNullOrEmpty(currentUserId))
        {
            canManage = await _agencyAccess.CanManagePropertyAsync(currentUserId, property);
            canViewUnpublished = canManage || await _agencyAccess.CanAccessPropertyAsync(currentUserId, property);
        }

        // Security Invariant: Non-published listings can only be viewed by the owner,
        // an authorised agency member or an administrator.
        if (property.Status != PropertyStatus.Published && !canViewUnpublished && !isAdmin)
        {
            return Result<PropertyDto>.Failure("Property listing not found.");
        }

        // Contact details are a premium entitlement for visitors, but always visible
        // to the owner, the agency and administrators.
        var showContact = isAdmin || canManage;
        if (!showContact && !string.IsNullOrEmpty(currentUserId))
        {
            var entitlements = await _subscriptionService.GetEntitlementsAsync(currentUserId);
            showContact = entitlements.Succeeded && entitlements.Data!.CanViewDirectPhone;
        }

        return Result<PropertyDto>.Success(MapToDto(property, showContact));
    }

    public async Task<Result<PropertyDto>> CreatePropertyAsync(CreatePropertyDto dto, string landlordId, Guid? agencyId = null)
    {
        // Duplicate detection: same owner, same location and same rent is treated as a duplicate.
        var duplicate = await _context.Properties.AnyAsync(p =>
            p.LandlordId == landlordId &&
            p.Neighborhood.ToLower() == dto.Neighborhood.Trim().ToLower() &&
            p.RentAmountETB == dto.RentAmountETB &&
            !p.IsDeleted);

        if (duplicate)
        {
            return Result<PropertyDto>.Failure("You already have a listing with the same location and rent. Edit that listing instead of creating a duplicate.");
        }

        var property = new Property
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            PropertyType = dto.PropertyType,
            Status = dto.SubmitForReview ? PropertyStatus.PendingReview : PropertyStatus.Draft,
            Region = dto.Region.Trim(),
            City = dto.City.Trim(),
            SubCity = dto.SubCity.Trim(),
            Neighborhood = dto.Neighborhood.Trim(),
            Landmark = dto.Landmark?.Trim(),
            StreetAddress = dto.StreetAddress?.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            RentAmountETB = dto.RentAmountETB,
            DepositAmountETB = dto.DepositAmountETB,
            AdvanceMonthsRequired = dto.AdvanceMonthsRequired,
            MinimumLeaseMonths = dto.MinimumLeaseMonths,
            AvailableFromDate = dto.AvailableFromDate,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            AreaSquareMeters = dto.AreaSquareMeters,
            Furnishing = dto.Furnishing,
            HasWaterTank = dto.HasWaterTank,
            HasGenerator = dto.HasGenerator,
            HasSecurityGuard = dto.HasSecurityGuard,
            HasParking = dto.HasParking,
            HasElevator = dto.HasElevator,
            HasWifi = dto.HasWifi,
            HasBalcony = dto.HasBalcony,
            WaterBillIncluded = dto.WaterBillIncluded,
            ElectricityBillIncluded = dto.ElectricityBillIncluded,
            LandlordId = landlordId,
            AgencyId = agencyId
        };

        // Attach Images
        var displayOrder = 0;
        foreach (var imgUrl in dto.ImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)))
        {
            property.Images.Add(new PropertyImage
            {
                PropertyId = property.Id,
                ImageUrl = imgUrl,
                IsPrimary = displayOrder == 0,
                DisplayOrder = displayOrder++
            });
        }

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(landlordId, "PropertyCreated", "Property", property.Id.ToString(),
            property.Status.ToString());

        if (property.Status == PropertyStatus.PendingReview)
        {
            await NotifyAdminsOfPendingReviewAsync(property);
        }

        return await GetPropertyByIdAsync(property.Id, landlordId, true);
    }

    public async Task<Result<PropertyDto>> UpdatePropertyAsync(Guid id, UpdatePropertyDto dto, string currentUserId, bool isAdmin = false)
    {
        var property = await _context.Properties
            .Include(p => p.Images)
            .Include(p => p.Landlord)
            .Include(p => p.Agency)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null)
        {
            return Result<PropertyDto>.Failure("Property listing not found.");
        }

        // IDOR / agency isolation check
        var canManage = await _agencyAccess.CanManagePropertyAsync(currentUserId, property);
        if (!canManage && !isAdmin)
        {
            return Result<PropertyDto>.Failure("You do not have permission to modify this property.");
        }

        // A published listing cannot be silently edited and stay published: edits
        // send it back through moderation.
        var wasPublished = property.Status == PropertyStatus.Published;

        property.Title = dto.Title.Trim();
        property.Description = dto.Description.Trim();
        property.PropertyType = dto.PropertyType;
        property.Region = dto.Region.Trim();
        property.City = dto.City.Trim();
        property.SubCity = dto.SubCity.Trim();
        property.Neighborhood = dto.Neighborhood.Trim();
        property.Landmark = dto.Landmark?.Trim();
        property.StreetAddress = dto.StreetAddress?.Trim();
        property.Latitude = dto.Latitude;
        property.Longitude = dto.Longitude;
        property.RentAmountETB = dto.RentAmountETB;
        property.DepositAmountETB = dto.DepositAmountETB;
        property.AdvanceMonthsRequired = dto.AdvanceMonthsRequired;
        property.MinimumLeaseMonths = dto.MinimumLeaseMonths;
        property.AvailableFromDate = dto.AvailableFromDate;
        property.Bedrooms = dto.Bedrooms;
        property.Bathrooms = dto.Bathrooms;
        property.AreaSquareMeters = dto.AreaSquareMeters;
        property.Furnishing = dto.Furnishing;
        property.HasWaterTank = dto.HasWaterTank;
        property.HasGenerator = dto.HasGenerator;
        property.HasSecurityGuard = dto.HasSecurityGuard;
        property.HasParking = dto.HasParking;
        property.HasElevator = dto.HasElevator;
        property.HasWifi = dto.HasWifi;
        property.HasBalcony = dto.HasBalcony;
        property.WaterBillIncluded = dto.WaterBillIncluded;
        property.ElectricityBillIncluded = dto.ElectricityBillIncluded;

        // Re-synchronise images if a new list is provided
        if (dto.ImageUrls.Any())
        {
            _context.PropertyImages.RemoveRange(property.Images);
            var order = 0;
            foreach (var imgUrl in dto.ImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)))
            {
                property.Images.Add(new PropertyImage
                {
                    PropertyId = property.Id,
                    ImageUrl = imgUrl,
                    IsPrimary = order == 0,
                    DisplayOrder = order++
                });
            }
        }

        if (dto.SubmitForReview)
        {
            if (wasPublished)
            {
                property.Status = PropertyStatus.PendingReview;
                property.RejectionReason = null;
                property.RejectionCategory = null;
            }
            else if (property.Status == PropertyStatus.Draft || property.Status == PropertyStatus.Rejected)
            {
                property.Status = PropertyStatus.PendingReview;
                property.RejectionReason = null;
                property.RejectionCategory = null;
            }
        }

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(currentUserId, "PropertyUpdated", "Property", property.Id.ToString(), property.Status.ToString());

        if (property.Status == PropertyStatus.PendingReview && (wasPublished || dto.SubmitForReview))
        {
            await NotifyAdminsOfPendingReviewAsync(property);
        }

        return Result<PropertyDto>.Success(MapToDto(property, true));
    }

    public async Task<Result<List<PropertySummaryDto>>> GetLandlordPropertiesAsync(string landlordId, PropertyStatus? status = null)
    {
        var agencyContext = await _agencyAccess.GetContextAsync(landlordId);

        var query = _context.Properties
            .Include(p => p.Images)
            .Include(p => p.Landlord)
            .Where(p => p.LandlordId == landlordId);

        // Agency managers and agents also see the listings of their agency.
        if (agencyContext != null)
        {
            var agencyId = agencyContext.AgencyId;
            query = _context.Properties
                .Include(p => p.Images)
                .Include(p => p.Landlord)
                .Where(p => p.LandlordId == landlordId || (p.AgencyId != null && p.AgencyId == agencyId));
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        var properties = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new PropertySummaryDto
            {
                Id = p.Id,
                Title = p.Title,
                PropertyType = p.PropertyType,
                Status = p.Status,
                Region = p.Region,
                City = p.City,
                SubCity = p.SubCity,
                Neighborhood = p.Neighborhood,
                Landmark = p.Landmark,
                RentAmountETB = p.RentAmountETB,
                DepositAmountETB = p.DepositAmountETB,
                AdvanceMonthsRequired = p.AdvanceMonthsRequired,
                Bedrooms = p.Bedrooms,
                Bathrooms = p.Bathrooms,
                AreaSquareMeters = p.AreaSquareMeters,
                Furnishing = p.Furnishing,
                HasWaterTank = p.HasWaterTank,
                HasGenerator = p.HasGenerator,
                HasSecurityGuard = p.HasSecurityGuard,
                HasParking = p.HasParking,
                HasElevator = p.HasElevator,
                PrimaryImageUrl = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                ImageUrls = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
                LandlordName = p.Landlord.FullName,
                CreatedAtUtc = p.CreatedAtUtc
            })
            .ToListAsync();

        return Result<List<PropertySummaryDto>>.Success(properties);
    }

    public async Task<Result<PropertyDto>> SubmitForReviewAsync(Guid id, string currentUserId)
    {
        var property = await _context.Properties
            .Include(p => p.Images)
            .Include(p => p.Landlord)
            .Include(p => p.Agency)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null) return Result<PropertyDto>.Failure("Property not found.");

        if (!await _agencyAccess.CanManagePropertyAsync(currentUserId, property))
        {
            return Result<PropertyDto>.Failure("Unauthorized.");
        }

        if (!PropertyStatusTransitions.CanTransition(property.Status, PropertyStatus.PendingReview))
        {
            return Result<PropertyDto>.Failure(PropertyStatusTransitions.Describe(property.Status, PropertyStatus.PendingReview));
        }

        property.Status = PropertyStatus.PendingReview;
        property.RejectionReason = null;
        property.RejectionCategory = null;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(currentUserId, "PropertySubmittedForReview", "Property", property.Id.ToString());
        await NotifyAdminsOfPendingReviewAsync(property);

        return Result<PropertyDto>.Success(MapToDto(property, true));
    }

    public async Task<Result<PropertyDto>> ToggleAvailabilityAsync(Guid id, string currentUserId)
    {
        var property = await _context.Properties
            .Include(p => p.Images)
            .Include(p => p.Landlord)
            .Include(p => p.Agency)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null) return Result<PropertyDto>.Failure("Property not found.");

        if (!await _agencyAccess.CanManagePropertyAsync(currentUserId, property))
        {
            return Result<PropertyDto>.Failure("Unauthorized.");
        }

        var target = property.Status == PropertyStatus.Published
            ? PropertyStatus.Unavailable
            : PropertyStatus.Published;

        if (!PropertyStatusTransitions.CanTransition(property.Status, target))
        {
            return Result<PropertyDto>.Failure($"Cannot toggle availability of a listing in state {property.Status}.");
        }

        property.Status = target;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(currentUserId, "PropertyAvailabilityChanged", "Property", property.Id.ToString(), target.ToString());

        return Result<PropertyDto>.Success(MapToDto(property, true));
    }

    public async Task<Result<PropertyDto>> MarkAsRentedAsync(Guid id, MarkAsRentedDto dto, string currentUserId)
    {
        var property = await _context.Properties
            .Include(p => p.Images)
            .Include(p => p.Landlord)
            .Include(p => p.Agency)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null) return Result<PropertyDto>.Failure("Property not found.");

        if (!await _agencyAccess.CanManagePropertyAsync(currentUserId, property))
        {
            return Result<PropertyDto>.Failure("Unauthorized.");
        }

        if (!PropertyStatusTransitions.CanTransition(property.Status, PropertyStatus.Rented))
        {
            return Result<PropertyDto>.Failure(PropertyStatusTransitions.Describe(property.Status, PropertyStatus.Rented));
        }

        property.Status = PropertyStatus.Rented;
        property.TenancyStartDateUtc = dto.TenancyStartDateUtc;
        property.AgreedRentAmountETB = dto.AgreedRentAmountETB;
        property.AgreedLeaseMonths = dto.AgreedLeaseMonths;
        property.RentedToTenantName = dto.TenantName;
        property.RentedToTenantId = dto.TenantId;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(currentUserId, "PropertyMarkedAsRented", "Property", property.Id.ToString(),
            $"Tenant: {dto.TenantName}");

        return Result<PropertyDto>.Success(MapToDto(property, true));
    }

    public async Task<Result<PropertyDto>> ArchivePropertyAsync(Guid id, string currentUserId, bool isAdmin = false)
    {
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);
        if (property == null) return Result<PropertyDto>.Failure("Property not found.");

        var canManage = await _agencyAccess.CanManagePropertyAsync(currentUserId, property);
        if (!canManage && !isAdmin) return Result<PropertyDto>.Failure("Unauthorized.");

        if (!PropertyStatusTransitions.CanTransition(property.Status, PropertyStatus.Archived))
        {
            return Result<PropertyDto>.Failure(PropertyStatusTransitions.Describe(property.Status, PropertyStatus.Archived));
        }

        property.Status = PropertyStatus.Archived;
        await _context.SaveChangesAsync();
        await _auditService.LogAsync(currentUserId, "PropertyArchived", "Property", property.Id.ToString());

        return await GetPropertyByIdAsync(id, currentUserId, isAdmin);
    }

    public async Task<Result<bool>> DeletePropertyAsync(Guid id, string currentUserId, bool isAdmin = false)
    {
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);
        if (property == null) return Result<bool>.Failure("Property not found.");

        var canManage = await _agencyAccess.CanManagePropertyAsync(currentUserId, property);
        if (!canManage && !isAdmin) return Result<bool>.Failure("Unauthorized.");

        property.IsDeleted = true;
        property.DeletedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(currentUserId, "PropertyDeleted", "Property", property.Id.ToString());

        return Result<bool>.Success(true);
    }

    private async Task NotifyAdminsOfPendingReviewAsync(Property property)
    {
        var admins = await _context.Users
            .Where(u => u.IsActive && u.IsRestricted == false)
            .ToListAsync();

        var adminIds = new List<string>();
        foreach (var admin in admins)
        {
            adminIds.Add(admin.Id);
        }

        var agencyAdmins = await _context.AgencyMemberships
            .Where(m => m.Role == AgencyStaffRole.AgencyManager && m.IsActive)
            .Select(m => m.UserId)
            .ToListAsync();

        var recipients = adminIds.Concat(agencyAdmins).Distinct().ToList();

        foreach (var recipient in recipients)
        {
            var isAgency = agencyAdmins.Contains(recipient);
            if (isAgency)
            {
                continue;
            }

            await _notificationService.CreateAsync(recipient, NotificationType.Listing,
                "New listing awaiting review",
                $"\"{property.Title}\" in {property.SubCity}, {property.City} was submitted for review.",
                "/admin/moderation");
        }
    }

    private static PropertyDto MapToDto(Property p, bool includeContact)
    {
        return new PropertyDto
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            PropertyType = p.PropertyType,
            Status = p.Status,
            Region = p.Region,
            City = p.City,
            SubCity = p.SubCity,
            Neighborhood = p.Neighborhood,
            Landmark = p.Landmark,
            StreetAddress = p.StreetAddress,
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            RentAmountETB = p.RentAmountETB,
            DepositAmountETB = p.DepositAmountETB,
            AdvanceMonthsRequired = p.AdvanceMonthsRequired,
            MinimumLeaseMonths = p.MinimumLeaseMonths,
            AvailableFromDate = p.AvailableFromDate,
            Bedrooms = p.Bedrooms,
            Bathrooms = p.Bathrooms,
            AreaSquareMeters = p.AreaSquareMeters,
            Furnishing = p.Furnishing,
            HasWaterTank = p.HasWaterTank,
            HasGenerator = p.HasGenerator,
            HasSecurityGuard = p.HasSecurityGuard,
            HasParking = p.HasParking,
            HasElevator = p.HasElevator,
            HasWifi = p.HasWifi,
            HasBalcony = p.HasBalcony,
            WaterBillIncluded = p.WaterBillIncluded,
            ElectricityBillIncluded = p.ElectricityBillIncluded,
            PrimaryImageUrl = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
            ImageUrls = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
            LandlordId = p.LandlordId,
            LandlordName = p.Landlord.FullName,
            LandlordPhone = includeContact ? (p.Landlord.PhoneNumber ?? string.Empty) : MaskPhone(p.Landlord.PhoneNumber),
            LandlordEmail = includeContact ? (p.Landlord.Email ?? string.Empty) : string.Empty,
            AgencyId = p.AgencyId,
            AgencyName = p.Agency?.Name,
            IsVerifiedHost = p.AgencyId != null,
            RejectionReason = p.RejectionReason,
            RejectionCategory = p.RejectionCategory,
            TenancyStartDateUtc = p.TenancyStartDateUtc,
            AgreedRentAmountETB = p.AgreedRentAmountETB,
            AgreedLeaseMonths = p.AgreedLeaseMonths,
            RentedToTenantName = p.RentedToTenantName,
            CreatedAtUtc = p.CreatedAtUtc
        };
    }

    private static string MaskPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return string.Empty;
        }

        var digits = phone.Where(char.IsDigit).ToArray();
        if (digits.Length < 4)
        {
            return "••••";
        }

        return $"••• {new string(digits[^4..])}";
    }
}
