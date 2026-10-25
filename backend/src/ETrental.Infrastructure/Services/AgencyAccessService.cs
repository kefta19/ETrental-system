using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Domain.Entities;

namespace ETrental.Infrastructure.Services;

public class AgencyAccessService : IAgencyAccessService
{
    private readonly IApplicationDbContext _context;

    public AgencyAccessService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AgencyContext?> GetContextAsync(string userId)
    {
        var membership = await _context.AgencyMemberships
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive);

        if (membership == null)
        {
            return null;
        }

        return new AgencyContext
        {
            AgencyId = membership.AgencyId,
            UserId = userId,
            Role = membership.Role
        };
    }

    public async Task<bool> CanManagePropertyAsync(string userId, Property property)
    {
        // Direct owner of the listing always has full control over it.
        if (property.LandlordId == userId)
        {
            return true;
        }

        // An agent explicitly assigned to the listing may manage it.
        if (!string.IsNullOrEmpty(property.AssignedAgentId) && property.AssignedAgentId == userId)
        {
            return true;
        }

        var context = await GetContextAsync(userId);
        if (context == null || !context.CanEditListings)
        {
            return false;
        }

        if (property.AgencyId != context.AgencyId)
        {
            return false;
        }

        // Managers can act on every listing of their agency.
        if (context.IsManager)
        {
            return true;
        }

        // Agents may act on agency listings that are assigned to them, or on any
        // agency listing when they are the only active agent of that agency.
        var hasExplicitAssignment = await _context.AgencyPropertyAssignments
            .AsNoTracking()
            .AnyAsync(a => a.AgencyId == context.AgencyId && a.UserId == userId && a.PropertyId == property.Id);

        if (hasExplicitAssignment)
        {
            return true;
        }

        var assignedAgentIds = await _context.AgencyPropertyAssignments
            .AsNoTracking()
            .Where(a => a.AgencyId == context.AgencyId && a.PropertyId == property.Id)
            .Select(a => a.UserId)
            .ToListAsync();

        if (assignedAgentIds.Count == 0)
        {
            return true;
        }

        return assignedAgentIds.Contains(userId);
    }

    public async Task<bool> CanAccessPropertyAsync(string userId, Property property)
    {
        if (property.LandlordId == userId)
        {
            return true;
        }

        if (!string.IsNullOrEmpty(property.AssignedAgentId) && property.AssignedAgentId == userId)
        {
            return true;
        }

        var context = await GetContextAsync(userId);
        if (context == null)
        {
            return false;
        }

        if (property.AgencyId != context.AgencyId)
        {
            return false;
        }

        var hasExplicitAssignment = await _context.AgencyPropertyAssignments
            .AsNoTracking()
            .AnyAsync(a => a.AgencyId == context.AgencyId && a.UserId == userId && a.PropertyId == property.Id);

        return hasExplicitAssignment || context.IsManager;
    }

    public async Task<bool> IsAgencyManagerAsync(string userId, Guid? agencyId = null)
    {
        var context = await GetContextAsync(userId);
        if (context == null || !context.IsManager)
        {
            return false;
        }

        return agencyId == null || context.AgencyId == agencyId;
    }

    public async Task<bool> BelongsToAgencyAsync(string userId, Guid agencyId)
    {
        var context = await GetContextAsync(userId);
        return context != null && context.AgencyId == agencyId;
    }
}
