namespace ETrental.Domain.Enums;

/// <summary>
/// Server side state machine for rental listings. The browser may request a
/// transition but it can never decide whether the transition is legal.
/// </summary>
public static class PropertyStatusTransitions
{
    private static readonly Dictionary<PropertyStatus, PropertyStatus[]> Allowed = new()
    {
        [PropertyStatus.Draft] = new[]
        {
            PropertyStatus.PendingReview,
            PropertyStatus.Archived
        },
        [PropertyStatus.PendingReview] = new[]
        {
            PropertyStatus.Published,
            PropertyStatus.Rejected,
            PropertyStatus.Draft
        },
        [PropertyStatus.Approved] = new[]
        {
            PropertyStatus.Published,
            PropertyStatus.Unavailable,
            PropertyStatus.Archived
        },
        [PropertyStatus.Rejected] = new[]
        {
            PropertyStatus.Draft,
            PropertyStatus.PendingReview,
            PropertyStatus.Archived
        },
        [PropertyStatus.Published] = new[]
        {
            PropertyStatus.Unavailable,
            PropertyStatus.Rented,
            PropertyStatus.PendingReview,
            PropertyStatus.Archived
        },
        [PropertyStatus.Unavailable] = new[]
        {
            PropertyStatus.Published,
            PropertyStatus.Rented,
            PropertyStatus.Archived
        },
        [PropertyStatus.Rented] = new[]
        {
            PropertyStatus.Unavailable,
            PropertyStatus.Archived
        },
        [PropertyStatus.Archived] = new[]
        {
            PropertyStatus.Draft
        }
    };

    public static bool CanTransition(PropertyStatus from, PropertyStatus to)
    {
        if (from == to)
        {
            return false;
        }

        return Allowed.TryGetValue(from, out var targets) && targets.Contains(to);
    }

    public static IReadOnlyList<PropertyStatus> GetAllowed(PropertyStatus from)
    {
        return Allowed.TryGetValue(from, out var targets)
            ? targets
            : Array.Empty<PropertyStatus>();
    }

    public static string Describe(PropertyStatus from, PropertyStatus to)
    {
        return CanTransition(from, to)
            ? $"A listing can move from {from} to {to}."
            : $"Invalid listing status transition from {from} to {to}.";
    }
}
