using System.ComponentModel.DataAnnotations;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Subscriptions;

public class SubscriptionPlanDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public SubscriptionTier Tier { get; set; }
    public decimal PriceETB { get; set; }
    public int BillingPeriodDays { get; set; }
    public int MaxActiveFavorites { get; set; }
    public int MaxWeeklyInquiries { get; set; }
    public bool CanViewDirectPhone { get; set; }
    public bool HasInstantAlerts { get; set; }
    public bool IsActive { get; set; }
}

public class SubscriptionDto
{
    public Guid Id { get; set; }
    public Guid PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public SubscriptionTier Tier { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime StartDateUtc { get; set; }
    public DateTime? EndDateUtc { get; set; }
    public decimal AmountPaidETB { get; set; }
    public string? PaymentTransactionReference { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class StartSubscriptionDto
{
    [Required]
    public Guid PlanId { get; set; }

    [StringLength(200)]
    public string? PaymentReference { get; set; }

    [StringLength(80)]
    public string? Provider { get; set; }
}

public class CancelSubscriptionDto
{
    [StringLength(500)]
    public string? Reason { get; set; }
}

public class PaymentTransactionDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public decimal AmountETB { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string? ExternalReference { get; set; }
    public PaymentStatus Status { get; set; }
    public string? FailureReason { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class VerifyPaymentDto
{
    [Required]
    public Guid TransactionId { get; set; }

    [Required]
    public bool Approved { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}

public class EntitlementDto
{
    public string Tier { get; set; } = "Free";
    public bool IsPremium { get; set; }
    public bool CanViewDirectPhone { get; set; }
    public bool HasInstantAlerts { get; set; }
    public int MaxActiveFavorites { get; set; }
    public int MaxWeeklyInquiries { get; set; }
    public int CurrentFavorites { get; set; }
    public int InquiriesThisWeek { get; set; }
    public string SubscriptionStatus { get; set; } = "Free";
    public DateTime? SubscriptionEndUtc { get; set; }
}
