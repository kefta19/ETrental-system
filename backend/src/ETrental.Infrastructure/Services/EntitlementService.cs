using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Subscriptions;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

/// <summary>
/// Single source of truth for Free/Premium entitlements. Every restricted action
/// is checked here on the server so the browser can never grant itself access.
/// </summary>
public class EntitlementService : ISubscriptionService
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public EntitlementService(
        IApplicationDbContext context,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _context = context;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    private async Task<(SubscriptionPlan? Plan, Subscription? Subscription)> GetPlanStateAsync(string userId)
    {
        var subscription = await _context.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.StartDateUtc)
            .FirstOrDefaultAsync();

        if (subscription == null)
        {
            return (null, null);
        }

        if (subscription.EndDateUtc.HasValue && subscription.EndDateUtc.Value <= DateTime.UtcNow)
        {
            subscription.Status = SubscriptionStatus.Expired;
            await _context.SaveChangesAsync();
            return (null, subscription);
        }

        return (subscription.Plan, subscription);
    }

    private async Task<SubscriptionPlan> GetEffectivePlanAsync(string userId)
    {
        var (plan, _) = await GetPlanStateAsync(userId);
        if (plan != null)
        {
            return plan;
        }

        return await _context.SubscriptionPlans
            .Where(p => p.Tier == SubscriptionTier.Free)
            .FirstOrDefaultAsync()
            ?? new Domain.Entities.SubscriptionPlan
            {
                Name = "Free",
                Tier = SubscriptionTier.Free,
                PriceETB = 0,
                MaxActiveFavorites = 0,
                MaxWeeklyInquiries = 0,
                CanViewDirectPhone = false,
                HasInstantAlerts = false
            };
    }

    public async Task<Result<List<SubscriptionPlanDto>>> GetPlansAsync()
    {
        var plans = await _context.SubscriptionPlans
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.PriceETB)
            .Select(p => new SubscriptionPlanDto
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

        return Result<List<SubscriptionPlanDto>>.Success(plans);
    }

    public async Task<Result<SubscriptionDto>> GetCurrentSubscriptionAsync(string userId)
    {
        var (_, subscription) = await GetPlanStateAsync(userId);

        if (subscription == null)
        {
            var freePlan = await GetEffectivePlanAsync(userId);
            return Result<SubscriptionDto>.Success(new SubscriptionDto
            {
                PlanId = freePlan.Id,
                PlanName = freePlan.Name,
                Tier = freePlan.Tier,
                Status = SubscriptionStatus.Free,
                StartDateUtc = DateTime.UtcNow,
                AmountPaidETB = 0
            });
        }

        return Result<SubscriptionDto>.Success(new SubscriptionDto
        {
            Id = subscription.Id,
            PlanId = subscription.PlanId,
            PlanName = subscription.Plan.Name,
            Tier = subscription.Plan.Tier,
            Status = subscription.Status,
            StartDateUtc = subscription.StartDateUtc,
            EndDateUtc = subscription.EndDateUtc,
            AmountPaidETB = subscription.AmountPaidETB,
            PaymentTransactionReference = subscription.PaymentTransactionReference,
            CreatedAtUtc = subscription.CreatedAtUtc
        });
    }

    public async Task<Result<EntitlementDto>> GetEntitlementsAsync(string userId)
    {
        var (plan, subscription) = await GetPlanStateAsync(userId);
        var effectivePlan = plan ?? await GetEffectivePlanAsync(userId);

        var favoriteCount = await _context.Favorites.CountAsync(f => f.UserId == userId);

        var weekStart = DateTime.UtcNow.AddDays(-7);
        var inquiriesThisWeek = await _context.PropertyInquiries
            .CountAsync(i => i.RenterId == userId && i.CreatedAtUtc >= weekStart);

        return Result<EntitlementDto>.Success(new EntitlementDto
        {
            Tier = effectivePlan.Tier.ToString(),
            IsPremium = effectivePlan.Tier == SubscriptionTier.Premium,
            CanViewDirectPhone = effectivePlan.CanViewDirectPhone,
            HasInstantAlerts = effectivePlan.HasInstantAlerts,
            MaxActiveFavorites = effectivePlan.MaxActiveFavorites,
            MaxWeeklyInquiries = effectivePlan.MaxWeeklyInquiries,
            CurrentFavorites = favoriteCount,
            InquiriesThisWeek = inquiriesThisWeek,
            SubscriptionStatus = subscription?.Status.ToString() ?? SubscriptionStatus.Free.ToString(),
            SubscriptionEndUtc = subscription?.EndDateUtc
        });
    }

    public async Task<Result<SubscriptionDto>> StartSubscriptionAsync(string userId, StartSubscriptionDto dto)
    {
        var plan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(p => p.Id == dto.PlanId && p.IsActive);

        if (plan == null)
        {
            return Result<SubscriptionDto>.Failure("The selected plan is not available.");
        }

        if (plan.Tier == SubscriptionTier.Free)
        {
            return Result<SubscriptionDto>.Failure("The Free plan does not require a subscription.");
        }

        // A pending payment for the same plan must not create a second subscription.
        var existingPending = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId
                && s.PlanId == plan.Id
                && s.Status == SubscriptionStatus.PendingPayment);

        if (existingPending != null)
        {
            return Result<SubscriptionDto>.Failure("A payment for this plan is already pending. Please complete it from your billing page.");
        }

        var subscription = new Subscription
        {
            UserId = userId,
            PlanId = plan.Id,
            Status = SubscriptionStatus.PendingPayment,
            StartDateUtc = DateTime.UtcNow,
            AmountPaidETB = plan.PriceETB,
            PaymentTransactionReference = dto.PaymentReference
        };

        _context.Subscriptions.Add(subscription);

        var transaction = new Domain.Entities.PaymentTransaction
        {
            UserId = userId,
            PlanId = plan.Id,
            SubscriptionId = subscription.Id,
            AmountETB = plan.PriceETB,
            Provider = string.IsNullOrWhiteSpace(dto.Provider) ? "Manual" : dto.Provider!,
            ExternalReference = dto.PaymentReference,
            IdempotencyKey = $"{userId}:{plan.Id}",
            Status = PaymentStatus.Pending
        };

        _context.PaymentTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "SubscriptionUpgradeRequested", "Subscription", subscription.Id.ToString(),
            $"Requested upgrade to {plan.Name} ({plan.PriceETB} ETB)");

        await _notificationService.CreateAsync(userId, NotificationType.Subscription,
            "Payment pending verification",
            $"Your request for the {plan.Name} plan has been recorded and is waiting for payment verification.",
            "/subscription");

        return Result<SubscriptionDto>.Success(new SubscriptionDto
        {
            Id = subscription.Id,
            PlanId = subscription.PlanId,
            PlanName = plan.Name,
            Tier = plan.Tier,
            Status = subscription.Status,
            StartDateUtc = subscription.StartDateUtc,
            AmountPaidETB = subscription.AmountPaidETB,
            PaymentTransactionReference = subscription.PaymentTransactionReference,
            CreatedAtUtc = subscription.CreatedAtUtc
        });
    }

    public async Task<Result<SubscriptionDto>> CancelSubscriptionAsync(string userId, CancelSubscriptionDto dto)
    {
        var subscription = await _context.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.StartDateUtc)
            .FirstOrDefaultAsync();

        if (subscription == null)
        {
            return Result<SubscriptionDto>.Failure("There is no active subscription to cancel.");
        }

        subscription.Status = SubscriptionStatus.Cancelled;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "SubscriptionCancelled", "Subscription", subscription.Id.ToString(),
            dto.Reason ?? "Cancelled by user");

        await _notificationService.CreateAsync(userId, NotificationType.Subscription,
            "Subscription cancelled",
            $"Your {subscription.Plan.Name} subscription has been cancelled. Your saved favourites, searches and inquiries are kept.",
            "/subscription");

        return Result<SubscriptionDto>.Success(new SubscriptionDto
        {
            Id = subscription.Id,
            PlanId = subscription.PlanId,
            PlanName = subscription.Plan.Name,
            Tier = subscription.Plan.Tier,
            Status = subscription.Status,
            StartDateUtc = subscription.StartDateUtc,
            EndDateUtc = subscription.EndDateUtc,
            AmountPaidETB = subscription.AmountPaidETB,
            CreatedAtUtc = subscription.CreatedAtUtc
        });
    }

    public async Task<Result<List<PaymentTransactionDto>>> GetMyPaymentTransactionsAsync(string userId)
    {
        var transactions = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAtUtc)
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

    public async Task<Result<bool>> RecordPaymentAsync(string userId, Guid planId, decimal amountETB, string? externalReference, string? provider)
    {
        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == planId);
        if (plan == null)
        {
            return Result<bool>.Failure("Plan not found.");
        }

        var transaction = new Domain.Entities.PaymentTransaction
        {
            UserId = userId,
            PlanId = planId,
            AmountETB = amountETB,
            Provider = string.IsNullOrWhiteSpace(provider) ? "Manual" : provider!,
            ExternalReference = externalReference,
            IdempotencyKey = $"{userId}:{planId}:{externalReference}",
            Status = PaymentStatus.Pending
        };

        _context.PaymentTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
