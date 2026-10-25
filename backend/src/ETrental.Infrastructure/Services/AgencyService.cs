using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Agencies;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class AgencyService : IAgencyService
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IAgencyAccessService _agencyAccess;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public AgencyService(
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IAgencyAccessService agencyAccess,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _agencyAccess = agencyAccess;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    private async Task<AgencyMembership?> GetMembershipAsync(string userId)
    {
        return await _context.AgencyMemberships
            .Include(m => m.Agency)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive);
    }

    private static AgencyDto MapAgency(Agency agency, int memberCount, int propertyCount)
    {
        return new AgencyDto
        {
            Id = agency.Id,
            Name = agency.Name,
            Description = agency.Description,
            LogoUrl = agency.LogoUrl,
            TaxIdentificationNumber = agency.TaxIdentificationNumber,
            BusinessLicenseNumber = agency.BusinessLicenseNumber,
            City = agency.City,
            SubCity = agency.SubCity,
            OfficeAddress = agency.OfficeAddress,
            OfficialPhone = agency.OfficialPhone,
            OfficialEmail = agency.OfficialEmail,
            Status = agency.Status,
            VerificationNotes = agency.VerificationNotes,
            RejectionReason = agency.RejectionReason,
            VerifiedAtUtc = agency.VerifiedAtUtc,
            SubmittedAtUtc = agency.SubmittedAtUtc,
            MemberCount = memberCount,
            PropertyCount = propertyCount
        };
    }

    public async Task<Result<AgencyDto>> GetMyAgencyAsync(string userId)
    {
        var membership = await GetMembershipAsync(userId);
        if (membership == null)
        {
            return Result<AgencyDto>.Failure("You are not a member of any agency.");
        }

        var memberCount = await _context.AgencyMemberships.CountAsync(m => m.AgencyId == membership.AgencyId && m.IsActive);
        var propertyCount = await _context.Properties.CountAsync(p => p.AgencyId == membership.AgencyId);

        return Result<AgencyDto>.Success(MapAgency(membership.Agency, memberCount, propertyCount));
    }

    public async Task<Result<AgencyDto>> GetAgencyByIdAsync(Guid agencyId, string requesterId)
    {
        var agency = await _context.Agencies.FirstOrDefaultAsync(a => a.Id == agencyId);
        if (agency == null)
        {
            return Result<AgencyDto>.Failure("Agency not found.");
        }

        if (!await _agencyAccess.BelongsToAgencyAsync(requesterId, agencyId))
        {
            return Result<AgencyDto>.Failure("You do not have permission to view this agency.");
        }

        var memberCount = await _context.AgencyMemberships.CountAsync(m => m.AgencyId == agencyId && m.IsActive);
        var propertyCount = await _context.Properties.CountAsync(p => p.AgencyId == agencyId);

        return Result<AgencyDto>.Success(MapAgency(agency, memberCount, propertyCount));
    }

    public async Task<Result<AgencyDto>> UpdateMyAgencyAsync(string userId, UpdateAgencyDto dto)
    {
        var membership = await GetMembershipAsync(userId);
        if (membership == null)
        {
            return Result<AgencyDto>.Failure("You are not a member of any agency.");
        }

        if (!membership.Role.Equals(AgencyStaffRole.AgencyManager))
        {
            return Result<AgencyDto>.Failure("Only an agency manager can update agency details.");
        }

        var agency = membership.Agency;
        agency.Name = dto.Name.Trim();
        agency.Description = dto.Description.Trim();
        agency.City = dto.City.Trim();
        agency.SubCity = dto.SubCity.Trim();
        agency.OfficeAddress = dto.OfficeAddress?.Trim();
        agency.OfficialPhone = dto.OfficialPhone.Trim();
        agency.OfficialEmail = dto.OfficialEmail.Trim();
        agency.LogoUrl = dto.LogoUrl?.Trim();

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(userId, "AgencyProfileUpdated", "Agency", agency.Id.ToString());

        var memberCount = await _context.AgencyMemberships.CountAsync(m => m.AgencyId == agency.Id && m.IsActive);
        var propertyCount = await _context.Properties.CountAsync(p => p.AgencyId == agency.Id);

        return Result<AgencyDto>.Success(MapAgency(agency, memberCount, propertyCount));
    }

    public async Task<Result<AgencyDto>> SubmitVerificationAsync(string userId)
    {
        var membership = await GetMembershipAsync(userId);
        if (membership == null)
        {
            return Result<AgencyDto>.Failure("You are not a member of any agency.");
        }

        if (!membership.Role.Equals(AgencyStaffRole.AgencyManager))
        {
            return Result<AgencyDto>.Failure("Only an agency manager can submit verification documents.");
        }

        var agency = membership.Agency;

        if (agency.Status == AgencyStatus.Verified)
        {
            return Result<AgencyDto>.Failure("This agency is already verified.");
        }

        agency.Status = AgencyStatus.Pending;
        agency.RejectionReason = null;
        agency.SubmittedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(userId, "AgencyVerificationSubmitted", "Agency", agency.Id.ToString());

        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        foreach (var admin in admins)
        {
            await _notificationService.CreateAsync(admin.Id, NotificationType.Agency,
                "Agency verification pending",
                $"{agency.Name} submitted verification documents for review.",
                "/admin/agencies");
        }

        var memberCount = await _context.AgencyMemberships.CountAsync(m => m.AgencyId == agency.Id && m.IsActive);
        var propertyCount = await _context.Properties.CountAsync(p => p.AgencyId == agency.Id);

        return Result<AgencyDto>.Success(MapAgency(agency, memberCount, propertyCount));
    }

    public async Task<Result<List<AgencyMemberDto>>> GetStaffAsync(string userId)
    {
        var membership = await GetMembershipAsync(userId);
        if (membership == null)
        {
            return Result<List<AgencyMemberDto>>.Failure("You are not a member of any agency.");
        }

        var members = await _context.AgencyMemberships
            .Include(m => m.User)
            .Where(m => m.AgencyId == membership.AgencyId)
            .OrderBy(m => m.Role)
            .ToListAsync();

        var assignmentCounts = await _context.AgencyPropertyAssignments
            .Where(a => a.AgencyId == membership.AgencyId)
            .GroupBy(a => a.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var dtos = members.Select(m => new AgencyMemberDto
        {
            MembershipId = m.Id,
            UserId = m.UserId,
            FullName = m.User.FullName,
            Email = m.User.Email ?? string.Empty,
            PhoneNumber = m.User.PhoneNumber,
            Role = m.Role,
            IsActive = m.IsActive,
            JoinedAtUtc = m.JoinedAtUtc,
            AssignedPropertyCount = assignmentCounts.TryGetValue(m.UserId, out var count) ? count : 0
        }).ToList();

        return Result<List<AgencyMemberDto>>.Success(dtos);
    }

    public async Task<Result<AgencyMemberDto>> InviteStaffAsync(string managerId, InviteStaffDto dto)
    {
        var membership = await GetMembershipAsync(managerId);
        if (membership == null || membership.Role != AgencyStaffRole.AgencyManager)
        {
            return Result<AgencyMemberDto>.Failure("Only an agency manager can invite staff.");
        }

        var agency = membership.Agency;
        var email = dto.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(agency.TaxIdentificationNumber) || agency.TaxIdentificationNumber == "0000000000")
        {
            return Result<AgencyMemberDto>.Failure("Add your agency tax identification and business licence numbers before inviting staff.");
        }

        var existingUser = await _userManager.FindByEmailAsync(email);
        string? temporaryPassword = null;

        if (existingUser == null)
        {
            var nameParts = dto.FullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            existingUser = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FirstName = nameParts.FirstOrDefault() ?? dto.FullName.Trim(),
                LastName = nameParts.Length > 1 ? nameParts[1] : string.Empty,
                PhoneNumber = dto.PhoneNumber,
                CreatedAtUtc = DateTime.UtcNow,
                IsActive = true,
                EmailConfirmed = true
            };

            temporaryPassword = GenerateTemporaryPassword();
            var createResult = await _userManager.CreateAsync(existingUser, temporaryPassword);
            if (!createResult.Succeeded)
            {
                return Result<AgencyMemberDto>.Failure(createResult.Errors.Select(e => e.Description).ToArray());
            }

            if (!await _roleManager.RoleExistsAsync("Agency"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Agency"));
            }

            await _userManager.AddToRoleAsync(existingUser, "Agency");
        }

        var existingMembership = await _context.AgencyMemberships
            .FirstOrDefaultAsync(m => m.UserId == existingUser!.Id);

        if (existingMembership != null)
        {
            if (existingMembership.AgencyId != agency.Id)
            {
                return Result<AgencyMemberDto>.Failure("This user already belongs to another agency.");
            }

            existingMembership.IsActive = true;
            existingMembership.Role = dto.Role;
        }
        else
        {
            _context.AgencyMemberships.Add(new AgencyMembership
            {
                AgencyId = agency.Id,
                UserId = existingUser.Id,
                Role = dto.Role,
                IsActive = true,
                JoinedAtUtc = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(managerId, "AgencyStaffInvited", "AgencyMembership", existingUser.Id, dto.Role.ToString());

        await _notificationService.CreateAsync(existingUser.Id, NotificationType.Agency,
            "You have been added to an agency",
            $"You are now a {dto.Role} at {agency.Name}.",
            "/agency");

        return Result<AgencyMemberDto>.Success(new AgencyMemberDto
        {
            MembershipId = existingMembership?.Id ?? Guid.Empty,
            UserId = existingUser.Id,
            FullName = existingUser.FullName,
            Email = existingUser.Email ?? email,
            PhoneNumber = existingUser.PhoneNumber,
            Role = dto.Role,
            IsActive = true,
            JoinedAtUtc = DateTime.UtcNow,
            TemporaryPassword = temporaryPassword
        });
    }

    public async Task<Result<bool>> UpdateStaffRoleAsync(string managerId, Guid membershipId, UpdateStaffRoleDto dto)
    {
        var managerMembership = await GetMembershipAsync(managerId);
        if (managerMembership == null || managerMembership.Role != AgencyStaffRole.AgencyManager)
        {
            return Result<bool>.Failure("Only an agency manager can change staff roles.");
        }

        var target = await _context.AgencyMemberships
            .FirstOrDefaultAsync(m => m.Id == membershipId && m.AgencyId == managerMembership.AgencyId);

        if (target == null)
        {
            return Result<bool>.Failure("Staff member not found in your agency.");
        }

        if (target.UserId == managerId)
        {
            return Result<bool>.Failure("You cannot change your own agency role.");
        }

        target.Role = dto.Role;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(managerId, "AgencyStaffRoleChanged", "AgencyMembership", target.Id.ToString(), dto.Role.ToString());
        await _notificationService.CreateAsync(target.UserId, NotificationType.Agency,
            "Your agency role changed",
            $"Your role at {managerMembership.Agency.Name} is now {dto.Role}.",
            "/agency");

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> DeactivateStaffAsync(string managerId, Guid membershipId)
    {
        var managerMembership = await GetMembershipAsync(managerId);
        if (managerMembership == null || managerMembership.Role != AgencyStaffRole.AgencyManager)
        {
            return Result<bool>.Failure("Only an agency manager can deactivate staff.");
        }

        var target = await _context.AgencyMemberships
            .FirstOrDefaultAsync(m => m.Id == membershipId && m.AgencyId == managerMembership.AgencyId);

        if (target == null)
        {
            return Result<bool>.Failure("Staff member not found in your agency.");
        }

        if (target.UserId == managerId)
        {
            return Result<bool>.Failure("You cannot deactivate your own account.");
        }

        target.IsActive = false;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(managerId, "AgencyStaffDeactivated", "AgencyMembership", target.Id.ToString());
        await _notificationService.CreateAsync(target.UserId, NotificationType.Agency,
            "Agency access removed",
            $"Your access to {managerMembership.Agency.Name} has been removed by an agency manager.",
            "/agency");

        return Result<bool>.Success(true);
    }

    public async Task<Result<List<Guid>>> GetAssignedPropertyIdsAsync(string userId)
    {
        var membership = await GetMembershipAsync(userId);
        if (membership == null)
        {
            return Result<List<Guid>>.Success(new List<Guid>());
        }

        var ids = await _context.AgencyPropertyAssignments
            .Where(a => a.AgencyId == membership.AgencyId && a.UserId == userId)
            .Select(a => a.PropertyId)
            .ToListAsync();

        return Result<List<Guid>>.Success(ids);
    }

    public async Task<Result<bool>> AssignStaffToPropertyAsync(string managerId, string staffUserId, Guid propertyId)
    {
        var managerMembership = await GetMembershipAsync(managerId);
        if (managerMembership == null || managerMembership.Role != AgencyStaffRole.AgencyManager)
        {
            return Result<bool>.Failure("Only an agency manager can assign staff to properties.");
        }

        var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == propertyId && !p.IsDeleted);
        if (property == null)
        {
            return Result<bool>.Failure("Property not found.");
        }

        if (property.AgencyId != managerMembership.AgencyId)
        {
            return Result<bool>.Failure("You can only assign staff to your own agency listings.");
        }

        var staffMembership = await _context.AgencyMemberships
            .FirstOrDefaultAsync(m => m.AgencyId == managerMembership.AgencyId && m.UserId == staffUserId && m.IsActive);

        if (staffMembership == null)
        {
            return Result<bool>.Failure("The selected user is not an active member of your agency.");
        }

        var exists = await _context.AgencyPropertyAssignments
            .AnyAsync(a => a.AgencyId == managerMembership.AgencyId && a.UserId == staffUserId && a.PropertyId == propertyId);

        if (exists)
        {
            return Result<bool>.Success(true);
        }

        _context.AgencyPropertyAssignments.Add(new AgencyPropertyAssignment
        {
            AgencyId = managerMembership.AgencyId,
            UserId = staffUserId,
            PropertyId = propertyId,
            AssignedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(managerId, "AgencyStaffAssignedToProperty", "Property", propertyId.ToString(), staffUserId);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> RemoveStaffFromPropertyAsync(string managerId, string staffUserId, Guid propertyId)
    {
        var managerMembership = await GetMembershipAsync(managerId);
        if (managerMembership == null || managerMembership.Role != AgencyStaffRole.AgencyManager)
        {
            return Result<bool>.Failure("Only an agency manager can remove staff assignments.");
        }

        var assignment = await _context.AgencyPropertyAssignments
            .FirstOrDefaultAsync(a => a.AgencyId == managerMembership.AgencyId && a.UserId == staffUserId && a.PropertyId == propertyId);

        if (assignment == null)
        {
            return Result<bool>.Success(true);
        }

        _context.AgencyPropertyAssignments.Remove(assignment);
        await _context.SaveChangesAsync();
        await _auditService.LogAsync(managerId, "AgencyStaffUnassignedFromProperty", "Property", propertyId.ToString(), staffUserId);

        return Result<bool>.Success(true);
    }

    public async Task<Result<AgencyReportDto>> GetAgencyReportAsync(string userId)
    {
        var membership = await GetMembershipAsync(userId);
        if (membership == null)
        {
            return Result<AgencyReportDto>.Failure("You are not a member of any agency.");
        }

        var agencyId = membership.AgencyId;

        var properties = await _context.Properties
            .Where(p => p.AgencyId == agencyId)
            .Select(p => p.Status)
            .ToListAsync();

        var inquiries = await _context.PropertyInquiries
            .Where(i => i.Property.AgencyId == agencyId)
            .Select(i => new { i.IsReadByLandlord })
            .ToListAsync();

        var applications = await _context.RentalApplications
            .Where(a => a.Property.AgencyId == agencyId)
            .Select(a => a.Status)
            .ToListAsync();

        var appointments = await _context.ViewingAppointments
            .Where(v => v.Property.AgencyId == agencyId)
            .Select(v => new { v.Status, v.RequestedDateTimeUtc })
            .ToListAsync();

        var activeStaff = await _context.AgencyMemberships.CountAsync(m => m.AgencyId == agencyId && m.IsActive);

        var activeSub = await _context.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.StartDateUtc)
            .FirstOrDefaultAsync();

        var now = DateTime.UtcNow;

        return Result<AgencyReportDto>.Success(new AgencyReportDto
        {
            TotalProperties = properties.Count,
            ActiveProperties = properties.Count(s => s == PropertyStatus.Published),
            PublishedProperties = properties.Count(s => s == PropertyStatus.Published),
            PendingReviewProperties = properties.Count(s => s == PropertyStatus.PendingReview),
            RejectedProperties = properties.Count(s => s == PropertyStatus.Rejected),
            RentedProperties = properties.Count(s => s == PropertyStatus.Rented),
            UnavailableProperties = properties.Count(s => s == PropertyStatus.Unavailable),
            TotalInquiries = inquiries.Count,
            UnreadInquiries = inquiries.Count(i => !i.IsReadByLandlord),
            TotalApplications = applications.Count,
            PendingApplications = applications.Count(s => s == ApplicationStatus.Submitted || s == ApplicationStatus.UnderReview),
            TotalAppointments = appointments.Count,
            UpcomingAppointments = appointments.Count(a => a.Status == AppointmentStatus.Confirmed && a.RequestedDateTimeUtc >= now),
            ActiveStaff = activeStaff,
            SubscriptionTier = activeSub?.Plan.Name ?? "Free"
        });
    }

    private static string GenerateTemporaryPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        var random = new Random();
        return $"Et{new string(Enumerable.Range(0, 10).Select(_ => chars[random.Next(chars.Length)]).ToArray())}!";
    }
}
