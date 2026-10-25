using ETrental.Domain.Common;

namespace ETrental.Domain.Entities;

public class PropertyInquiry : AuditableEntity
{
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;
    public string RenterId { get; set; } = string.Empty;
    public ApplicationUser Renter { get; set; } = null!;
    public string InitialMessage { get; set; } = string.Empty;
    public string? LandlordReply { get; set; }
    public DateTime? RepliedAtUtc { get; set; }
    public bool IsReadByLandlord { get; set; } = false;
    public bool IsReadByRenter { get; set; } = true;
}
