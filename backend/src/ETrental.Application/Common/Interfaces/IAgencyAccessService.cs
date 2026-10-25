using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Application.Common.Interfaces;

public class AgencyContext
{
    public Guid AgencyId { get; init; }
    public string UserId { get; init; } = string.Empty;
    public AgencyStaffRole Role { get; init; } = AgencyStaffRole.Agent;
    public bool IsManager => Role == AgencyStaffRole.AgencyManager;
    public bool CanEditListings => Role is AgencyStaffRole.AgencyManager or AgencyStaffRole.Agent;
}

/// <summary>
/// Centralises agency tenant isolation rules so every service enforces the same
/// "is this user allowed to touch this property / agency record?" question.
/// </summary>
public interface IAgencyAccessService
{
    Task<AgencyContext?> GetContextAsync(string userId);
    Task<bool> CanManagePropertyAsync(string userId, Property property);
    Task<bool> CanAccessPropertyAsync(string userId, Property property);
    Task<bool> IsAgencyManagerAsync(string userId, Guid? agencyId = null);
    Task<bool> BelongsToAgencyAsync(string userId, Guid agencyId);
}
