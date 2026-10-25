using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Notifications;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IApplicationDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Notification> CreateAsync(string userId, NotificationType type, string title, string message, string? linkUrl = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            LinkUrl = linkUrl,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        return notification;
    }

    public async Task<Result<List<NotificationDto>>> GetForUserAsync(string userId, bool unreadOnly)
    {
        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        if (unreadOnly)
        {
            query = query.Where(n => !n.IsRead);
        }

        var notifications = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(200)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                LinkUrl = n.LinkUrl,
                IsRead = n.IsRead,
                ReadAtUtc = n.ReadAtUtc,
                CreatedAtUtc = n.CreatedAtUtc
            })
            .ToListAsync();

        return Result<List<NotificationDto>>.Success(notifications);
    }

    public async Task<Result<int>> GetUnreadCountAsync(string userId)
    {
        var count = await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return Result<int>.Success(count);
    }

    public async Task<Result<bool>> MarkAsReadAsync(Guid notificationId, string userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
        {
            return Result<bool>.Failure("Notification not found.");
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> MarkAllAsReadAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (notifications.Count == 0)
        {
            return Result<bool>.Success(true);
        }

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    /// <summary>
    /// Sends an email notification. Integrates with an email provider (SendGrid, AWS SES, etc.)
    /// in production. For now, logs the attempt so the infrastructure is ready for configuration.
    /// </summary>
    public async Task<Result<bool>> SendEmailAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogInformation("Email notification: To={ToEmail}, Subject={Subject}", toEmail, subject);
        // TODO: Integrate with email provider (SendGrid, AWS SES, etc.) using configuration from appsettings
        await Task.CompletedTask;
        return Result<bool>.Success(true);
    }

    /// <summary>
    /// Sends an SMS notification. Integrates with an SMS provider (Twilio, Africa's Talking, etc.)
    /// in production. For now, logs the attempt so the infrastructure is ready for configuration.
    /// </summary>
    public async Task<Result<bool>> SendSmsAsync(string toPhone, string message, CancellationToken ct = default)
    {
        _logger.LogInformation("SMS notification: To={ToPhone}, Message={Message}", toPhone, message);
        // TODO: Integrate with SMS provider (Twilio, Africa's Talking, etc.) using configuration from appsettings
        await Task.CompletedTask;
        return Result<bool>.Success(true);
    }
}
