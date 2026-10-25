using ETrental.Domain.Entities;

namespace ETrental.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime Expiration) GenerateToken(ApplicationUser user, IList<string> roles, Guid? agencyId = null);
    string GenerateRefreshToken();
}