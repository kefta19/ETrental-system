using ETrental.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var databasePath = Path.GetFullPath(
    Path.Combine(Environment.CurrentDirectory, "backend", "src", "ETrental.Presentation", "ETrental.db"));
if (!File.Exists(databasePath))
{
    Console.Error.WriteLine("Could not locate the local SQLite database.");
    return 2;
}

var options = new DbContextOptionsBuilder<ApplicationDbContext>()
    .UseSqlite($"Data Source={databasePath}")
    .Options;

await using var context = new ApplicationDbContext(options);
if (!await context.Database.CanConnectAsync())
{
    Console.Error.WriteLine("Could not connect to the local SQLite database.");
    return 1;
}

await ApplicationDbContextSeed.SeedPlatformSettingsAsync(context);
var settings = await context.PlatformSettings.AsNoTracking().ToListAsync();
Console.WriteLine($"Platform settings available: {settings.Count}");
foreach (var group in settings.GroupBy(setting => setting.Category).OrderBy(group => group.Key))
{
    Console.WriteLine($"{group.Key}: {group.Count()}");
}

return settings.Count == 13 ? 0 : 1;
