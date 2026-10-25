using ETrental.Application.Common.Interfaces;

namespace ETrental.Infrastructure.Services;

public class DateTimeService : IDateTime
{
    public DateTime UtcNow => DateTime.UtcNow;
}
