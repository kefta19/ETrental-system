using ETrental.Domain.Common;

namespace ETrental.Domain.Entities;

public class RenterProfile : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string? PreferredCity { get; set; }
    public string? PreferredSubCity { get; set; }
    public decimal? MaxBudgetETB { get; set; }
    public string? Occupation { get; set; }
    public bool IsVerifiedRenter { get; set; } = false;
}
