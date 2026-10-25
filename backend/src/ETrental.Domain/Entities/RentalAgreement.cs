using ETrental.Domain.Common;
using ETrental.Domain.Enums;

namespace ETrental.Domain.Entities;

public class RentalAgreement : AuditableEntity
{
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;
    public string RenterId { get; set; } = string.Empty;
    public ApplicationUser Renter { get; set; } = null!;
    public string LandlordId { get; set; } = string.Empty;
    public ApplicationUser Landlord { get; set; } = null!;
    public Guid? ApplicationId { get; set; }
    public RentalApplication? Application { get; set; }
    public decimal MonthlyRentETB { get; set; }
    public decimal DepositAmountETB { get; set; }
    public int LeaseMonths { get; set; }
    public DateTime StartDateUtc { get; set; }
    public DateTime EndDateUtc { get; set; }
    public DateTime? ActualMoveInDateUtc { get; set; }
    public RentalAgreementStatus Status { get; set; } = RentalAgreementStatus.Draft;
    public string? Notes { get; set; }
    public DateTime? TerminatedAtUtc { get; set; }
}
