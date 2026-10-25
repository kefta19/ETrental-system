using ETrental.Domain.Common;

namespace ETrental.Domain.Entities;

public class AgencyPropertyAssignment : BaseEntity
{
    public Guid AgencyId { get; set; }
    public Agency Agency { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;
    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;
}
