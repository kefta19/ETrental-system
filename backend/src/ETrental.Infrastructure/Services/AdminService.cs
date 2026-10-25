using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Admin;
using ETrental.Application.DTOs.Agencies;
using ETrental.Application.DTOs.Properties;
using ETrental.Application.DTOs.Subscriptions;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    private static readonly string[] AllRoles = { "Renter", "Landlord", "Agency", "Support", "Admin" };

    public AdminService(
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

    private async Task<Dictionary<string, List<string>>> GetRoleMapAsync()
    {
        var map = new Dictionary<string, List<string>>();
        foreach (var role in AllRoles)
        {
            var users = await _userManager.GetUsersInRoleAsync(role);
            foreach (var user in users)
            {
                if (!map.TryGetValue(user.Id, out var roles))
                {
                    roles = new List<string>();
                    map[user.Id] = roles;
                }
                roles.Add(role);
            }
        }
        return map;
    }

    public async Task<Result<AdminDashboardDto>> GetDashboardAsync()
    {
        var roleMap = await GetRoleMapAsync();

        var users = await _context.Users.AsNoTracking().ToListAsync();

        var properties = await _context.Properties.AsNoTracking().Select(p => p.Status).ToListAsync();
        var agencies = await _context.Agencies.AsNoTracking().ToListAsync();

        var dashboard = new AdminDashboardDto
        {
            TotalUsers = users.Count,
            ActiveUsers = users.Count(u => u.IsActive && !u.IsRestricted),
            RestrictedUsers = users.Count(u => u.IsRestricted),
            TotalRenters = roleMap.Values.Count(r => r.Contains("Renter")),
            TotalLandlords = roleMap.Values.Count(r => r.Contains("Landlord")),
            TotalAgencies = roleMap.Values.Count(r => r.Contains("Agency")),
            TotalSupportAgents = roleMap.Values.Count(r => r.Contains("Support")),
            TotalProperties = properties.Count,
            PublishedProperties = properties.Count(s => s == PropertyStatus.Published),
            PendingReviewProperties = properties.Count(s => s == PropertyStatus.PendingReview),
            RejectedProperties = properties.Count(s => s == PropertyStatus.Rejected),
            RentedProperties = properties.Count(s => s == PropertyStatus.Rented),
            TotalInquiries = await _context.PropertyInquiries.CountAsync(),
            TotalAppointments = await _context.ViewingAppointments.CountAsync(),
            TotalApplications = await _context.RentalApplications.CountAsync(),
            OpenReports = await _context.UserReports.CountAsync(r => r.Status == ReportStatus.Open || r.Status == ReportStatus.UnderReview || r.Status == ReportStatus.ActionRequired),
            OpenTickets = await _context.SupportTickets.CountAsync(t => t.Status != TicketStatus.Resolved),
            PendingAgencyVerifications = agencies.Count(a => a.Status == AgencyStatus.Pending),
            VerifiedAgencies = agencies.Count(a => a.Status == AgencyStatus.Verified),
            ActivePremiumSubscriptions = await _context.Subscriptions
                .Include(s => s.Plan)
                .CountAsync(s => s.Status == SubscriptionStatus.Active && s.Plan.Tier == SubscriptionTier.Premium),
            TotalSubscriptionRevenueETB = await _context.PaymentTransactions
                .Where(p => p.Status == PaymentStatus.Completed)
                .SumAsync(p => (decimal?)p.AmountETB) ?? 0m
        };

        return Result<AdminDashboardDto>.Success(dashboard);
    }

    public async Task<Result<PaginatedResult<AdminUserDto>>> GetUsersAsync(string? search, string? role, bool? isRestricted, int page, int pageSize)
    {
        var roleMap = await GetRoleMapAsync();

        var query = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.Email != null && u.Email.ToLower().Contains(term) ||
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term) ||
                u.PhoneNumber != null && u.PhoneNumber.Contains(term));
        }

        if (isRestricted.HasValue)
        {
            query = query.Where(u => u.IsRestricted == isRestricted.Value);
        }

        var users = await query.OrderByDescending(u => u.CreatedAtUtc).ToListAsync();

        if (!string.IsNullOrWhiteSpace(role))
        {
            users = users.Where(u => roleMap.TryGetValue(u.Id, out var roles) && roles.Contains(role)).ToList();
        }

        var totalCount = users.Count;
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var pageItems = users.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var agencyMemberships = await _context.AgencyMemberships
            .Include(m => m.Agency)
            .Where(m => pageItems.Select(p => p.Id).Contains(m.UserId))
            .ToListAsync();

        var propertyCounts = await _context.Properties
            .Where(p => pageItems.Select(x => x.Id).Contains(p.LandlordId))
            .GroupBy(p => p.LandlordId)
            .Select(g => new { LandlordId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.LandlordId, x => x.Count);

        var subscriptions = await _context.Subscriptions
            .Include(s => s.Plan)
            .Where(s => pageItems.Select(x => x.Id).Contains(s.UserId) && s.Status == SubscriptionStatus.Active)
            .ToListAsync();

        var items = pageItems.Select(u =>
        {
            roleMap.TryGetValue(u.Id, out var roles);
            var membership = agencyMemberships.FirstOrDefault(m => m.UserId == u.Id);
            var subscription = subscriptions.FirstOrDefault(s => s.UserId == u.Id);

            return new AdminUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email ?? string.Empty,
                PhoneNumber = u.PhoneNumber,
                Roles = roles ?? new List<string>(),
                IsActive = u.IsActive,
                IsRestricted = u.IsRestricted,
                RestrictionReason = u.RestrictionReason,
                RestrictedAtUtc = u.RestrictedAtUtc,
                EmailConfirmed = u.EmailConfirmed,
                PhoneNumberConfirmed = u.PhoneNumberConfirmed,
                CreatedAtUtc = u.CreatedAtUtc,
                LastLoginAtUtc = u.LastLoginAtUtc,
                SubscriptionTier = subscription?.Plan.Name ?? "Free",
                AgencyId = membership?.AgencyId,
                AgencyName = membership?.Agency.Name,
                PropertyCount = propertyCounts.TryGetValue(u.Id, out var count) ? count : 0
            };
        }).ToList();

        return Result<PaginatedResult<AdminUserDto>>.Success(new PaginatedResult<AdminUserDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<Result<AdminUserDto>> GetUserAsync(string userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return Result<AdminUserDto>.Failure("User not found.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var membership = await _context.AgencyMemberships.Include(m => m.Agency).FirstOrDefaultAsync(m => m.UserId == userId);
        var subscription = await _context.Subscriptions.Include(s => s.Plan).FirstOrDefaultAsync(s => s.UserId == userId && s.Status == SubscriptionStatus.Active);
        var propertyCount = await _context.Properties.CountAsync(p => p.LandlordId == userId);

        return Result<AdminUserDto>.Success(new AdminUserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Roles = roles.ToList(),
            IsActive = user.IsActive,
            IsRestricted = user.IsRestricted,
            RestrictionReason = user.RestrictionReason,
            RestrictedAtUtc = user.RestrictedAtUtc,
            EmailConfirmed = user.EmailConfirmed,
            PhoneNumberConfirmed = user.PhoneNumberConfirmed,
            CreatedAtUtc = user.CreatedAtUtc,
            LastLoginAtUtc = user.LastLoginAtUtc,
            SubscriptionTier = subscription?.Plan.Name ?? "Free",
            AgencyId = membership?.AgencyId,
            AgencyName = membership?.Agency.Name,
            PropertyCount = propertyCount
        });
    }

    public async Task<Result<AdminUserDto>> SetUserRestrictionAsync(string targetUserId, RestrictUserDto dto, string adminId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (user == null)
        {
            return Result<AdminUserDto>.Failure("User not found.");
        }

        if (user.Id == adminId)
        {
            return Result<AdminUserDto>.Failure("You cannot restrict your own administrator account.");
        }

        if (dto.IsRestricted && string.IsNullOrWhiteSpace(dto.Reason))
        {
            return Result<AdminUserDto>.Failure("A reason is required when restricting an account.");
        }

        user.IsRestricted = dto.IsRestricted;
        user.RestrictionReason = dto.IsRestricted ? dto.Reason : null;
        user.RestrictedAtUtc = dto.IsRestricted ? DateTime.UtcNow : null;
        user.RestrictedBy = dto.IsRestricted ? adminId : null;
        user.RestrictionLiftedAtUtc = dto.IsRestricted ? null : DateTime.UtcNow;
        user.IsActive = dto.IsRestricted ? false : user.IsActive;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(adminId, dto.IsRestricted ? "UserRestricted" : "UserRestrictionLifted",
            "ApplicationUser", user.Id, dto.Reason);

        await _notificationService.CreateAsync(user.Id, NotificationType.Security,
            dto.IsRestricted ? "Your account has been restricted" : "Your account restriction has been lifted",
            dto.IsRestricted
                ? $"Reason: {dto.Reason}. Contact support if you believe this is a mistake."
                : "You can now use your account normally again.",
            "/support");

        return await GetUserAsync(targetUserId);
    }

    public async Task<Result<AdminUserDto>> SetUserActiveAsync(string targetUserId, bool isActive, string reason, string adminId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (user == null)
        {
            return Result<AdminUserDto>.Failure("User not found.");
        }

        if (user.Id == adminId)
        {
            return Result<AdminUserDto>.Failure("You cannot deactivate your own administrator account.");
        }

        user.IsActive = isActive;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(adminId, isActive ? "UserReactivated" : "UserDeactivated",
            "ApplicationUser", user.Id, reason);

        await _notificationService.CreateAsync(user.Id, NotificationType.Security,
            isActive ? "Your account has been reactivated" : "Your account has been deactivated",
            isActive ? "Welcome back. Your account is active again." : $"Reason: {reason}",
            "/support");

        return await GetUserAsync(targetUserId);
    }

    public async Task<Result<List<AgencyDto>>> GetAgenciesAsync(AgencyStatus? status)
    {
        var query = _context.Agencies.AsNoTracking();

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        var agencies = await query.OrderBy(a => a.Status).ThenBy(a => a.Name).ToListAsync();
        var memberCounts = await _context.AgencyMemberships
            .GroupBy(m => m.AgencyId)
            .Select(g => new { AgencyId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.AgencyId, x => x.Count);
        var propertyCounts = await _context.Properties
            .Where(p => p.AgencyId != null)
            .GroupBy(p => p.AgencyId)
            .Select(g => new { AgencyId = g.Key!.Value, Count = g.Count() })
            .ToDictionaryAsync(x => x.AgencyId, x => x.Count);

        var result = agencies.Select(a => new AgencyDto
        {
            Id = a.Id,
            Name = a.Name,
            Description = a.Description,
            LogoUrl = a.LogoUrl,
            TaxIdentificationNumber = a.TaxIdentificationNumber,
            BusinessLicenseNumber = a.BusinessLicenseNumber,
            City = a.City,
            SubCity = a.SubCity,
            OfficeAddress = a.OfficeAddress,
            OfficialPhone = a.OfficialPhone,
            OfficialEmail = a.OfficialEmail,
            Status = a.Status,
            VerificationNotes = a.VerificationNotes,
            RejectionReason = a.RejectionReason,
            VerifiedAtUtc = a.VerifiedAtUtc,
            SubmittedAtUtc = a.SubmittedAtUtc,
            MemberCount = memberCounts.TryGetValue(a.Id, out var mc) ? mc : 0,
            PropertyCount = propertyCounts.TryGetValue(a.Id, out var pc) ? pc : 0
        }).ToList();

        return Result<List<AgencyDto>>.Success(result);
    }

    public async Task<Result<AgencyDto>> VerifyAgencyAsync(Guid agencyId, AgencyVerificationDto dto, string adminId)
    {
        var agency = await _context.Agencies.FirstOrDefaultAsync(a => a.Id == agencyId);
        if (agency == null)
        {
            return Result<AgencyDto>.Failure("Agency not found.");
        }

        if (!dto.Approved && string.IsNullOrWhiteSpace(dto.RejectionReason))
        {
            return Result<AgencyDto>.Failure("A rejection reason is required.");
        }

        var previousStatus = agency.Status;

        agency.Status = dto.Approved ? AgencyStatus.Verified : AgencyStatus.Rejected;
        agency.RejectionReason = dto.Approved ? null : dto.RejectionReason;
        agency.VerificationNotes = dto.VerificationNotes;
        agency.VerifiedAtUtc = dto.Approved ? DateTime.UtcNow : null;
        agency.VerifiedBy = dto.Approved ? adminId : null;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(adminId, dto.Approved ? "AgencyVerified" : "AgencyRejected",
            "Agency", agency.Id.ToString(), dto.RejectionReason ?? dto.VerificationNotes, previousStatus.ToString(), agency.Status.ToString());

        var managers = await _context.AgencyMemberships
            .Where(m => m.AgencyId == agencyId && m.IsActive)
            .Select(m => m.UserId)
            .ToListAsync();

        foreach (var managerId in managers)
        {
            await _notificationService.CreateAsync(managerId, NotificationType.Agency,
                dto.Approved ? "Agency verified" : "Agency verification rejected",
                dto.Approved
                    ? $"{agency.Name} is now verified. Your listings show a verified badge."
                    : $"{agency.Name} verification was rejected. Reason: {dto.RejectionReason}",
                "/agency");
        }

        var memberCount = await _context.AgencyMemberships.CountAsync(m => m.AgencyId == agencyId && m.IsActive);
        var propertyCount = await _context.Properties.CountAsync(p => p.AgencyId == agencyId);

        return Result<AgencyDto>.Success(new AgencyDto
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
        });
    }

    public async Task<Result<List<PlatformSettingDto>>> GetSettingsAsync()
    {
        var settings = await _context.PlatformSettings
            .AsNoTracking()
            .OrderBy(s => s.Category)
            .ThenBy(s => s.Key)
            .Select(s => new PlatformSettingDto
            {
                Key = s.Key,
                Value = s.Value,
                Description = s.Description,
                Category = s.Category,
                UpdatedAtUtc = s.UpdatedAtUtc,
                UpdatedBy = s.UpdatedBy
            })
            .ToListAsync();

        return Result<List<PlatformSettingDto>>.Success(settings);
    }

    public async Task<Result<PlatformSettingDto>> UpdateSettingAsync(string key, UpdatePlatformSettingDto dto, string adminId)
    {
        var setting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null)
        {
            return Result<PlatformSettingDto>.Failure($"Setting '{key}' was not found.");
        }

        var previousValue = setting.Value;
        setting.Value = dto.Value;
        setting.UpdatedBy = adminId;
        setting.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(adminId, "PlatformSettingUpdated", "PlatformSetting", setting.Id.ToString(),
            null, previousValue, setting.Value);

        return Result<PlatformSettingDto>.Success(new PlatformSettingDto
        {
            Key = setting.Key,
            Value = setting.Value,
            Description = setting.Description,
            Category = setting.Category,
            UpdatedAtUtc = setting.UpdatedAtUtc,
            UpdatedBy = setting.UpdatedBy
        });
    }

    public async Task<Result<List<SubscriptionPlanAdminDto>>> GetSubscriptionPlansAsync()
    {
        var plans = await _context.SubscriptionPlans
            .AsNoTracking()
            .OrderBy(p => p.PriceETB)
            .Select(p => new SubscriptionPlanAdminDto
            {
                Id = p.Id,
                Name = p.Name,
                Tier = p.Tier,
                PriceETB = p.PriceETB,
                BillingPeriodDays = p.BillingPeriodDays,
                MaxActiveFavorites = p.MaxActiveFavorites,
                MaxWeeklyInquiries = p.MaxWeeklyInquiries,
                CanViewDirectPhone = p.CanViewDirectPhone,
                HasInstantAlerts = p.HasInstantAlerts,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return Result<List<SubscriptionPlanAdminDto>>.Success(plans);
    }

    public async Task<Result<SubscriptionPlanAdminDto>> UpdateSubscriptionPlanAsync(Guid planId, UpdateSubscriptionPlanDto dto, string adminId)
    {
        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == planId);
        if (plan == null)
        {
            return Result<SubscriptionPlanAdminDto>.Failure("Subscription plan not found.");
        }

        plan.PriceETB = dto.PriceETB;
        plan.BillingPeriodDays = dto.BillingPeriodDays;
        plan.MaxActiveFavorites = dto.MaxActiveFavorites;
        plan.MaxWeeklyInquiries = dto.MaxWeeklyInquiries;
        plan.CanViewDirectPhone = dto.CanViewDirectPhone;
        plan.HasInstantAlerts = dto.HasInstantAlerts;
        plan.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(adminId, "SubscriptionPlanUpdated", "SubscriptionPlan", plan.Id.ToString());

        return Result<SubscriptionPlanAdminDto>.Success(new SubscriptionPlanAdminDto
        {
            Id = plan.Id,
            Name = plan.Name,
            Tier = plan.Tier,
            PriceETB = plan.PriceETB,
            BillingPeriodDays = plan.BillingPeriodDays,
            MaxActiveFavorites = plan.MaxActiveFavorites,
            MaxWeeklyInquiries = plan.MaxWeeklyInquiries,
            CanViewDirectPhone = plan.CanViewDirectPhone,
            HasInstantAlerts = plan.HasInstantAlerts,
            IsActive = plan.IsActive
        });
    }

    public async Task<Result<List<PaymentTransactionDto>>> GetPaymentTransactionsAsync(int page, int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var transactions = await _context.PaymentTransactions
            .AsNoTracking()
            .Include(t => t.Plan)
            .Include(t => t.User)
            .OrderByDescending(t => t.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new PaymentTransactionDto
            {
                Id = t.Id,
                UserId = t.UserId,
                UserEmail = t.User.Email ?? string.Empty,
                PlanName = t.Plan.Name,
                AmountETB = t.AmountETB,
                Provider = t.Provider,
                ExternalReference = t.ExternalReference,
                Status = t.Status,
                FailureReason = t.FailureReason,
                VerifiedAtUtc = t.VerifiedAtUtc,
                CreatedAtUtc = t.CreatedAtUtc
            })
            .ToListAsync();

        return Result<List<PaymentTransactionDto>>.Success(transactions);
    }

    public async Task<Result<PaymentTransactionDto>> VerifyPaymentTransactionAsync(Guid transactionId, bool approved, string? note, string adminId)
    {
        var transaction = await _context.PaymentTransactions
            .Include(t => t.Plan)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

        if (transaction == null)
        {
            return Result<PaymentTransactionDto>.Failure("Payment transaction not found.");
        }

        if (transaction.Status == PaymentStatus.Completed)
        {
            return Result<PaymentTransactionDto>.Failure("This payment has already been verified.");
        }

        if (transaction.Status == PaymentStatus.Refunded)
        {
            return Result<PaymentTransactionDto>.Failure("A refunded payment cannot be verified.");
        }

        if (approved)
        {
            transaction.Status = PaymentStatus.Completed;
            transaction.VerifiedAtUtc = DateTime.UtcNow;
            transaction.VerifiedBy = adminId;

            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.Id == transaction.SubscriptionId);

            if (subscription == null)
            {
                subscription = new Subscription
                {
                    UserId = transaction.UserId,
                    PlanId = transaction.PlanId,
                    Status = SubscriptionStatus.PendingPayment,
                    AmountPaidETB = transaction.AmountETB
                };
                _context.Subscriptions.Add(subscription);
            }

            subscription.Status = SubscriptionStatus.Active;
            subscription.StartDateUtc = DateTime.UtcNow;
            subscription.EndDateUtc = DateTime.UtcNow.AddDays(transaction.Plan.BillingPeriodDays);
            subscription.AmountPaidETB = transaction.AmountETB;
            subscription.PaymentTransactionReference = transaction.ExternalReference;

            transaction.SubscriptionId = subscription.Id;
        }
        else
        {
            transaction.Status = PaymentStatus.Failed;
            transaction.FailureReason = note ?? "Payment could not be verified by the administrator.";

            var pending = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.Id == transaction.SubscriptionId && s.Status == SubscriptionStatus.PendingPayment);

            if (pending != null)
            {
                pending.Status = SubscriptionStatus.PaymentFailed;
            }
        }

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(adminId, approved ? "PaymentVerified" : "PaymentRejected",
            "PaymentTransaction", transaction.Id.ToString(), note);

        await _notificationService.CreateAsync(transaction.UserId, NotificationType.Subscription,
            approved ? "Premium activated" : "Payment could not be verified",
            approved
                ? $"Your {transaction.Plan.Name} plan is now active. Thank you for subscribing."
                : $"We could not confirm your payment for the {transaction.Plan.Name} plan. Reason: {transaction.FailureReason}",
            "/subscription");

        return Result<PaymentTransactionDto>.Success(new PaymentTransactionDto
        {
            Id = transaction.Id,
            UserId = transaction.UserId,
            UserEmail = transaction.User.Email ?? string.Empty,
            PlanName = transaction.Plan.Name,
            AmountETB = transaction.AmountETB,
            Provider = transaction.Provider,
            ExternalReference = transaction.ExternalReference,
            Status = transaction.Status,
            FailureReason = transaction.FailureReason,
            VerifiedAtUtc = transaction.VerifiedAtUtc,
            CreatedAtUtc = transaction.CreatedAtUtc
        });
    }

    public async Task<Result<List<AuditLogDto>>> GetAuditLogsAsync(int page, int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 50 : pageSize;

        var logs = await _context.AuditLogs
            .AsNoTracking()
            .OrderByDescending(l => l.TimestampUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AuditLogDto
            {
                Id = l.Id,
                TimestampUtc = l.TimestampUtc,
                UserId = l.UserId,
                UserEmail = l.UserEmail,
                Action = l.Action,
                EntityName = l.EntityName,
                EntityId = l.EntityId,
                IpAddress = l.IpAddress,
                Reason = l.Reason
            })
            .ToListAsync();

        return Result<List<AuditLogDto>>.Success(logs);
    }
}
