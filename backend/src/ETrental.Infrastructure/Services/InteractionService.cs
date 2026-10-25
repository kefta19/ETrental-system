using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Interactions;
using ETrental.Application.DTOs.Properties;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class InteractionService : IInteractionService
{
    private readonly IApplicationDbContext _context;
    private readonly IAgencyAccessService _agencyAccess;
    private readonly ISubscriptionService _subscriptionService;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public InteractionService(
        IApplicationDbContext context,
        IAgencyAccessService agencyAccess,
        ISubscriptionService subscriptionService,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _context = context;
        _agencyAccess = agencyAccess;
        _subscriptionService = subscriptionService;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    #region Favorites

    public async Task<Result<bool>> ToggleFavoriteAsync(Guid propertyId, string userId, CancellationToken ct = default)
    {
        var existing = await _context.Favorites
            .FirstOrDefaultAsync(f => f.PropertyId == propertyId && f.UserId == userId, ct);

        if (existing != null)
        {
            _context.Favorites.Remove(existing);
            await _context.SaveChangesAsync(ct);
            return Result<bool>.Success(false); // Removed from favorites
        }

        var propertyExists = await _context.Properties.AnyAsync(p => p.Id == propertyId && !p.IsDeleted, ct);
        if (!propertyExists)
        {
            return Result<bool>.Failure("Property not found.");
        }

        // Entitlement: the Free plan has a configurable number of saved favourites.
        var entitlements = await _subscriptionService.GetEntitlementsAsync(userId);
        if (entitlements.Succeeded)
        {
            var limit = entitlements.Data!.MaxActiveFavorites;
            if (limit >= 0 && entitlements.Data.CurrentFavorites >= limit)
            {
                return Result<bool>.Failure(
                    $"Your plan allows {limit} saved properties. Upgrade to Premium to save more.");
            }
        }

        var favorite = new Favorite
        {
            PropertyId = propertyId,
            UserId = userId,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync(ct);
        return Result<bool>.Success(true); // Added to favorites
    }

    public async Task<Result<List<PropertySummaryDto>>> GetFavoritesAsync(string userId, CancellationToken ct = default)
    {
        var properties = await _context.Favorites
            .Where(f => f.UserId == userId && !f.Property.IsDeleted)
            .OrderByDescending(f => f.CreatedAtUtc)
            .Select(f => new PropertySummaryDto
            {
                Id = f.Property.Id,
                Title = f.Property.Title,
                PropertyType = f.Property.PropertyType,
                Status = f.Property.Status,
                Region = f.Property.Region,
                City = f.Property.City,
                SubCity = f.Property.SubCity,
                Neighborhood = f.Property.Neighborhood,
                Landmark = f.Property.Landmark,
                RentAmountETB = f.Property.RentAmountETB,
                DepositAmountETB = f.Property.DepositAmountETB,
                AdvanceMonthsRequired = f.Property.AdvanceMonthsRequired,
                Bedrooms = f.Property.Bedrooms,
                Bathrooms = f.Property.Bathrooms,
                AreaSquareMeters = f.Property.AreaSquareMeters,
                Furnishing = f.Property.Furnishing,
                HasWaterTank = f.Property.HasWaterTank,
                HasGenerator = f.Property.HasGenerator,
                HasSecurityGuard = f.Property.HasSecurityGuard,
                HasParking = f.Property.HasParking,
                HasElevator = f.Property.HasElevator,
                PrimaryImageUrl = f.Property.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                ImageUrls = f.Property.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
                LandlordName = f.Property.Landlord.FullName,
                CreatedAtUtc = f.Property.CreatedAtUtc
            })
            .ToListAsync(ct);

        return Result<List<PropertySummaryDto>>.Success(properties);
    }

    public async Task<Result<bool>> IsFavoritedAsync(Guid propertyId, string userId, CancellationToken ct = default)
    {
        var isFav = await _context.Favorites
            .AnyAsync(f => f.PropertyId == propertyId && f.UserId == userId, ct);

        return Result<bool>.Success(isFav);
    }

    #endregion

    #region Saved Searches

    public async Task<Result<List<SavedSearchDto>>> GetSavedSearchesAsync(string userId, CancellationToken ct = default)
    {
        var list = await _context.SavedSearches
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .Select(s => new SavedSearchDto
            {
                Id = s.Id,
                Name = s.Name,
                City = s.City,
                SubCity = s.SubCity,
                MinPriceETB = s.MinPriceETB,
                MaxPriceETB = s.MaxPriceETB,
                MinBedrooms = s.MinBedrooms,
                PropertyType = s.PropertyType,
                AlertEmailEnabled = s.AlertEmailEnabled,
                CreatedAtUtc = s.CreatedAtUtc
            })
            .ToListAsync(ct);

        return Result<List<SavedSearchDto>>.Success(list);
    }

    public async Task<Result<SavedSearchDto>> CreateSavedSearchAsync(CreateSavedSearchDto dto, string userId, CancellationToken ct = default)
    {
        var entitlements = await _subscriptionService.GetEntitlementsAsync(userId);
        if (entitlements.Succeeded)
        {
            var limit = entitlements.Data!.MaxWeeklyInquiries;
            var current = await _context.SavedSearches.CountAsync(s => s.UserId == userId, ct);
            if (limit > 0 && current >= limit)
            {
                return Result<SavedSearchDto>.Failure(
                    $"Your plan allows {limit} saved searches. Upgrade to Premium to create more.");
            }
        }

        var entity = new SavedSearch
        {
            UserId = userId,
            Name = dto.Name.Trim(),
            City = dto.City,
            SubCity = dto.SubCity,
            MinPriceETB = dto.MinPriceETB,
            MaxPriceETB = dto.MaxPriceETB,
            MinBedrooms = dto.MinBedrooms,
            PropertyType = dto.PropertyType,
            AlertEmailEnabled = dto.AlertEmailEnabled
        };

        _context.SavedSearches.Add(entity);
        await _context.SaveChangesAsync(ct);

        return Result<SavedSearchDto>.Success(new SavedSearchDto
        {
            Id = entity.Id,
            Name = entity.Name,
            City = entity.City,
            SubCity = entity.SubCity,
            MinPriceETB = entity.MinPriceETB,
            MaxPriceETB = entity.MaxPriceETB,
            MinBedrooms = entity.MinBedrooms,
            PropertyType = entity.PropertyType,
            AlertEmailEnabled = entity.AlertEmailEnabled,
            CreatedAtUtc = entity.CreatedAtUtc
        });
    }

    public async Task<Result<bool>> DeleteSavedSearchAsync(Guid id, string userId, CancellationToken ct = default)
    {
        var item = await _context.SavedSearches.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct);
        if (item == null) return Result<bool>.Failure("Saved search not found or unauthorized.");

        _context.SavedSearches.Remove(item);
        await _context.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }

    #endregion

    #region Inquiries

    public async Task<Result<PropertyInquiryDto>> CreateInquiryAsync(CreateInquiryDto dto, string renterId, CancellationToken ct = default)
    {
        var property = await _context.Properties
            .Include(p => p.Landlord)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == dto.PropertyId && !p.IsDeleted, ct);

        if (property == null)
            return Result<PropertyInquiryDto>.Failure("Property listing not found.");

        if (property.Status != PropertyStatus.Published)
            return Result<PropertyInquiryDto>.Failure("This listing is not currently accepting inquiries.");

        if (property.LandlordId == renterId)
            return Result<PropertyInquiryDto>.Failure("You cannot send an inquiry on your own property.");

        var renter = await _context.Users.FirstOrDefaultAsync(u => u.Id == renterId, ct);
        if (renter == null)
            return Result<PropertyInquiryDto>.Failure("User not found.");

        // Entitlement: the Free plan has a configurable number of inquiries per week.
        var entitlements = await _subscriptionService.GetEntitlementsAsync(renterId);
        if (entitlements.Succeeded)
        {
            var limit = entitlements.Data!.MaxWeeklyInquiries;
            if (limit > 0 && entitlements.Data.InquiriesThisWeek >= limit)
            {
                return Result<PropertyInquiryDto>.Failure(
                    $"Your plan allows {limit} inquiries every 7 days. Upgrade to Premium to contact more hosts.");
            }
        }

        // One active inquiry per renter and property.
        var duplicate = await _context.PropertyInquiries.AnyAsync(i =>
            i.PropertyId == dto.PropertyId && i.RenterId == renterId && i.LandlordReply == null, ct);

        if (duplicate)
        {
            return Result<PropertyInquiryDto>.Failure("You already sent an inquiry for this property and it has not been answered yet.");
        }

        var inquiry = new PropertyInquiry
        {
            PropertyId = dto.PropertyId,
            RenterId = renterId,
            InitialMessage = dto.Message,
            IsReadByLandlord = false,
            IsReadByRenter = true
        };

        _context.PropertyInquiries.Add(inquiry);
        await _context.SaveChangesAsync(ct);

        await _notificationService.CreateAsync(property.LandlordId, NotificationType.Inquiry,
            "New inquiry received",
            $"{renter.FullName} is interested in \"{property.Title}\".",
            "/landlord/inquiries");

        await _auditService.LogAsync(renterId, "InquirySent", "PropertyInquiry", inquiry.Id.ToString(), property.Title);

        return Result<PropertyInquiryDto>.Success(MapToInquiryDto(inquiry, property, renter));
    }

    public async Task<Result<List<PropertyInquiryDto>>> GetInquiriesSentAsync(string renterId, CancellationToken ct = default)
    {
        var inquiries = await _context.PropertyInquiries
            .Include(i => i.Property)
                .ThenInclude(p => p.Images)
            .Include(i => i.Property)
                .ThenInclude(p => p.Landlord)
            .Include(i => i.Renter)
            .Where(i => i.RenterId == renterId)
            .OrderByDescending(i => i.CreatedAtUtc)
            .ToListAsync(ct);

        var dtos = inquiries.Select(i => MapToInquiryDto(i, i.Property, i.Renter)).ToList();
        return Result<List<PropertyInquiryDto>>.Success(dtos);
    }

    public async Task<Result<List<PropertyInquiryDto>>> GetInquiriesReceivedAsync(string hostId, CancellationToken ct = default)
    {
        var agencyContext = await _agencyAccess.GetContextAsync(hostId);
        var agencyId = agencyContext?.AgencyId;

        IQueryable<PropertyInquiry> query = _context.PropertyInquiries
            .Include(i => i.Property)
                .ThenInclude(p => p.Images)
            .Include(i => i.Property)
                .ThenInclude(p => p.Landlord)
            .Include(i => i.Renter);

        query = agencyId.HasValue
            ? query.Where(i => i.Property.LandlordId == hostId
                || i.Property.AssignedAgentId == hostId
                || (i.Property.AgencyId != null && i.Property.AgencyId == agencyId.Value))
            : query.Where(i => i.Property.LandlordId == hostId || i.Property.AssignedAgentId == hostId);

        var inquiries = await query
            .OrderByDescending(i => i.CreatedAtUtc)
            .ToListAsync(ct);

        var dtos = inquiries.Select(i => MapToInquiryDto(i, i.Property, i.Renter)).ToList();
        return Result<List<PropertyInquiryDto>>.Success(dtos);
    }

    public async Task<Result<PropertyInquiryDto>> ReplyInquiryAsync(Guid inquiryId, ReplyInquiryDto dto, string hostId, CancellationToken ct = default)
    {
        var inquiry = await _context.PropertyInquiries
            .Include(i => i.Property)
                .ThenInclude(p => p.Images)
            .Include(i => i.Property)
                .ThenInclude(p => p.Landlord)
            .Include(i => i.Renter)
            .FirstOrDefaultAsync(i => i.Id == inquiryId, ct);

        if (inquiry == null) return Result<PropertyInquiryDto>.Failure("Inquiry not found.");

        var canReply = await _agencyAccess.CanManagePropertyAsync(hostId, inquiry.Property);
        if (!canReply)
            return Result<PropertyInquiryDto>.Failure("Unauthorized to reply to this inquiry.");

        inquiry.LandlordReply = dto.Reply;
        inquiry.RepliedAtUtc = DateTime.UtcNow;
        inquiry.IsReadByLandlord = true;
        inquiry.IsReadByRenter = false;

        await _context.SaveChangesAsync(ct);

        await _notificationService.CreateAsync(inquiry.RenterId, NotificationType.Inquiry,
            "Your inquiry received a reply",
            $"The host of \"{inquiry.Property.Title}\" replied to your message.",
            "/renter/inquiries");

        await _auditService.LogAsync(hostId, "InquiryReplied", "PropertyInquiry", inquiry.Id.ToString());

        return Result<PropertyInquiryDto>.Success(MapToInquiryDto(inquiry, inquiry.Property, inquiry.Renter));
    }

    public async Task<Result<bool>> MarkInquiryAsReadAsync(Guid inquiryId, string userId, CancellationToken ct = default)
    {
        var inquiry = await _context.PropertyInquiries
            .Include(i => i.Property)
            .FirstOrDefaultAsync(i => i.Id == inquiryId, ct);

        if (inquiry == null) return Result<bool>.Failure("Inquiry not found.");

        if (inquiry.RenterId == userId)
        {
            inquiry.IsReadByRenter = true;
        }
        else if (await _agencyAccess.CanAccessPropertyAsync(userId, inquiry.Property))
        {
            inquiry.IsReadByLandlord = true;
        }
        else
        {
            return Result<bool>.Failure("Unauthorized.");
        }

        await _context.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }

    #endregion

    #region Viewing Appointments

    public async Task<Result<ViewingAppointmentDto>> RequestAppointmentAsync(CreateAppointmentDto dto, string renterId, CancellationToken ct = default)
    {
        var property = await _context.Properties
            .Include(p => p.Landlord)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == dto.PropertyId && !p.IsDeleted, ct);

        if (property == null) return Result<ViewingAppointmentDto>.Failure("Property not found.");
        if (property.Status != PropertyStatus.Published) return Result<ViewingAppointmentDto>.Failure("This property is not currently available for viewings.");
        if (property.LandlordId == renterId) return Result<ViewingAppointmentDto>.Failure("You cannot book an appointment for your own listing.");

        if (dto.RequestedDateTimeUtc <= DateTime.UtcNow)
        {
            return Result<ViewingAppointmentDto>.Failure("Choose a viewing date and time in the future.");
        }

        // Scheduling conflict: the host cannot have two viewings at the same time.
        var conflicting = await _context.ViewingAppointments.AnyAsync(a =>
            a.PropertyId == dto.PropertyId &&
            a.Status != AppointmentStatus.Cancelled &&
            a.Status != AppointmentStatus.Completed &&
            Math.Abs((a.RequestedDateTimeUtc - dto.RequestedDateTimeUtc).TotalMinutes) < 60, ct);

        if (conflicting)
        {
            return Result<ViewingAppointmentDto>.Failure("The host already has a viewing scheduled within one hour of that time. Please pick another slot.");
        }

        var renter = await _context.Users.FirstOrDefaultAsync(u => u.Id == renterId, ct);
        if (renter == null) return Result<ViewingAppointmentDto>.Failure("User not found.");

        var appointment = new ViewingAppointment
        {
            PropertyId = dto.PropertyId,
            RenterId = renterId,
            RequestedDateTimeUtc = dto.RequestedDateTimeUtc,
            Status = AppointmentStatus.Requested,
            RenterNotes = dto.RenterNotes
        };

        _context.ViewingAppointments.Add(appointment);
        await _context.SaveChangesAsync(ct);

        await _notificationService.CreateAsync(property.LandlordId, NotificationType.Appointment,
            "New viewing request",
            $"{renter.FullName} requested a viewing of \"{property.Title}\".",
            "/landlord/appointments");

        await _auditService.LogAsync(renterId, "AppointmentRequested", "ViewingAppointment", appointment.Id.ToString(), property.Title);

        return Result<ViewingAppointmentDto>.Success(MapToAppointmentDto(appointment, property, renter));
    }

    public async Task<Result<List<ViewingAppointmentDto>>> GetMyAppointmentsAsync(string userId, bool isLandlord, CancellationToken ct = default)
    {
        IQueryable<ViewingAppointment> query = _context.ViewingAppointments
            .Include(a => a.Property)
                .ThenInclude(p => p.Images)
            .Include(a => a.Property)
                .ThenInclude(p => p.Landlord)
            .Include(a => a.Renter);

        if (isLandlord)
        {
            var agencyContext = await _agencyAccess.GetContextAsync(userId);
            var agencyId = agencyContext?.AgencyId;

            query = agencyId.HasValue
                ? query.Where(a => a.Property.LandlordId == userId
                    || a.Property.AssignedAgentId == userId
                    || (a.Property.AgencyId != null && a.Property.AgencyId == agencyId.Value))
                : query.Where(a => a.Property.LandlordId == userId || a.Property.AssignedAgentId == userId);
        }
        else
        {
            query = query.Where(a => a.RenterId == userId);
        }

        var appointments = await query
            .OrderByDescending(a => a.RequestedDateTimeUtc)
            .ToListAsync(ct);

        var dtos = appointments.Select(a => MapToAppointmentDto(a, a.Property, a.Renter)).ToList();
        return Result<List<ViewingAppointmentDto>>.Success(dtos);
    }

    public async Task<Result<ViewingAppointmentDto>> UpdateAppointmentStatusAsync(Guid id, UpdateAppointmentStatusDto dto, string userId, CancellationToken ct = default)
    {
        var appointment = await _context.ViewingAppointments
            .Include(a => a.Property)
                .ThenInclude(p => p.Images)
            .Include(a => a.Property)
                .ThenInclude(p => p.Landlord)
            .Include(a => a.Renter)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (appointment == null) return Result<ViewingAppointmentDto>.Failure("Appointment not found.");

        var isHost = await _agencyAccess.CanManagePropertyAsync(userId, appointment.Property);
        var isRenter = appointment.RenterId == userId;

        if (!isHost && !isRenter) return Result<ViewingAppointmentDto>.Failure("Unauthorized.");

        // Only the host may confirm or complete a viewing.
        if (!isHost && dto.Status is AppointmentStatus.Confirmed or AppointmentStatus.Completed)
        {
            return Result<ViewingAppointmentDto>.Failure("Only the host can confirm or complete a viewing.");
        }

        if (!AppointmentStatusTransitions.CanTransition(appointment.Status, dto.Status))
        {
            return Result<ViewingAppointmentDto>.Failure(
                $"A viewing cannot move from {appointment.Status} to {dto.Status}.");
        }

        var previousStatus = appointment.Status;

        appointment.Status = dto.Status;
        if (dto.ConfirmedDateTimeUtc.HasValue) appointment.ConfirmedDateTimeUtc = dto.ConfirmedDateTimeUtc.Value;
        if (!string.IsNullOrEmpty(dto.HostNotes) && isHost) appointment.HostNotes = dto.HostNotes;
        if (!string.IsNullOrEmpty(dto.CancellationReason)) appointment.CancellationReason = dto.CancellationReason;

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(userId, "AppointmentStatusChanged", "ViewingAppointment", appointment.Id.ToString(),
            $"{previousStatus} -> {dto.Status}");

        var recipientId = isHost ? appointment.RenterId : appointment.Property.LandlordId;
        await _notificationService.CreateAsync(recipientId, NotificationType.Appointment,
            $"Viewing {appointment.Status}",
            $"The viewing of \"{appointment.Property.Title}\" is now {appointment.Status}.",
            isHost ? "/renter/appointments" : "/landlord/appointments");

        return Result<ViewingAppointmentDto>.Success(MapToAppointmentDto(appointment, appointment.Property, appointment.Renter));
    }

    #endregion

    #region Rental Applications

    public async Task<Result<RentalApplicationDto>> SubmitApplicationAsync(CreateApplicationDto dto, string applicantId, CancellationToken ct = default)
    {
        var property = await _context.Properties
            .Include(p => p.Landlord)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == dto.PropertyId && !p.IsDeleted, ct);

        if (property == null) return Result<RentalApplicationDto>.Failure("Property not found.");
        if (property.Status != PropertyStatus.Published) return Result<RentalApplicationDto>.Failure("This property is not currently accepting applications.");
        if (property.LandlordId == applicantId) return Result<RentalApplicationDto>.Failure("Cannot apply for your own property.");

        // Check if user already submitted an active application for this property
        var existing = await _context.RentalApplications
            .AnyAsync(a => a.PropertyId == dto.PropertyId && a.ApplicantId == applicantId &&
                          (a.Status == ApplicationStatus.Submitted || a.Status == ApplicationStatus.UnderReview), ct);

        if (existing)
        {
            return Result<RentalApplicationDto>.Failure("You already have an active application submitted for this property.");
        }

        var applicant = await _context.Users.FirstOrDefaultAsync(u => u.Id == applicantId, ct);
        if (applicant == null) return Result<RentalApplicationDto>.Failure("Applicant not found.");

        var application = new RentalApplication
        {
            PropertyId = dto.PropertyId,
            ApplicantId = applicantId,
            ProposedMoveInDate = dto.ProposedMoveInDate,
            ProposedLeaseDurationMonths = dto.ProposedLeaseDurationMonths,
            ProposedOccupantsCount = dto.ProposedOccupantsCount,
            EmploymentOrIncomeSummary = dto.EmploymentOrIncomeSummary,
            AdditionalNotes = dto.AdditionalNotes,
            Status = ApplicationStatus.Submitted
        };

        _context.RentalApplications.Add(application);
        await _context.SaveChangesAsync(ct);

        await _notificationService.CreateAsync(property.LandlordId, NotificationType.Application,
            "New rental application",
            $"{applicant.FullName} applied to rent \"{property.Title}\".",
            "/landlord/applications");

        await _auditService.LogAsync(applicantId, "RentalApplicationSubmitted", "RentalApplication", application.Id.ToString(), property.Title);

        return Result<RentalApplicationDto>.Success(MapToApplicationDto(application, property, applicant));
    }

    public async Task<Result<List<RentalApplicationDto>>> GetMyApplicationsAsync(string applicantId, CancellationToken ct = default)
    {
        var applications = await _context.RentalApplications
            .Include(a => a.Property)
                .ThenInclude(p => p.Images)
            .Include(a => a.Property)
                .ThenInclude(p => p.Landlord)
            .Include(a => a.Applicant)
            .Where(a => a.ApplicantId == applicantId)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync(ct);

        var dtos = applications.Select(a => MapToApplicationDto(a, a.Property, a.Applicant)).ToList();
        return Result<List<RentalApplicationDto>>.Success(dtos);
    }

    public async Task<Result<List<RentalApplicationDto>>> GetReceivedApplicationsAsync(string hostId, Guid? propertyId = null, CancellationToken ct = default)
    {
        var agencyContext = await _agencyAccess.GetContextAsync(hostId);
        var agencyId = agencyContext?.AgencyId;

        IQueryable<RentalApplication> query = _context.RentalApplications
            .Include(a => a.Property)
                .ThenInclude(p => p.Images)
            .Include(a => a.Property)
                .ThenInclude(p => p.Landlord)
            .Include(a => a.Applicant);

        query = agencyId.HasValue
            ? query.Where(a => a.Property.LandlordId == hostId
                || a.Property.AssignedAgentId == hostId
                || (a.Property.AgencyId != null && a.Property.AgencyId == agencyId.Value))
            : query.Where(a => a.Property.LandlordId == hostId || a.Property.AssignedAgentId == hostId);

        if (propertyId.HasValue)
        {
            query = query.Where(a => a.PropertyId == propertyId.Value);
        }

        var applications = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync(ct);

        var dtos = applications.Select(a => MapToApplicationDto(a, a.Property, a.Applicant)).ToList();
        return Result<List<RentalApplicationDto>>.Success(dtos);
    }

    public async Task<Result<RentalApplicationDto>> UpdateApplicationStatusAsync(Guid id, UpdateApplicationStatusDto dto, string hostId, CancellationToken ct = default)
    {
        var application = await _context.RentalApplications
            .Include(a => a.Property)
                .ThenInclude(p => p.Images)
            .Include(a => a.Property)
                .ThenInclude(p => p.Landlord)
            .Include(a => a.Applicant)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (application == null) return Result<RentalApplicationDto>.Failure("Application not found.");

        var canReview = await _agencyAccess.CanManagePropertyAsync(hostId, application.Property);
        if (!canReview)
            return Result<RentalApplicationDto>.Failure("Unauthorized to review this application.");

        if (!ApplicationStatusTransitions.CanTransition(application.Status, dto.Status))
        {
            return Result<RentalApplicationDto>.Failure(
                $"An application cannot move from {application.Status} to {dto.Status}.");
        }

        var previousStatus = application.Status;

        application.Status = dto.Status;
        application.HostDecisionNotes = dto.HostDecisionNotes;
        application.DecidedAtUtc = dto.Status is ApplicationStatus.Accepted or ApplicationStatus.Rejected
            ? DateTime.UtcNow
            : null;

        // An accepted application creates the rental agreement record.
        if (dto.Status == ApplicationStatus.Accepted)
        {
            var agreementExists = await _context.RentalAgreements
                .AnyAsync(r => r.ApplicationId == application.Id, ct);

            if (!agreementExists)
            {
                var start = DateTime.UtcNow;
                _context.RentalAgreements.Add(new RentalAgreement
                {
                    PropertyId = application.PropertyId,
                    RenterId = application.ApplicantId,
                    LandlordId = application.Property.LandlordId,
                    ApplicationId = application.Id,
                    MonthlyRentETB = application.Property.RentAmountETB,
                    DepositAmountETB = application.Property.DepositAmountETB,
                    LeaseMonths = application.ProposedLeaseDurationMonths,
                    StartDateUtc = start,
                    EndDateUtc = start.AddMonths(application.ProposedLeaseDurationMonths),
                    Status = RentalAgreementStatus.Active,
                    ActualMoveInDateUtc = start
                });
            }
        }

        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(hostId, "RentalApplicationStatusChanged", "RentalApplication", application.Id.ToString(),
            $"{previousStatus} -> {dto.Status}");

        await _notificationService.CreateAsync(application.ApplicantId, NotificationType.Application,
            $"Your rental application was {dto.Status}",
            $"The host of \"{application.Property.Title}\" updated your application to {dto.Status}.",
            "/renter/applications");

        return Result<RentalApplicationDto>.Success(MapToApplicationDto(application, application.Property, application.Applicant));
    }

    #endregion

    #region Helper Mappers

    private static PropertyInquiryDto MapToInquiryDto(PropertyInquiry i, Property p, ApplicationUser r)
    {
        return new PropertyInquiryDto
        {
            Id = i.Id,
            PropertyId = i.PropertyId,
            Property = MapToSummary(p),
            RenterId = i.RenterId,
            RenterName = r.FullName,
            RenterEmail = r.Email,
            RenterPhone = r.PhoneNumber,
            InitialMessage = i.InitialMessage,
            LandlordReply = i.LandlordReply,
            RepliedAtUtc = i.RepliedAtUtc,
            IsReadByLandlord = i.IsReadByLandlord,
            IsReadByRenter = i.IsReadByRenter,
            CreatedAtUtc = i.CreatedAtUtc
        };
    }

    private static ViewingAppointmentDto MapToAppointmentDto(ViewingAppointment a, Property p, ApplicationUser r)
    {
        return new ViewingAppointmentDto
        {
            Id = a.Id,
            PropertyId = a.PropertyId,
            Property = MapToSummary(p),
            RenterId = a.RenterId,
            RenterName = r.FullName,
            RenterPhone = r.PhoneNumber,
            HostName = p.Landlord?.FullName,
            HostPhone = p.Landlord?.PhoneNumber,
            RequestedDateTimeUtc = a.RequestedDateTimeUtc,
            ConfirmedDateTimeUtc = a.ConfirmedDateTimeUtc,
            Status = a.Status,
            RenterNotes = a.RenterNotes,
            HostNotes = a.HostNotes,
            CancellationReason = a.CancellationReason,
            CreatedAtUtc = a.CreatedAtUtc
        };
    }

    private static RentalApplicationDto MapToApplicationDto(RentalApplication a, Property p, ApplicationUser applicant)
    {
        return new RentalApplicationDto
        {
            Id = a.Id,
            PropertyId = a.PropertyId,
            Property = MapToSummary(p),
            ApplicantId = a.ApplicantId,
            ApplicantName = applicant.FullName,
            ApplicantEmail = applicant.Email,
            ApplicantPhone = applicant.PhoneNumber,
            ProposedMoveInDate = a.ProposedMoveInDate,
            ProposedLeaseDurationMonths = a.ProposedLeaseDurationMonths,
            ProposedOccupantsCount = a.ProposedOccupantsCount,
            EmploymentOrIncomeSummary = a.EmploymentOrIncomeSummary,
            AdditionalNotes = a.AdditionalNotes,
            Status = a.Status,
            HostDecisionNotes = a.HostDecisionNotes,
            DecidedAtUtc = a.DecidedAtUtc,
            CreatedAtUtc = a.CreatedAtUtc
        };
    }

    private static PropertySummaryDto MapToSummary(Property p)
    {
        return new PropertySummaryDto
        {
            Id = p.Id,
            Title = p.Title,
            PropertyType = p.PropertyType,
            Status = p.Status,
            Region = p.Region,
            City = p.City,
            SubCity = p.SubCity,
            Neighborhood = p.Neighborhood,
            Landmark = p.Landmark,
            RentAmountETB = p.RentAmountETB,
            DepositAmountETB = p.DepositAmountETB,
            AdvanceMonthsRequired = p.AdvanceMonthsRequired,
            Bedrooms = p.Bedrooms,
            Bathrooms = p.Bathrooms,
            AreaSquareMeters = p.AreaSquareMeters,
            Furnishing = p.Furnishing,
            HasWaterTank = p.HasWaterTank,
            HasGenerator = p.HasGenerator,
            HasSecurityGuard = p.HasSecurityGuard,
            HasParking = p.HasParking,
            HasElevator = p.HasElevator,
            PrimaryImageUrl = p.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).FirstOrDefault(),
            ImageUrls = p.Images.OrderBy(img => img.DisplayOrder).Select(img => img.ImageUrl).ToList(),
            LandlordName = p.Landlord?.FullName ?? string.Empty,
            CreatedAtUtc = p.CreatedAtUtc
        };
    }

    #endregion
}
