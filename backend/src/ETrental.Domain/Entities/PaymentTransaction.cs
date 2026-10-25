using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class PaymentTransaction : AuditableEntity
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public Guid PlanId { get; set; }
    public SubscriptionPlan Plan { get; set; } = null!;
    public Guid? SubscriptionId { get; set; }
    public Subscription? Subscription { get; set; }
    public decimal AmountETB { get; set; }
    public string Provider { get; set; } = "Manual";
    public string? ExternalReference { get; set; }
    public string? IdempotencyKey { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? FailureReason { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public string? VerifiedBy { get; set; }
}
