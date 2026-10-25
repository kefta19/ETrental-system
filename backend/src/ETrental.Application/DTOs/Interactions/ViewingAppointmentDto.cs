using System.ComponentModel.DataAnnotations;
using ETrental.Application.DTOs.Properties;
using ETrental.Domain.Enums;

namespace ETrental.Application.DTOs.Interactions;

public class ViewingAppointmentDto
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public PropertySummaryDto? Property { get; set; }
    public string RenterId { get; set; } = string.Empty;
    public string RenterName { get; set; } = string.Empty;
    public string? RenterPhone { get; set; }
    public string? HostName { get; set; }
    public string? HostPhone { get; set; }
    public DateTime RequestedDateTimeUtc { get; set; }
    public DateTime? ConfirmedDateTimeUtc { get; set; }
    public AppointmentStatus Status { get; set; }
    public string? RenterNotes { get; set; }
    public string? HostNotes { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateAppointmentDto
{
    [Required]
    public Guid PropertyId { get; set; }

    [Required]
    public DateTime RequestedDateTimeUtc { get; set; }

    [StringLength(500)]
    public string? RenterNotes { get; set; }
}

public class UpdateAppointmentStatusDto
{
    [Required]
    public AppointmentStatus Status { get; set; }

    public DateTime? ConfirmedDateTimeUtc { get; set; }

    [StringLength(500)]
    public string? HostNotes { get; set; }

    [StringLength(500)]
    public string? CancellationReason { get; set; }
}
