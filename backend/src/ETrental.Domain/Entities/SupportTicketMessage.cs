using ETrental.Domain.Common;

namespace ETrental.Domain.Entities;

public class SupportTicketMessage : BaseEntity
{
    public Guid TicketId { get; set; }
    public SupportTicket Ticket { get; set; } = null!;
    public string SenderId { get; set; } = string.Empty;
    public ApplicationUser Sender { get; set; } = null!;
    public string MessageText { get; set; } = string.Empty;
    public bool IsInternalNote { get; set; } = false; // Strictly restricted to staff
    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;
}
