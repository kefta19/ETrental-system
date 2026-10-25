using System.ComponentModel.DataAnnotations;

namespace ETrental.Application.DTOs.Properties;

public class MarkAsRentedDto
{
    [Required]
    public string TenantName { get; set; } = string.Empty;
    
    public string? TenantId { get; set; }
    
    [Required]
    [Range(100, 5000000, ErrorMessage = "Agreed rent must be a valid amount in ETB")]
    public decimal AgreedRentAmountETB { get; set; }
    
    [Range(1, 60, ErrorMessage = "Lease duration must be between 1 and 60 months")]
    public int AgreedLeaseMonths { get; set; } = 12;
    
    public DateTime TenancyStartDateUtc { get; set; } = DateTime.UtcNow;
}
