using System.ComponentModel.DataAnnotations;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Auth;

public class GoogleAuthDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? PhotoUrl { get; set; }

    public string? IdToken { get; set; }

    public UserRole Role { get; set; } = UserRole.Renter;
}
