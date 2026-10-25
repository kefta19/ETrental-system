using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Support;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Services;

public class SupportService : ISupportService
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public SupportService(
        IApplicationDbContext context,
        INotificationService notificationService,
        IAuditService auditService)
    {
        _context = context;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    private static string BuildReference()
    {
        var suffix = Random.Shared.Next(1000, 9999);
        return $"TICK-{DateTime.UtcNow:yyyyMMdd}-{suffix}";
    }

    private static SupportTicketDto MapTicket(SupportTicket ticket, int messageCount, string? lastPreview)
    {
        return new SupportTicketDto
        {
            Id = ticket.Id,
            TicketReference = ticket.TicketReference,
            UserId = ticket.UserId,
            UserName = ticket.User?.FullName ?? string.Empty,
            UserEmail = ticket.User?.Email ?? string.Empty,
            Category = ticket.Category,
            Priority = ticket.Priority,
            Status = ticket.Status,
            Subject = ticket.Subject,
            AssignedAgentId = ticket.AssignedAgentId,
            AssignedAgentName = ticket.AssignedAgent?.FullName,
            ResolvedAtUtc = ticket.ResolvedAtUtc,
            CreatedAtUtc = ticket.CreatedAtUtc,
            MessageCount = messageCount,
            LastMessagePreview = lastPreview
        };
    }

    public async Task<Result<SupportTicketDto>> CreateTicketAsync(string userId, CreateSupportTicketDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return Result<SupportTicketDto>.Failure("User not found.");
        }

        var ticket = new SupportTicket
        {
            TicketReference = BuildReference(),
            UserId = userId,
            Category = dto.Category,
            Priority = dto.Priority,
            Status = TicketStatus.Open,
            Subject = dto.Subject.Trim()
        };

        ticket.Messages.Add(new SupportTicketMessage
        {
            TicketId = ticket.Id,
            SenderId = userId,
            MessageText = dto.Description.Trim(),
            IsInternalNote = false,
            SentAtUtc = DateTime.UtcNow
        });

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "SupportTicketCreated", "SupportTicket", ticket.Id.ToString(), ticket.Subject);

        return Result<SupportTicketDto>.Success(MapTicket(ticket, 1, dto.Description.Trim()));
    }

    public async Task<Result<List<SupportTicketDto>>> GetMyTicketsAsync(string userId)
    {
        var tickets = await _context.SupportTickets
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.AssignedAgent)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync();

        var ticketIds = tickets.Select(t => t.Id).ToList();
        var messages = await _context.SupportTicketMessages
            .AsNoTracking()
            .Where(m => ticketIds.Contains(m.TicketId) && !m.IsInternalNote)
            .OrderBy(m => m.SentAtUtc)
            .ToListAsync();

        var result = tickets.Select(t =>
        {
            var own = messages.Where(m => m.TicketId == t.Id).ToList();
            var preview = own.LastOrDefault()?.MessageText;
            return MapTicket(t, own.Count, preview);
        }).ToList();

        return Result<List<SupportTicketDto>>.Success(result);
    }

    public async Task<Result<List<SupportTicketDto>>> GetAllTicketsAsync(
        TicketStatus? status,
        TicketCategory? category,
        TicketPriority? priority,
        string? assignedToId,
        int page,
        int pageSize)
    {
        IQueryable<SupportTicket> query = _context.SupportTickets
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.AssignedAgent);

        if (status.HasValue) query = query.Where(t => t.Status == status.Value);
        if (category.HasValue) query = query.Where(t => t.Category == category.Value);
        if (priority.HasValue) query = query.Where(t => t.Priority == priority.Value);
        if (!string.IsNullOrWhiteSpace(assignedToId)) query = query.Where(t => t.AssignedAgentId == assignedToId);

        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 25 : pageSize;

        var totalCount = await query.CountAsync();
        var tickets = await query
            .OrderByDescending(t => t.Status == TicketStatus.Escalated ? 1 : 0)
            .ThenByDescending(t => t.Priority)
            .ThenByDescending(t => t.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var ticketIds = tickets.Select(t => t.Id).ToList();
        var messages = await _context.SupportTicketMessages
            .AsNoTracking()
            .Where(m => ticketIds.Contains(m.TicketId))
            .OrderBy(m => m.SentAtUtc)
            .ToListAsync();

        var result = tickets.Select(t =>
        {
            var own = messages.Where(m => m.TicketId == t.Id).ToList();
            var preview = own.LastOrDefault()?.MessageText;
            return MapTicket(t, own.Count, preview);
        }).ToList();

        return Result<List<SupportTicketDto>>.Success(result);
    }

    public async Task<Result<SupportTicketDto>> GetTicketAsync(Guid ticketId, string requesterId, bool isStaff)
    {
        var ticket = await _context.SupportTickets
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.AssignedAgent)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
        {
            return Result<SupportTicketDto>.Failure("Ticket not found.");
        }

        if (!isStaff && ticket.UserId != requesterId)
        {
            return Result<SupportTicketDto>.Failure("Ticket not found.");
        }

        var messages = await _context.SupportTicketMessages
            .AsNoTracking()
            .Where(m => m.TicketId == ticketId && (isStaff || !m.IsInternalNote))
            .OrderBy(m => m.SentAtUtc)
            .ToListAsync();

        var preview = messages.LastOrDefault()?.MessageText;
        return Result<SupportTicketDto>.Success(MapTicket(ticket, messages.Count, preview));
    }

    public async Task<Result<List<SupportTicketMessageDto>>> GetTicketMessagesAsync(Guid ticketId, string requesterId, bool isStaff)
    {
        var ticket = await _context.SupportTickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
        {
            return Result<List<SupportTicketMessageDto>>.Failure("Ticket not found.");
        }

        if (!isStaff && ticket.UserId != requesterId)
        {
            return Result<List<SupportTicketMessageDto>>.Failure("Ticket not found.");
        }

        var messages = await _context.SupportTicketMessages
            .AsNoTracking()
            .Where(m => m.TicketId == ticketId && (isStaff || !m.IsInternalNote))
            .OrderBy(m => m.SentAtUtc)
            .ToListAsync();

        var senderIds = messages.Select(m => m.SenderId).Distinct().ToList();
        var senders = await _context.Users
            .AsNoTracking()
            .Where(u => senderIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        var result = messages.Select(m => new SupportTicketMessageDto
        {
            Id = m.Id,
            TicketId = m.TicketId,
            SenderId = m.SenderId,
            SenderName = senders.TryGetValue(m.SenderId, out var name) ? name : string.Empty,
            SenderRole = m.IsInternalNote
                ? "Internal Note"
                : (m.SenderId == ticket.UserId ? "User" : "Support"),
            MessageText = m.MessageText,
            IsInternalNote = m.IsInternalNote,
            SentAtUtc = m.SentAtUtc
        }).ToList();

        return Result<List<SupportTicketMessageDto>>.Success(result);
    }

    public async Task<Result<SupportTicketMessageDto>> ReplyToTicketAsync(Guid ticketId, string senderId, bool isStaff, ReplySupportTicketDto dto)
    {
        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null)
        {
            return Result<SupportTicketMessageDto>.Failure("Ticket not found.");
        }

        if (!isStaff && ticket.UserId != senderId)
        {
            return Result<SupportTicketMessageDto>.Failure("Ticket not found.");
        }

        // Internal notes can only ever be written by staff.
        var internalNote = isStaff && dto.IsInternalNote;

        var message = new SupportTicketMessage
        {
            TicketId = ticketId,
            SenderId = senderId,
            MessageText = dto.Message.Trim(),
            IsInternalNote = internalNote,
            SentAtUtc = DateTime.UtcNow
        };

        _context.SupportTicketMessages.Add(message);

        if (ticket.Status == TicketStatus.Open)
        {
            ticket.Status = TicketStatus.InProgress;
        }
        else if (ticket.Status == TicketStatus.WaitingForUser && !internalNote)
        {
            ticket.Status = TicketStatus.InProgress;
        }

        await _context.SaveChangesAsync();

        var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == senderId);

        if (internalNote)
        {
            await _auditService.LogAsync(senderId, "SupportInternalNoteAdded", "SupportTicket", ticket.Id.ToString());
        }
        else
        {
            var recipientId = isStaff ? ticket.UserId : ticket.AssignedAgentId ?? ticket.UserId;
            if (!string.IsNullOrEmpty(recipientId))
            {
                await _notificationService.CreateAsync(recipientId, NotificationType.Support,
                    isStaff ? "New support reply" : "Support ticket updated",
                    $"{sender?.FullName ?? "User"} replied to ticket {ticket.TicketReference}.",
                    "/support");
            }
        }

        return Result<SupportTicketMessageDto>.Success(new SupportTicketMessageDto
        {
            Id = message.Id,
            TicketId = message.TicketId,
            SenderId = message.SenderId,
            SenderName = sender?.FullName ?? string.Empty,
            SenderRole = isStaff ? "Support" : "User",
            MessageText = message.MessageText,
            IsInternalNote = message.IsInternalNote,
            SentAtUtc = message.SentAtUtc
        });
    }

    public async Task<Result<SupportTicketDto>> UpdateTicketAsync(Guid ticketId, UpdateSupportTicketDto dto, string staffId)
    {
        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null)
        {
            return Result<SupportTicketDto>.Failure("Ticket not found.");
        }

        var previousStatus = ticket.Status;

        if (dto.Status.HasValue)
        {
            ticket.Status = dto.Status.Value;
            ticket.ResolvedAtUtc = dto.Status.Value == TicketStatus.Resolved ? DateTime.UtcNow : null;
        }

        if (dto.Priority.HasValue) ticket.Priority = dto.Priority.Value;
        if (dto.Category.HasValue) ticket.Category = dto.Category.Value;

        if (dto.AssignedAgentId != null)
        {
            if (string.IsNullOrWhiteSpace(dto.AssignedAgentId))
            {
                ticket.AssignedAgentId = null;
            }
            else
            {
                var assigneeExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedAgentId);
                if (!assigneeExists)
                {
                    return Result<SupportTicketDto>.Failure("The selected agent does not exist.");
                }
                ticket.AssignedAgentId = dto.AssignedAgentId;
            }
        }

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(staffId, "SupportTicketUpdated", "SupportTicket", ticket.Id.ToString(),
            null, previousStatus.ToString(), ticket.Status.ToString());

        await _notificationService.CreateAsync(ticket.UserId, NotificationType.Support,
            $"Ticket {ticket.TicketReference} is now {ticket.Status}",
            $"Your support ticket status changed from {previousStatus} to {ticket.Status}.",
            "/support");

        return await GetTicketAsync(ticket.Id, staffId, true);
    }

    public async Task<Result<SupportDashboardDto>> GetDashboardAsync(string staffId)
    {
        var today = DateTime.UtcNow.Date;

        var dashboard = new SupportDashboardDto
        {
            OpenTickets = await _context.SupportTickets.CountAsync(t => t.Status == TicketStatus.Open),
            InProgressTickets = await _context.SupportTickets.CountAsync(t => t.Status == TicketStatus.InProgress),
            WaitingForUserTickets = await _context.SupportTickets.CountAsync(t => t.Status == TicketStatus.WaitingForUser),
            EscalatedTickets = await _context.SupportTickets.CountAsync(t => t.Status == TicketStatus.Escalated),
            ResolvedToday = await _context.SupportTickets.CountAsync(t => t.Status == TicketStatus.Resolved && t.ResolvedAtUtc >= today),
            TotalOpenTickets = await _context.SupportTickets.CountAsync(t => t.Status != TicketStatus.Resolved),
            UnassignedTickets = await _context.SupportTickets.CountAsync(t => t.AssignedAgentId == null && t.Status != TicketStatus.Resolved),
            MyAssignedTickets = await _context.SupportTickets.CountAsync(t => t.AssignedAgentId == staffId && t.Status != TicketStatus.Resolved)
        };

        return Result<SupportDashboardDto>.Success(dashboard);
    }
}
