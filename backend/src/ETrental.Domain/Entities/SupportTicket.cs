using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class SupportTicket : AuditableEntity
{
    public string TicketReference { get; set; } = string.Empty; // e.g. TICK-1001
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public TicketCategory Category { get; set; } = TicketCategory.Other;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketStatus Status { get; set; } = TicketStatus.Open;
    public string Subject { get; set; } = string.Empty;
    public string? AssignedAgentId { get; set; }
    public ApplicationUser? AssignedAgent { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }

    public ICollection<SupportTicketMessage> Messages { get; set; } = new List<SupportTicketMessage>();
}
