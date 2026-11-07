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
        policy.WithOrigins(
                  "http://localhost:4200",
                  "https://localhost:4200",
                  "http://127.0.0.1:4200",
                  "https://127.0.0.1:4200")
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

// 5. Verify the externally managed PostgreSQL schema and seed required data.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        await VerifyPostgreSqlSchemaAsync(context);

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

static async Task VerifyPostgreSqlSchemaAsync(ApplicationDbContext context)
{
    await context.Database.OpenConnectionAsync();
    try
    {
        var connection = context.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.CommandText = """SELECT to_regclass('public."__EFMigrationsHistory"') IS NOT NULL""";
        if (await command.ExecuteScalarAsync() is not true)
        {
            throw new InvalidOperationException(
                "The PostgreSQL database has no EF migration history. Back up the database, " +
                "review backend/ETrental.Migrations.sql, and apply it in Aiven before starting the API.");
        }

        command.CommandText = """
            SELECT EXISTS (
                SELECT 1
                FROM "__EFMigrationsHistory"
                WHERE "MigrationId" = '20261101210124_AddInquiryMessageThreads'
            )
            """;
        if (await command.ExecuteScalarAsync() is not true)
        {
            throw new InvalidOperationException(
                "The PostgreSQL database schema is missing the latest project migration. " +
                "Back up the database, review backend/ETrental.Migrations.sql, and apply it in Aiven.");
        }
    }
    finally
    {
        await context.Database.CloseConnectionAsync();
    }
}
