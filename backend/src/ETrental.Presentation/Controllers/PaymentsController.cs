using System.Security.Claims;
using System.Threading;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.DTOs.Subscriptions;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public PaymentsController(
        ISubscriptionService subscriptionService,
        IApplicationDbContext context,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _subscriptionService = subscriptionService;
        _context = context;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> PaymentWebhook([FromBody] PaymentWebhookDto dto, CancellationToken ct)
    {
        var transaction = await _context.PaymentTransactions
            .Include(t => t.Plan)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.ExternalReference == dto.TransactionReference, ct);

        if (transaction == null)
        {
            return NotFound(new { succeeded = false, error = "Transaction not found." });
        }

        if (transaction.Status == PaymentStatus.Completed || transaction.Status == PaymentStatus.Failed)
        {
            return Ok(new { succeeded = true, message = "Transaction already processed." });
        }

        transaction.Status = dto.Success ? PaymentStatus.Completed : PaymentStatus.Failed;
        transaction.FailureReason = dto.Success ? null : dto.FailureReason;
        transaction.VerifiedAtUtc = DateTime.UtcNow;
        transaction.VerifiedBy = "payment-webhook";

        await _context.SaveChangesAsync(ct);

        if (dto.Success)
        {
            var existingSubscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == transaction.UserId && s.PlanId == transaction.PlanId, ct);

            if (existingSubscription == null)
            {
                var subscription = new Subscription
                {
                    UserId = transaction.UserId,
                    PlanId = transaction.PlanId,
                    Status = SubscriptionStatus.Active,
                    StartDateUtc = DateTime.UtcNow,
                    EndDateUtc = DateTime.UtcNow.AddDays(transaction.Plan.BillingPeriodDays),
                    AmountPaidETB = transaction.AmountETB,
                    PaymentTransactionReference = transaction.ExternalReference
                };
                _context.Subscriptions.Add(subscription);
            }
            else
            {
                existingSubscription.Status = SubscriptionStatus.Active;
                existingSubscription.StartDateUtc = DateTime.UtcNow;
                existingSubscription.EndDateUtc = DateTime.UtcNow.AddDays(transaction.Plan.BillingPeriodDays);
                existingSubscription.AmountPaidETB = transaction.AmountETB;
                existingSubscription.PaymentTransactionReference = transaction.ExternalReference;
            }

            await _context.SaveChangesAsync(ct);

            await _auditService.LogAsync(transaction.UserId, "PaymentCompleted", "PaymentTransaction",
                transaction.Id.ToString(), $"Provider: {transaction.Provider}, Amount: {transaction.AmountETB} ETB");

            await _notificationService.CreateAsync(transaction.UserId, NotificationType.Subscription,
                "Premium activated",
                $"Your {transaction.Plan.Name} plan is now active. Thank you for subscribing to ETrental.",
                "/subscription");
        }
        else
        {
            await _auditService.LogAsync(transaction.UserId, "PaymentFailed", "PaymentTransaction",
                transaction.Id.ToString(), dto.FailureReason);

            await _notificationService.CreateAsync(transaction.UserId, NotificationType.Subscription,
                "Payment failed",
                $"We could not confirm your payment for the {transaction.Plan.Name} plan. Reason: {dto.FailureReason}",
                "/subscription");
        }

        return Ok(new { succeeded = true });
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
    {
        var transaction = await _context.PaymentTransactions
            .Include(t => t.Plan)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == dto.TransactionId);

        if (transaction == null)
        {
            return NotFound(new { succeeded = false, error = "Transaction not found." });
        }

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (dto.Approved)
        {
            transaction.Status = PaymentStatus.Completed;
            transaction.VerifiedAtUtc = DateTime.UtcNow;
            transaction.VerifiedBy = adminId;

            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == transaction.UserId && s.PlanId == transaction.PlanId);

            if (subscription == null)
            {
                subscription = new Subscription
                {
                    UserId = transaction.UserId,
                    PlanId = transaction.PlanId,
                    Status = SubscriptionStatus.Active,
                    StartDateUtc = DateTime.UtcNow,
                    EndDateUtc = DateTime.UtcNow.AddDays(transaction.Plan.BillingPeriodDays),
                    AmountPaidETB = transaction.AmountETB,
                    PaymentTransactionReference = transaction.ExternalReference
                };
                _context.Subscriptions.Add(subscription);
            }
            else
            {
                subscription.Status = SubscriptionStatus.Active;
                subscription.StartDateUtc = DateTime.UtcNow;
                subscription.EndDateUtc = DateTime.UtcNow.AddDays(transaction.Plan.BillingPeriodDays);
                subscription.AmountPaidETB = transaction.AmountETB;
                subscription.PaymentTransactionReference = transaction.ExternalReference;
            }

            await _context.SaveChangesAsync();

            await _auditService.LogAsync(adminId, "PaymentVerified", "PaymentTransaction",
                transaction.Id.ToString(), dto.Note);

            await _notificationService.CreateAsync(transaction.UserId, NotificationType.Subscription,
                "Premium activated",
                $"Your {transaction.Plan.Name} plan is now active. Thank you for subscribing.",
                "/subscription");
        }
        else
        {
            transaction.Status = PaymentStatus.Failed;
            transaction.FailureReason = dto.Note ?? "Payment could not be verified by the administrator.";
            transaction.VerifiedAtUtc = DateTime.UtcNow;
            transaction.VerifiedBy = adminId;

            await _context.SaveChangesAsync();

            await _auditService.LogAsync(adminId, "PaymentRejected", "PaymentTransaction",
                transaction.Id.ToString(), dto.Note);

            await _notificationService.CreateAsync(transaction.UserId, NotificationType.Subscription,
                "Payment could not be verified",
                $"We could not confirm your payment for the {transaction.Plan.Name} plan. Reason: {transaction.FailureReason}",
                "/subscription");
        }

        return Ok(new { succeeded = true });
    }
}

public class PaymentWebhookDto
{
    public string TransactionReference { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? FailureReason { get; set; }
    public string? Provider { get; set; }
    public decimal? AmountETB { get; set; }
}