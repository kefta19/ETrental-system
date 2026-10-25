using System.ComponentModel.DataAnnotations;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Auth;

public class RegisterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; } = UserRole.Renter;

    // Optional Agency details if registering as an agency
    public string? AgencyName { get; set; }
    public string? TaxIdentificationNumber { get; set; }
    public string? BusinessLicenseNumber { get; set; }
    public string? City { get; set; }
    public string? SubCity { get; set; }
}
