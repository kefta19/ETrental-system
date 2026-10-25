namespace ETrental.Domain.Enums;

public static class AppointmentStatusTransitions
{
    private static readonly Dictionary<AppointmentStatus, AppointmentStatus[]> Allowed = new()
    {
        [AppointmentStatus.Requested] = new[]
        {
            AppointmentStatus.Confirmed,
            AppointmentStatus.Rescheduled,
            AppointmentStatus.Cancelled
        },
        [AppointmentStatus.Confirmed] = new[]
        {
            AppointmentStatus.Rescheduled,
            AppointmentStatus.Cancelled,
            AppointmentStatus.Completed
        },
        [AppointmentStatus.Rescheduled] = new[]
        {
            AppointmentStatus.Confirmed,
            AppointmentStatus.Cancelled
        },
        [AppointmentStatus.Cancelled] = Array.Empty<AppointmentStatus>(),
        [AppointmentStatus.Completed] = Array.Empty<AppointmentStatus>()
    };

    public static bool CanTransition(AppointmentStatus from, AppointmentStatus to)
    {
        return from != to && Allowed.TryGetValue(from, out var targets) && targets.Contains(to);
    }
}

public static class ApplicationStatusTransitions
{
    private static readonly Dictionary<ApplicationStatus, ApplicationStatus[]> Allowed = new()
    {
        [ApplicationStatus.Submitted] = new[]
        {
            ApplicationStatus.UnderReview,
            ApplicationStatus.Accepted,
            ApplicationStatus.Rejected,
            ApplicationStatus.Withdrawn
        },
        [ApplicationStatus.UnderReview] = new[]
        {
            ApplicationStatus.Accepted,
            ApplicationStatus.Rejected,
            ApplicationStatus.Withdrawn
        },
        [ApplicationStatus.Accepted] = new[]
        {
            ApplicationStatus.Withdrawn
        },
        [ApplicationStatus.Rejected] = Array.Empty<ApplicationStatus>(),
        [ApplicationStatus.Withdrawn] = Array.Empty<ApplicationStatus>()
    };

    public static bool CanTransition(ApplicationStatus from, ApplicationStatus to)
    {
        return from != to && Allowed.TryGetValue(from, out var targets) && targets.Contains(to);
    }
}
