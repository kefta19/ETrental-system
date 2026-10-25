using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Moderation;
using ETrental.Application.DTOs.Properties;

namespace ETrental.Application.Interfaces;

public interface IModerationService
{
    Task<Result<PaginatedResult<PropertySummaryDto>>> GetPendingListingsAsync(int page = 1, int pageSize = 12);
    Task<Result<PropertyDto>> ModerateListingAsync(Guid id, ModerationDecisionDto decision, string adminId);
    Task<Result<bool>> UnpublishListingAsync(Guid id, string reason, string adminId);
}
