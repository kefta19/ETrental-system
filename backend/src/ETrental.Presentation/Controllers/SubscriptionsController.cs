using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.DTOs.Subscriptions;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/subscriptions")]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans()
    {
        var result = await _subscriptionService.GetPlansAsync();
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentSubscription()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _subscriptionService.GetCurrentSubscriptionAsync(userId);
        return Ok(result);
    }

    [HttpGet("entitlements")]
    [Authorize]
    public async Task<IActionResult> GetEntitlements()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _subscriptionService.GetEntitlementsAsync(userId);
        return Ok(result);
    }

    [HttpPost("start")]
    [Authorize]
    public async Task<IActionResult> StartSubscription([FromBody] StartSubscriptionDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _subscriptionService.StartSubscriptionAsync(userId, dto);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("cancel")]
    [Authorize]
    public async Task<IActionResult> CancelSubscription([FromBody] CancelSubscriptionDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _subscriptionService.CancelSubscriptionAsync(userId, dto);
        if (!result.Succeeded) return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("payments")]
    [Authorize]
    public async Task<IActionResult> GetMyPayments()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _subscriptionService.GetMyPaymentTransactionsAsync(userId);
        return Ok(result);
    }
}
