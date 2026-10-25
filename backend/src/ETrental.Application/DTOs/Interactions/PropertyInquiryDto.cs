using System.ComponentModel.DataAnnotations;
using ETrental.Application.DTOs.Properties;

namespace ETrental.Application.DTOs.Interactions;

public class PropertyInquiryDto
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public PropertySummaryDto? Property { get; set; }
    public string RenterId { get; set; } = string.Empty;
    public string RenterName { get; set; } = string.Empty;
    public string? RenterEmail { get; set; }
    public string? RenterPhone { get; set; }
    public string InitialMessage { get; set; } = string.Empty;
    public string? LandlordReply { get; set; }
    public DateTime? RepliedAtUtc { get; set; }
    public bool IsReadByLandlord { get; set; }
    public bool IsReadByRenter { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateInquiryDto
{
    [Required]
    public Guid PropertyId { get; set; }

    [Required]
    [StringLength(1500, MinimumLength = 5, ErrorMessage = "Inquiry message must be between 5 and 1500 characters")]
    public string Message { get; set; } = string.Empty;
}

public class ReplyInquiryDto
{
    [Required]
    [StringLength(1500, MinimumLength = 2, ErrorMessage = "Reply must be between 2 and 1500 characters")]
    public string Reply { get; set; } = string.Empty;
}
