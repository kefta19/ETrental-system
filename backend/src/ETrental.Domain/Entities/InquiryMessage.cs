using ETrental.Domain.Common;

namespace ETrental.Domain.Entities;

public class InquiryMessage : AuditableEntity
{
    public Guid PropertyInquiryId { get; set; }
    public PropertyInquiry PropertyInquiry { get; set; } = null!;
    public string SenderUserId { get; set; } = string.Empty;
    public ApplicationUser Sender { get; set; } = null!;
    public string Body { get; set; } = string.Empty;
    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;
}
