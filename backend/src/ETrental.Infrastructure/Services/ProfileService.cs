using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Auth;
using ETrental.Application.DTOs.Profile;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class ProfileService : IProfileService
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public ProfileService(
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _context = context;
        _userManager = userManager;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    private async Task<UserDto> BuildUserDtoAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var membership = await _context.AgencyMemberships
            .Include(m => m.Agency)
            .FirstOrDefaultAsync(m => m.UserId == user.Id && m.IsActive);

        var activeSub = await _context.Subscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.UserId == user.Id && s.Status == SubscriptionStatus.Active);

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Roles = roles.ToList(),
            AgencyId = membership?.AgencyId,
            AgencyName = membership?.Agency.Name,
            SubscriptionTier = activeSub?.Plan.Name ?? "Free"
        };
    }

    public async Task<Result<UserDto>> GetProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return Result<UserDto>.Failure("User not found.");
        }

        return Result<UserDto>.Success(await BuildUserDtoAsync(user));
    }

    public async Task<Result<UserDto>> UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return Result<UserDto>.Failure("User not found.");
        }

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();

        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            user.PhoneNumber = dto.PhoneNumber.Trim();
            user.PhoneNumberConfirmed = false;
        }

        if (dto.ProfilePictureUrl != null)
        {
            user.ProfilePictureUrl = dto.ProfilePictureUrl.Trim();
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return Result<UserDto>.Failure(result.Errors.Select(e => e.Description).ToArray());
        }

        await _auditService.LogAsync(userId, "ProfileUpdated", "ApplicationUser", userId);

        return Result<UserDto>.Success(await BuildUserDtoAsync(user));
    }

    public async Task<Result<bool>> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return Result<bool>.Failure("User not found.");
        }

        var check = await _userManager.CheckPasswordAsync(user, dto.CurrentPassword);
        if (!check)
        {
            return Result<bool>.Failure("Your current password is not correct.");
        }

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
        {
            return Result<bool>.Failure(result.Errors.Select(e => e.Description).ToArray());
        }

        // Force a new session after a password change.
        user.RefreshToken = null;
        user.RefreshTokenExpiryTimeUtc = null;
        await _userManager.UpdateAsync(user);

        await _auditService.LogAsync(userId, "PasswordChanged", "ApplicationUser", userId);
        await _notificationService.CreateAsync(userId, NotificationType.Security,
            "Your password was changed",
            "Your ETrental password was changed successfully. If this was not you, contact support immediately.",
            "/profile");

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> RequestPasswordResetAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email.Trim());

        // Always report success so the endpoint cannot be used to discover accounts.
        if (user == null)
        {
            return Result<bool>.Success(true);
        }

        var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            Token = token,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(30),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(user.Id, "PasswordResetRequested", "ApplicationUser", user.Id);

        await _notificationService.CreateAsync(user.Id, NotificationType.Security,
            "Password reset requested",
            "A password reset was requested for your account. Use the reset token within 30 minutes to set a new password.",
            "/login");

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var resetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == dto.Token && !t.IsUsed);

        if (resetToken == null || resetToken.ExpiresAtUtc <= DateTime.UtcNow)
        {
            return Result<bool>.Failure("This reset link is invalid or has expired.");
        }

        var user = await _userManager.FindByIdAsync(resetToken.UserId);
        if (user == null)
        {
            return Result<bool>.Failure("This reset link is invalid or has expired.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

        if (!result.Succeeded)
        {
            return Result<bool>.Failure(result.Errors.Select(e => e.Description).ToArray());
        }

        resetToken.IsUsed = true;
        resetToken.UsedAtUtc = DateTime.UtcNow;

        user.RefreshToken = null;
        user.RefreshTokenExpiryTimeUtc = null;
        await _userManager.UpdateAsync(user);

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(user.Id, "PasswordResetCompleted", "ApplicationUser", user.Id);

        return Result<bool>.Success(true);
    }
}
