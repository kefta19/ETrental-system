using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class ViewingAppointment : AuditableEntity
{
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;
    public string RenterId { get; set; } = string.Empty;
    public ApplicationUser Renter { get; set; } = null!;
    public DateTime RequestedDateTimeUtc { get; set; }
    public DateTime? ConfirmedDateTimeUtc { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Requested;
    public string? RenterNotes { get; set; }
    public string? HostNotes { get; set; }
    public string? CancellationReason { get; set; }
}
