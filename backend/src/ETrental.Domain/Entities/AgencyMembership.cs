using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class AgencyMembership : BaseEntity
{
    public Guid AgencyId { get; set; }
    public Agency Agency { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public AgencyStaffRole Role { get; set; } = AgencyStaffRole.Agent;
    public DateTime JoinedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
