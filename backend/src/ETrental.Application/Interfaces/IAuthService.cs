using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Auth;

namespace ETrental.Application.Interfaces;

public interface IAuthService
{
    Task<Result<AuthResponseDto>> RegisterAsync(RegisterDto dto);
    Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<Result<AuthResponseDto>> RefreshTokenAsync(string token, string refreshToken);
    Task<Result<UserDto>> GetCurrentUserAsync(string userId);
}
