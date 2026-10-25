using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class SubscriptionPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty; // Free, Premium
    public SubscriptionTier Tier { get; set; } = SubscriptionTier.Free;
    public decimal PriceETB { get; set; } = 0;
    public int BillingPeriodDays { get; set; } = 30;
    public int MaxActiveFavorites { get; set; } = 5;
    public int MaxWeeklyInquiries { get; set; } = 3;
    public bool CanViewDirectPhone { get; set; } = false;
    public bool HasInstantAlerts { get; set; } = false;
    public bool IsActive { get; set; } = true;
}
