using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Moderation;
using ETrental.Application.DTOs.Properties;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class ModerationService : IModerationService
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public ModerationService(
        IApplicationDbContext context,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _context = context;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    public async Task<Result<PaginatedResult<PropertySummaryDto>>> GetPendingListingsAsync(int page = 1, int pageSize = 12)
    {
        var query = _context.Properties
            .Include(p => p.Images)
            .Include(p => p.Landlord)
            .Where(p => p.Status == PropertyStatus.PendingReview)
            .OrderByDescending(p => p.CreatedAtUtc);

        var totalCount = await query.CountAsync();
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 12 : pageSize;

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

    public async Task<Result<PropertyDto>> ModerateListingAsync(Guid id, ModerationDecisionDto decision, string adminId)
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

        if (property.Status != PropertyStatus.PendingReview)
        {
            return Result<PropertyDto>.Failure($"Property is not awaiting review. Current status: {property.Status}");
        }

        var previousStatus = property.Status;

        if (decision.RequestCorrection)
        {
            if (string.IsNullOrWhiteSpace(decision.Reason))
            {
                return Result<PropertyDto>.Failure("Explain what the owner must correct.");
            }

            property.Status = PropertyStatus.Draft;
            property.RejectionCategory = decision.RejectionCategory ?? "CorrectionRequired";
            property.RejectionReason = decision.Reason;
        }
        else if (decision.Approved)
        {
            property.Status = PropertyStatus.Published;
            property.RejectionReason = null;
            property.RejectionCategory = null;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(decision.Reason))
            {
                return Result<PropertyDto>.Failure("A rejection reason must be recorded.");
            }

            property.Status = PropertyStatus.Rejected;
            property.RejectionCategory = decision.RejectionCategory ?? "QualityStandardsNotMet";
            property.RejectionReason = decision.Reason;
        }

        property.ModeratedAtUtc = DateTime.UtcNow;
        property.ModeratedBy = adminId;

        _context.ListingReviews.Add(new ListingReview
        {
            PropertyId = property.Id,
            ReviewerId = adminId,
            Decision = decision.RequestCorrection
                ? ListingDecision.CorrectionRequested
                : decision.Approved ? ListingDecision.Approved : ListingDecision.Rejected,
            Reason = decision.Reason,
            Category = decision.RejectionCategory,
            CreatedAtUtc = DateTime.UtcNow
        });

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            Action = decision.RequestCorrection
                ? "ListingCorrectionRequested"
                : decision.Approved ? "ListingApproved" : "ListingRejected",
            EntityName = "Property",
            EntityId = property.Id.ToString(),
            Reason = decision.Reason ?? (decision.Approved ? "Approved by Admin" : "Rejected by Admin"),
            OldValues = previousStatus.ToString(),
            NewValues = property.Status.ToString()
        });

        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(property.LandlordId, NotificationType.Listing,
            decision.RequestCorrection ? "Listing needs corrections" : decision.Approved ? "Listing approved" : "Listing rejected",
            decision.Approved
                ? $"\"{property.Title}\" is now published and visible to renters."
                : $"\"{property.Title}\" needs attention. Reason: {property.RejectionReason}",
            "/landlord/my-properties");

        return Result<PropertyDto>.Success(new PropertyDto
        {
            Id = property.Id,
            Title = property.Title,
            Description = property.Description,
            PropertyType = property.PropertyType,
            Status = property.Status,
            Region = property.Region,
            City = property.City,
            SubCity = property.SubCity,
            Neighborhood = property.Neighborhood,
            Landmark = property.Landmark,
            RentAmountETB = property.RentAmountETB,
            DepositAmountETB = property.DepositAmountETB,
            AdvanceMonthsRequired = property.AdvanceMonthsRequired,
            Bedrooms = property.Bedrooms,
            Bathrooms = property.Bathrooms,
            AreaSquareMeters = property.AreaSquareMeters,
            Furnishing = property.Furnishing,
            HasWaterTank = property.HasWaterTank,
            HasGenerator = property.HasGenerator,
            HasSecurityGuard = property.HasSecurityGuard,
            HasParking = property.HasParking,
            HasElevator = property.HasElevator,
            HasWifi = property.HasWifi,
            HasBalcony = property.HasBalcony,
            PrimaryImageUrl = property.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
            ImageUrls = property.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
            LandlordId = property.LandlordId,
            LandlordName = property.Landlord.FullName,
            LandlordPhone = property.Landlord.PhoneNumber ?? string.Empty,
            LandlordEmail = property.Landlord.Email ?? string.Empty,
            AgencyId = property.AgencyId,
            AgencyName = property.Agency?.Name,
            RejectionReason = property.RejectionReason,
            RejectionCategory = property.RejectionCategory,
            CreatedAtUtc = property.CreatedAtUtc
        });
    }

    public async Task<Result<bool>> UnpublishListingAsync(Guid id, string reason, string adminId)
    {
        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);
        if (property == null)
        {
            return Result<bool>.Failure("Property listing not found.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            return Result<bool>.Failure("A reason is required to unpublish a listing.");
        }

        if (property.Status == PropertyStatus.Rented || property.Status == PropertyStatus.Archived)
        {
            return Result<bool>.Failure($"A listing in state {property.Status} cannot be unpublished.");
        }

        var previousStatus = property.Status;
        property.Status = PropertyStatus.Unavailable;
        property.RejectionReason = reason;
        property.RejectionCategory = "PolicyViolation";
        property.ModeratedAtUtc = DateTime.UtcNow;
        property.ModeratedBy = adminId;

        _context.ListingReviews.Add(new ListingReview
        {
            PropertyId = property.Id,
            ReviewerId = adminId,
            Decision = ListingDecision.Unpublished,
            Reason = reason,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(adminId, "ListingUnpublished", "Property", property.Id.ToString(), reason,
            previousStatus.ToString(), property.Status.ToString());

        await _notificationService.CreateAsync(property.LandlordId, NotificationType.Listing,
            "Listing unpublished",
            $"\"{property.Title}\" was unpublished by the platform team. Reason: {reason}",
            "/landlord/my-properties");

        return Result<bool>.Success(true);
    }
}
