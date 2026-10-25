using ETrental.Domain.Common;

namespace ETrental.Domain.Entities;

public class SavedSearch : AuditableEntity
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? SubCity { get; set; }
    public decimal? MinPriceETB { get; set; }
    public decimal? MaxPriceETB { get; set; }
    public int? MinBedrooms { get; set; }
    public string? PropertyType { get; set; }
    public bool AlertEmailEnabled { get; set; } = true;
    public DateTime? LastNotifiedAtUtc { get; set; }
}
