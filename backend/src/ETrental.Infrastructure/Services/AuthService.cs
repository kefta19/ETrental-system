using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Auth;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IApplicationDbContext _context;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IJwtTokenGenerator jwtTokenGenerator,
        IApplicationDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtTokenGenerator = jwtTokenGenerator;
        _context = context;
    }

    public async Task<Result<AuthResponseDto>> RegisterAsync(RegisterDto dto)
    {
        if (dto.Role is not (UserRole.Renter or UserRole.Landlord))
        {
            return Result<AuthResponseDto>.Failure("Only renter and landlord accounts can be self-registered.");
        }

        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return Result<AuthResponseDto>.Failure("An account with this email address already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            CreatedAtUtc = DateTime.UtcNow,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return Result<AuthResponseDto>.Failure(result.Errors.Select(e => e.Description));
        }

        var roleName = dto.Role.ToString();
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new IdentityRole(roleName));
        }

        await _userManager.AddToRoleAsync(user, roleName);

        // Role-specific profile initialization
        if (dto.Role == UserRole.Renter)
        {
            var renterProfile = new RenterProfile
            {
                UserId = user.Id,
                PreferredCity = dto.City ?? "Addis Ababa"
            };
            _context.RenterProfiles.Add(renterProfile);
        }
        else if (dto.Role == UserRole.Landlord)
        {
            var landlordProfile = new LandlordProfile
            {
                UserId = user.Id
            };
            _context.LandlordProfiles.Add(landlordProfile);
        }
        // Attach Free tier subscription by default
        var freePlan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Tier == SubscriptionTier.Free);
        if (freePlan != null)
        {
            var subscription = new Subscription
            {
                UserId = user.Id,
                PlanId = freePlan.Id,
                Status = SubscriptionStatus.Active,
                StartDateUtc = DateTime.UtcNow
            };
            _context.Subscriptions.Add(subscription);
        }

        await _context.SaveChangesAsync();

        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiration) = _jwtTokenGenerator.GenerateToken(user, roles);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return Result<AuthResponseDto>.Success(new AuthResponseDto
        {
            Token = token,
            Expiration = expiration,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                Roles = roles,
                SubscriptionTier = "Free"
            }
        });
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return Result<AuthResponseDto>.Failure("Invalid email or password credentials.");
        }

        if (!user.IsActive)
        {
            return Result<AuthResponseDto>.Failure("Your account has been deactivated. Please contact support.");
        }

        var roles = await _userManager.GetRolesAsync(user);

        var activeSub = await _context.Subscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.UserId == user.Id && s.Status == SubscriptionStatus.Active);

        var (token, expiration) = _jwtTokenGenerator.GenerateToken(user, roles);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(7);
        user.LastLoginAtUtc = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Result<AuthResponseDto>.Success(new AuthResponseDto
        {
            Token = token,
            Expiration = expiration,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                ProfilePictureUrl = user.ProfilePictureUrl,
                Roles = roles,
                SubscriptionTier = activeSub?.Plan.Name ?? "Free"
            }
        });
    }

    public async Task<Result<AuthResponseDto>> GoogleAuthAsync(GoogleAuthDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return Result<AuthResponseDto>.Failure("Email is required for Google authentication.");
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(normalizedEmail);

        if (user != null)
        {
            if (!user.IsActive)
            {
                return Result<AuthResponseDto>.Failure("Your account has been deactivated. Please contact support.");
            }

            if (!string.IsNullOrWhiteSpace(dto.PhotoUrl))
            {
                user.ProfilePictureUrl = dto.PhotoUrl;
            }
        }
        else
        {
            var role = dto.Role is UserRole.Landlord ? UserRole.Landlord : UserRole.Renter;
            var firstName = string.IsNullOrWhiteSpace(dto.FirstName) ? normalizedEmail.Split('@')[0] : dto.FirstName.Trim();
            var lastName = dto.LastName?.Trim() ?? string.Empty;

            user = new ApplicationUser
            {
                UserName = normalizedEmail,
                Email = normalizedEmail,
                EmailConfirmed = true,
                FirstName = firstName,
                LastName = lastName,
                PhoneNumber = string.Empty,
                ProfilePictureUrl = dto.PhotoUrl,
                CreatedAtUtc = DateTime.UtcNow,
                IsActive = true
            };

            var randomPassword = $"G!{Guid.NewGuid():N}#9";
            var createResult = await _userManager.CreateAsync(user, randomPassword);
            if (!createResult.Succeeded)
            {
                return Result<AuthResponseDto>.Failure(createResult.Errors.Select(e => e.Description));
            }

            var roleName = role.ToString();
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new IdentityRole(roleName));
            }
            await _userManager.AddToRoleAsync(user, roleName);

            if (role == UserRole.Renter)
            {
                _context.RenterProfiles.Add(new RenterProfile
                {
                    UserId = user.Id,
                    PreferredCity = "Addis Ababa"
                });
            }
            else
            {
                _context.LandlordProfiles.Add(new LandlordProfile
                {
                    UserId = user.Id
                });
            }

            var freePlan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Tier == SubscriptionTier.Free);
            if (freePlan != null)
            {
                _context.Subscriptions.Add(new Subscription
                {
                    UserId = user.Id,
                    PlanId = freePlan.Id,
                    Status = SubscriptionStatus.Active,
                    StartDateUtc = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
        }

        var roles = await _userManager.GetRolesAsync(user);
        var activeSub = await _context.Subscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.UserId == user.Id && s.Status == SubscriptionStatus.Active);

        var (token, expiration) = _jwtTokenGenerator.GenerateToken(user, roles);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(7);
        user.LastLoginAtUtc = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Result<AuthResponseDto>.Success(new AuthResponseDto
        {
            Token = token,
            Expiration = expiration,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                ProfilePictureUrl = user.ProfilePictureUrl,
                Roles = roles,
                SubscriptionTier = activeSub?.Plan.Name ?? "Free"
            }
        });
    }

    public async Task<Result<AuthResponseDto>> RefreshTokenAsync(string token, string refreshToken)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
        if (user == null || user.RefreshTokenExpiryTimeUtc <= DateTime.UtcNow)
        {
            return Result<AuthResponseDto>.Failure("Invalid or expired refresh token.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var (newToken, expiration) = _jwtTokenGenerator.GenerateToken(user, roles);
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var activeSub = await _context.Subscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.UserId == user.Id && s.Status == SubscriptionStatus.Active);

        return Result<AuthResponseDto>.Success(new AuthResponseDto
        {
            Token = newToken,
            Expiration = expiration,
            RefreshToken = newRefreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                Roles = roles,
                SubscriptionTier = activeSub?.Plan.Name ?? "Free"
            }
        });
    }

    public async Task<Result<UserDto>> GetCurrentUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return Result<UserDto>.Failure("User not found.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var activeSub = await _context.Subscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.UserId == user.Id && s.Status == SubscriptionStatus.Active);

        return Result<UserDto>.Success(new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Roles = roles,
            SubscriptionTier = activeSub?.Plan.Name ?? "Free"
        });
    }
}
