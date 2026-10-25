using System.ComponentModel.DataAnnotations;

namespace ETrental.Application.DTOs.Moderation;

public class ModerationDecisionDto
{
    [Required]
    public bool Approved { get; set; }

    /// <summary>When true the listing returns to the owner as a draft with the given reason.</summary>
    public bool RequestCorrection { get; set; }

    public string? RejectionCategory { get; set; } // UnrealisticPricing, SubstandardPhotos, MisleadingLocation, DuplicateListing, Other

    public string? Reason { get; set; }
}
