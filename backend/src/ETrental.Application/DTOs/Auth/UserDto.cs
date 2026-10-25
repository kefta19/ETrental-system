namespace ETrental.Application.DTOs.Auth;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public IList<string> Roles { get; set; } = new List<string>();
    public Guid? AgencyId { get; set; }
    public string? AgencyName { get; set; }
    public string SubscriptionTier { get; set; } = "Free";
}
