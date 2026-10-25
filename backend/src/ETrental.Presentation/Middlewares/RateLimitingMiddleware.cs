using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using System.Collections.Concurrent;

namespace ETrental.Presentation.Middlewares;

/// <summary>
/// Simple in-memory rate limiter to prevent spam on auth, inquiry, and report endpoints.
/// Limits requests per IP address per minute.
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly ConcurrentDictionary<string, List<DateTime>> _requests = new();
    private static readonly int MaxRequestsPerMinute = 60;
    private static readonly string[] _protectedPaths = { "/api/auth/register", "/api/auth/login", "/api/inquiries", "/api/reports" };

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;

        // Only apply rate limiting to POST requests on protected paths
        if (method == "POST" && _protectedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var now = DateTime.UtcNow;

            // Clean old entries (older than 1 minute)
            if (_requests.TryGetValue(ip, out var timestamps))
            {
                timestamps.RemoveAll(t => now - t > TimeSpan.FromMinutes(1));
            }

            if (_requests.TryGetValue(ip, out var recent) && recent.Count >= MaxRequestsPerMinute)
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\": \"Too many requests. Please try again later.\"}");
                return;
            }

            _requests.AddOrUpdate(ip, new List<DateTime> { now }, (key, existing) =>
            {
                existing.Add(now);
                return existing;
            });
        }

        await _next(context);
    }
}