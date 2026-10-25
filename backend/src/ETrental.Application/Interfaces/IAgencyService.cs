using System.Threading;
using System.Threading.Tasks;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Admin;
using ETrental.Application.DTOs.Agencies;
using ETrental.Application.DTOs.Auth;
using ETrental.Application.DTOs.Notifications;
using ETrental.Application.DTOs.Profile;
using ETrental.Application.DTOs.Properties;
using ETrental.Application.DTOs.Reports;
using ETrental.Application.DTOs.Subscriptions;
using ETrental.Application.DTOs.Support;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Application.Interfaces;

public interface IAgencyService
{
    Task<Result<AgencyDto>> GetMyAgencyAsync(string userId);
    Task<Result<AgencyDto>> GetAgencyByIdAsync(Guid agencyId, string requesterId);
    Task<Result<AgencyDto>> UpdateMyAgencyAsync(string userId, UpdateAgencyDto dto);
    Task<Result<AgencyDto>> SubmitVerificationAsync(string userId);
    Task<Result<List<AgencyMemberDto>>> GetStaffAsync(string userId);
    Task<Result<AgencyMemberDto>> InviteStaffAsync(string managerId, InviteStaffDto dto);
    Task<Result<bool>> UpdateStaffRoleAsync(string managerId, Guid membershipId, UpdateStaffRoleDto dto);
    Task<Result<bool>> DeactivateStaffAsync(string managerId, Guid membershipId);
    Task<Result<List<Guid>>> GetAssignedPropertyIdsAsync(string userId);
    Task<Result<bool>> AssignStaffToPropertyAsync(string managerId, string staffUserId, Guid propertyId);
    Task<Result<bool>> RemoveStaffFromPropertyAsync(string managerId, string staffUserId, Guid propertyId);
    Task<Result<AgencyReportDto>> GetAgencyReportAsync(string userId);
}

public interface IAdminService
{
    Task<Result<AdminDashboardDto>> GetDashboardAsync();
    Task<Result<PaginatedResult<AdminUserDto>>> GetUsersAsync(string? search, string? role, bool? isRestricted, int page, int pageSize);
    Task<Result<AdminUserDto>> GetUserAsync(string userId);
    Task<Result<AdminUserDto>> SetUserRestrictionAsync(string targetUserId, RestrictUserDto dto, string adminId);
    Task<Result<AdminUserDto>> SetUserActiveAsync(string targetUserId, bool isActive, string reason, string adminId);
    Task<Result<List<AgencyDto>>> GetAgenciesAsync(AgencyStatus? status);
    Task<Result<AgencyDto>> VerifyAgencyAsync(Guid agencyId, AgencyVerificationDto dto, string adminId);
    Task<Result<List<PlatformSettingDto>>> GetSettingsAsync();
    Task<Result<PlatformSettingDto>> UpdateSettingAsync(string key, UpdatePlatformSettingDto dto, string adminId);
    Task<Result<List<SubscriptionPlanAdminDto>>> GetSubscriptionPlansAsync();
    Task<Result<SubscriptionPlanAdminDto>> UpdateSubscriptionPlanAsync(Guid planId, UpdateSubscriptionPlanDto dto, string adminId);
    Task<Result<List<PaymentTransactionDto>>> GetPaymentTransactionsAsync(int page, int pageSize);
    Task<Result<PaymentTransactionDto>> VerifyPaymentTransactionAsync(Guid transactionId, bool approved, string? note, string adminId);
    Task<Result<List<AuditLogDto>>> GetAuditLogsAsync(int page, int pageSize);
}

public interface ISupportService
{
    Task<Result<SupportTicketDto>> CreateTicketAsync(string userId, CreateSupportTicketDto dto);
    Task<Result<List<SupportTicketDto>>> GetMyTicketsAsync(string userId);
    Task<Result<List<SupportTicketDto>>> GetAllTicketsAsync(TicketStatus? status, TicketCategory? category, TicketPriority? priority, string? assignedToId, int page, int pageSize);
    Task<Result<SupportTicketDto>> GetTicketAsync(Guid ticketId, string requesterId, bool isStaff);
    Task<Result<List<SupportTicketMessageDto>>> GetTicketMessagesAsync(Guid ticketId, string requesterId, bool isStaff);
    Task<Result<SupportTicketMessageDto>> ReplyToTicketAsync(Guid ticketId, string senderId, bool isStaff, ReplySupportTicketDto dto);
    Task<Result<SupportTicketDto>> UpdateTicketAsync(Guid ticketId, UpdateSupportTicketDto dto, string staffId);
    Task<Result<SupportDashboardDto>> GetDashboardAsync(string staffId);
}

public interface ISubscriptionService
{
    Task<Result<List<SubscriptionPlanDto>>> GetPlansAsync();
    Task<Result<SubscriptionDto>> GetCurrentSubscriptionAsync(string userId);
    Task<Result<EntitlementDto>> GetEntitlementsAsync(string userId);
    Task<Result<SubscriptionDto>> StartSubscriptionAsync(string userId, StartSubscriptionDto dto);
    Task<Result<SubscriptionDto>> CancelSubscriptionAsync(string userId, CancelSubscriptionDto dto);
    Task<Result<List<PaymentTransactionDto>>> GetMyPaymentTransactionsAsync(string userId);
    Task<Result<bool>> RecordPaymentAsync(string userId, Guid planId, decimal amountETB, string? externalReference, string? provider);
}

public interface INotificationService
{
    Task<Result<List<NotificationDto>>> GetForUserAsync(string userId, bool unreadOnly);
    Task<Result<int>> GetUnreadCountAsync(string userId);
    Task<Result<bool>> MarkAsReadAsync(Guid notificationId, string userId);
    Task<Result<bool>> MarkAllAsReadAsync(string userId);
    Task<Notification> CreateAsync(string userId, NotificationType type, string title, string message, string? linkUrl = null);
    Task<Result<bool>> SendEmailAsync(string toEmail, string subject, string body, CancellationToken ct = default);
    Task<Result<bool>> SendSmsAsync(string toPhone, string message, CancellationToken ct = default);
}

public interface IReportService
{
    Task<Result<UserReportDto>> CreateReportAsync(string reporterId, CreateUserReportDto dto);
    Task<Result<List<UserReportDto>>> GetMyReportsAsync(string reporterId);
    Task<Result<PaginatedResult<UserReportDto>>> GetAllReportsAsync(ReportStatus? status, ReportCategory? category, int page, int pageSize);
    Task<Result<UserReportDto>> UpdateReportAsync(Guid reportId, UpdateUserReportDto dto, string staffId);
    Task<Result<ReportDashboardDto>> GetDashboardAsync();
}

public interface IProfileService
{
    Task<Result<UserDto>> GetProfileAsync(string userId);
    Task<Result<UserDto>> UpdateProfileAsync(string userId, UpdateProfileDto dto);
    Task<Result<bool>> ChangePasswordAsync(string userId, ChangePasswordDto dto);
    Task<Result<bool>> RequestPasswordResetAsync(string email);
    Task<Result<bool>> ResetPasswordAsync(ResetPasswordDto dto);
}

public interface IAuditService
{
    Task LogAsync(string? userId, string action, string entityName, string? entityId, string? reason = null, string? oldValues = null, string? newValues = null);
}
