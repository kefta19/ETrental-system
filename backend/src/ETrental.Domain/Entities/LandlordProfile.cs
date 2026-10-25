using ETrental.Domain.Common;

namespace ETrental.Domain.Entities;

public class LandlordProfile : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string? NationalIdNumber { get; set; }
    public bool IsIdentityVerified { get; set; } = false;
    public string? PreferredContactMethod { get; set; } = "InApp"; // InApp, Phone, Email
    public double AverageResponseMinutes { get; set; } = 60;
}
