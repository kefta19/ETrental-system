using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;

namespace ETrental.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly IApplicationDbContext _context;

    public AuditService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(
        string? userId,
        string action,
        string entityName,
        string? entityId,
        string? reason = null,
        string? oldValues = null,
        string? newValues = null)
    {
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UserEmail = userId == null
                ? null
                : (await _context.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.Email).FirstOrDefaultAsync()),
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Reason = reason,
            OldValues = oldValues,
            NewValues = newValues,
            TimestampUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }
}
