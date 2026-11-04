using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using System.Text.Json;
using ETrental.Domain.Entities;
using ETrental.Infrastructure;
using ETrental.Infrastructure.Persistence;
using ETrental.Presentation.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Infrastructure Services (Database, Identity, JWT, Repositories)
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Add API Controllers & JSON settings (camelCase for frontend compatibility)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// 3. Configure CORS policy for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularClient", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 4. Configure Swagger / OpenAPI with JWT Bearer Auth definition
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ETrental Complete Rental Marketplace API",
        Version = "v1",
        Description = "ASP.NET Core Clean Architecture Web API for ETrental Ethiopia."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOi...\""
    });

    options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", doc),
            new List<string>()
        }
    });
});

var app = builder.Build();

// 5. Automatic Database Initialization & Seeding on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // Apply the schema managed by Entity Framework migrations.
        // Without a configured connection string the API falls back to a local
        // SQLite file, which is created directly from the current model.
        if (context.Database.IsNpgsql())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
            if (context.Database.IsSqlite())
            {
                await EnsureSqliteSchemaColumnsAsync(context);
            }
        }

        // Seed default roles, admin user, and subscription plans
        await ApplicationDbContextSeed.SeedAsync(context, userManager, roleManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
        throw;
    }
}

// 6. HTTP Pipeline Middleware Configuration
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ETrental API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowAngularClient");

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static async Task EnsureSqliteSchemaColumnsAsync(ApplicationDbContext context)
{
    var connection = context.Database.GetDbConnection();
    var closeConnection = connection.State != System.Data.ConnectionState.Open;
    if (closeConnection)
    {
        await connection.OpenAsync();
    }

    try
    {
        var existingColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = "PRAGMA table_info('Properties')";
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                existingColumns.Add(reader.GetString(1));
            }
        }

        var listingFeeColumns = new (string Name, string Sql)[]
        {
            ("ListingFeeAmountETB", "REAL NOT NULL DEFAULT 0"),
            ("ListingFeeProvider", "TEXT NULL"),
            ("ListingFeeReference", "TEXT NULL"),
            ("ListingFeeTransactionUrl", "TEXT NULL"),
            ("ListingFeeStatus", "INTEGER NOT NULL DEFAULT 0"),
            ("ListingFeeVerifiedAtUtc", "TEXT NULL"),
            ("ListingFeeVerifiedBy", "TEXT NULL"),
            ("VideoUrl", "TEXT NULL")
        };

        foreach (var (name, type) in listingFeeColumns)
        {
            if (existingColumns.Contains(name)) continue;

            await using var command = connection.CreateCommand();
            command.CommandText = $"ALTER TABLE \"Properties\" ADD COLUMN \"{name}\" {type}";
            await command.ExecuteNonQueryAsync();
        }

        var paymentTransactionColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = "PRAGMA table_info('PaymentTransactions')";
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                paymentTransactionColumns.Add(reader.GetString(1));
            }
        }

        if (!paymentTransactionColumns.Contains("EvidenceFileName"))
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "ALTER TABLE \"PaymentTransactions\" ADD COLUMN \"EvidenceFileName\" TEXT NULL";
            await command.ExecuteNonQueryAsync();
        }

        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                CREATE TABLE IF NOT EXISTS "InquiryMessages" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_InquiryMessages" PRIMARY KEY,
                    "PropertyInquiryId" TEXT NOT NULL,
                    "SenderUserId" TEXT NOT NULL,
                    "Body" TEXT NOT NULL,
                    "SentAtUtc" TEXT NOT NULL,
                    "CreatedAtUtc" TEXT NOT NULL,
                    "CreatedBy" TEXT NULL,
                    "LastModifiedAtUtc" TEXT NULL,
                    "LastModifiedBy" TEXT NULL,
                    "IsDeleted" INTEGER NOT NULL,
                    "DeletedAtUtc" TEXT NULL,
                    CONSTRAINT "FK_InquiryMessages_PropertyInquiries_PropertyInquiryId"
                        FOREIGN KEY ("PropertyInquiryId") REFERENCES "PropertyInquiries" ("Id") ON DELETE CASCADE,
                    CONSTRAINT "FK_InquiryMessages_AspNetUsers_SenderUserId"
                        FOREIGN KEY ("SenderUserId") REFERENCES "AspNetUsers" ("Id") ON DELETE RESTRICT
                );
                CREATE INDEX IF NOT EXISTS "IX_InquiryMessages_PropertyInquiryId_CreatedAtUtc"
                    ON "InquiryMessages" ("PropertyInquiryId", "CreatedAtUtc");
                CREATE INDEX IF NOT EXISTS "IX_InquiryMessages_SenderUserId"
                    ON "InquiryMessages" ("SenderUserId");
                """;
            await command.ExecuteNonQueryAsync();
        }
    }
    finally
    {
        if (closeConnection)
        {
            await connection.CloseAsync();
        }
    }
}
