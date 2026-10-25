using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using ETrental.Application.Common.Interfaces;
using ETrental.Application.Interfaces;
using ETrental.Domain.Entities;
using ETrental.Infrastructure.Persistence;
using ETrental.Infrastructure.Security;
using ETrental.Infrastructure.Services;

namespace ETrental.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Database Configuration
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            // Local development fallback: a file based SQLite database so the API can be
            // started without any connection string. Production always uses PostgreSQL.
            var fallbackPath = Path.Combine(Directory.GetCurrentDirectory(), "ETrental.db");
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite($"Data Source={fallbackPath}"));
        }
        else
        {
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseNpgsql(connectionString, b =>
                    b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
            });
        }

        services.AddScoped<IApplicationDbContext>(provider => 
            provider.GetRequiredService<ApplicationDbContext>());

        // 2. Identity Configuration
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 6;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // 3. JWT Authentication Configuration
        // The signing key is never hard coded in source control. When it is not
        // configured an ephemeral key is generated so the API still runs locally,
        // but every restart invalidates existing tokens.
        var jwtSecret = configuration["JwtSettings:Secret"];
        var jwtIssuer = configuration["JwtSettings:Issuer"] ?? "ETrentalAPI";
        var jwtAudience = configuration["JwtSettings:Audience"] ?? "ETrentalClient";

        if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
        {
            var logger = services.BuildServiceProvider().GetRequiredService<ILoggerFactory>().CreateLogger("ETrental.Infrastructure");
            logger.LogWarning(
                "JwtSettings:Secret is not configured (or shorter than 32 characters). " +
                "An ephemeral signing key will be used and all tokens will be invalidated on restart.");
            jwtSecret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

        var jwtOptions = new JwtOptions
        {
            Secret = jwtSecret,
            Issuer = jwtIssuer,
            Audience = jwtAudience,
            ExpirationMinutes = int.TryParse(configuration["JwtSettings:ExpirationMinutes"], out var expMinutes) ? expMinutes : 120
        };
        services.AddSingleton(jwtOptions);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        // 4. Infrastructure Services
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPropertyService, PropertyService>();
        services.AddScoped<IModerationService, ModerationService>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IInteractionService, InteractionService>();
        services.AddScoped<IDateTime, DateTimeService>();

        // 5. Marketplace operations services
        services.AddScoped<IAgencyAccessService, AgencyAccessService>();
        services.AddScoped<IAgencyService, AgencyService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<ISupportService, SupportService>();
        services.AddScoped<ISubscriptionService, EntitlementService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAuditService, AuditService>();

        return services;
    }
}
