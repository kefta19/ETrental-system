using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Properties;
using ETrental.Domain.Enums;

namespace ETrental.Application.Interfaces;

public interface IPropertyService
{
    Task<Result<PaginatedResult<PropertySummaryDto>>> SearchPropertiesAsync(PropertyFilterDto filter);
    Task<Result<PropertyDto>> GetPropertyByIdAsync(Guid id, string? currentUserId = null, bool isAdmin = false);
    Task<Result<PropertyDto>> CreatePropertyAsync(CreatePropertyDto dto, string landlordId, Guid? agencyId = null);
    Task<Result<PropertyDto>> UpdatePropertyAsync(Guid id, UpdatePropertyDto dto, string currentUserId, bool isAdmin = false);
    Task<Result<List<PropertySummaryDto>>> GetLandlordPropertiesAsync(string landlordId, PropertyStatus? status = null);
    Task<Result<PropertyDto>> SubmitForReviewAsync(Guid id, string currentUserId);
    Task<Result<PropertyDto>> ToggleAvailabilityAsync(Guid id, string currentUserId);
    Task<Result<PropertyDto>> MarkAsRentedAsync(Guid id, MarkAsRentedDto dto, string currentUserId);
    Task<Result<PropertyDto>> ArchivePropertyAsync(Guid id, string currentUserId, bool isAdmin = false);
    Task<Result<bool>> DeletePropertyAsync(Guid id, string currentUserId, bool isAdmin = false);
}
