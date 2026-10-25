using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Interactions;
using ETrental.Application.DTOs.Properties;

namespace ETrental.Application.Interfaces;

public interface IInteractionService
{
    // Favorites
    Task<Result<bool>> ToggleFavoriteAsync(Guid propertyId, string userId, CancellationToken ct = default);
    Task<Result<List<PropertySummaryDto>>> GetFavoritesAsync(string userId, CancellationToken ct = default);
    Task<Result<bool>> IsFavoritedAsync(Guid propertyId, string userId, CancellationToken ct = default);

    // Saved Searches
    Task<Result<List<SavedSearchDto>>> GetSavedSearchesAsync(string userId, CancellationToken ct = default);
    Task<Result<SavedSearchDto>> CreateSavedSearchAsync(CreateSavedSearchDto dto, string userId, CancellationToken ct = default);
    Task<Result<bool>> DeleteSavedSearchAsync(Guid id, string userId, CancellationToken ct = default);

    // Inquiries
    Task<Result<PropertyInquiryDto>> CreateInquiryAsync(CreateInquiryDto dto, string renterId, CancellationToken ct = default);
    Task<Result<List<PropertyInquiryDto>>> GetInquiriesSentAsync(string renterId, CancellationToken ct = default);
    Task<Result<List<PropertyInquiryDto>>> GetInquiriesReceivedAsync(string hostId, CancellationToken ct = default);
    Task<Result<PropertyInquiryDto>> ReplyInquiryAsync(Guid inquiryId, ReplyInquiryDto dto, string hostId, CancellationToken ct = default);
    Task<Result<bool>> MarkInquiryAsReadAsync(Guid inquiryId, string userId, CancellationToken ct = default);

    // Viewing Appointments
    Task<Result<ViewingAppointmentDto>> RequestAppointmentAsync(CreateAppointmentDto dto, string renterId, CancellationToken ct = default);
    Task<Result<List<ViewingAppointmentDto>>> GetMyAppointmentsAsync(string userId, bool isLandlord, CancellationToken ct = default);
    Task<Result<ViewingAppointmentDto>> UpdateAppointmentStatusAsync(Guid id, UpdateAppointmentStatusDto dto, string userId, CancellationToken ct = default);

    // Rental Applications
    Task<Result<RentalApplicationDto>> SubmitApplicationAsync(CreateApplicationDto dto, string applicantId, CancellationToken ct = default);
    Task<Result<List<RentalApplicationDto>>> GetMyApplicationsAsync(string applicantId, CancellationToken ct = default);
    Task<Result<List<RentalApplicationDto>>> GetReceivedApplicationsAsync(string hostId, Guid? propertyId = null, CancellationToken ct = default);
    Task<Result<RentalApplicationDto>> UpdateApplicationStatusAsync(Guid id, UpdateApplicationStatusDto dto, string hostId, CancellationToken ct = default);
}
