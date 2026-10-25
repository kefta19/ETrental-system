namespace ETrental.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserEmail { get; }
    string? Role { get; }
    Guid? AgencyId { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin { get; }
}
