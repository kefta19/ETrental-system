using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class ListingReview : BaseEntity
{
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;
    public string ReviewerId { get; set; } = string.Empty;
    public ApplicationUser? Reviewer { get; set; }
    public ListingDecision Decision { get; set; } = ListingDecision.Approved;
    public string? Reason { get; set; }
    public string? Category { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
