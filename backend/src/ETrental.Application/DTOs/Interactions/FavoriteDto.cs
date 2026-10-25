using System.ComponentModel.DataAnnotations;
using ETrental.Application.DTOs.Properties;

namespace ETrental.Application.DTOs.Interactions;

public class FavoriteDto
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public PropertySummaryDto Property { get; set; } = null!;
}

public class SavedSearchDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? SubCity { get; set; }
    public decimal? MinPriceETB { get; set; }
    public decimal? MaxPriceETB { get; set; }
    public int? MinBedrooms { get; set; }
    public string? PropertyType { get; set; }
    public bool AlertEmailEnabled { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateSavedSearchDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? SubCity { get; set; }
    public decimal? MinPriceETB { get; set; }
    public decimal? MaxPriceETB { get; set; }
    public int? MinBedrooms { get; set; }
    public string? PropertyType { get; set; }
    public bool AlertEmailEnabled { get; set; } = true;
}
