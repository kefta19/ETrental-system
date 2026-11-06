namespace ETrental.Application.DTOs.Interactions;

public class RentalAgreementDto
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public string PropertyTitle { get; set; } = string.Empty;
    public string PropertyCity { get; set; } = string.Empty;
    public string PropertyNeighborhood { get; set; } = string.Empty;
    public string? PrimaryImageUrl { get; set; }
    public string RenterId { get; set; } = string.Empty;
    public string RenterName { get; set; } = string.Empty;
    public string LandlordId { get; set; } = string.Empty;
    public string LandlordName { get; set; } = string.Empty;
    public decimal MonthlyRentETB { get; set; }
    public decimal DepositAmountETB { get; set; }
    public int LeaseMonths { get; set; }
    public DateTime StartDateUtc { get; set; }
    public DateTime EndDateUtc { get; set; }
    public DateTime? ActualMoveInDateUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? TerminatedAtUtc { get; set; }
}
