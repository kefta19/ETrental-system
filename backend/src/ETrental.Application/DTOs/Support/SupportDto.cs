using System.ComponentModel.DataAnnotations;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Support;

public class SupportTicketDto
{
    public Guid Id { get; set; }
    public string TicketReference { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? AssignedAgentId { get; set; }
    public string? AssignedAgentName { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public int MessageCount { get; set; }
    public string? LastMessagePreview { get; set; }
}

public class SupportTicketMessageDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string MessageText { get; set; } = string.Empty;
    public bool IsInternalNote { get; set; }
    public DateTime SentAtUtc { get; set; }
}

public class CreateSupportTicketDto
{
    [Required]
    public TicketCategory Category { get; set; } = TicketCategory.Other;

    [Required]
    [StringLength(200, MinimumLength = 5)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [StringLength(4000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
}

public class ReplySupportTicketDto
{
    [Required]
    [StringLength(4000, MinimumLength = 2)]
    public string Message { get; set; } = string.Empty;

    public bool IsInternalNote { get; set; } = false;
}

public class UpdateSupportTicketDto
{
    public TicketStatus? Status { get; set; }
    public TicketPriority? Priority { get; set; }
    public TicketCategory? Category { get; set; }
    public string? AssignedAgentId { get; set; }
}

public class SupportDashboardDto
{
    public int OpenTickets { get; set; }
    public int InProgressTickets { get; set; }
    public int WaitingForUserTickets { get; set; }
    public int EscalatedTickets { get; set; }
    public int ResolvedToday { get; set; }
    public int TotalOpenTickets { get; set; }
    public int UnassignedTickets { get; set; }
    public int MyAssignedTickets { get; set; }
}
