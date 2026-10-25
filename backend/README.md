# Backend database

The backend uses Entity Framework Core with PostgreSQL. Configure the Aiven
connection string locally as the `ConnectionStrings__DefaultConnection`
environment variable; do not commit credentials to `appsettings.json`.

For PowerShell, set it in the terminal used to run the commands:

```powershell
$env:ConnectionStrings__DefaultConnection = "psql 'postgres://avnadmin:<redacted>@pg-32be9535-kefie712-12c3.e.aivencloud.com:12493/defaultdb?sslmode=require'"
```

Create and apply a migration:

```powershell
dotnet ef migrations add InitialPostgreSqlSchema --project .\src\ETrental.Infrastructure\ETrental.Infrastructure.csproj --startup-project .\src\ETrental.Presentation\ETrental.Presentation.csproj --output-dir Persistence\Migrations
dotnet ef database update --project .\src\ETrental.Infrastructure\ETrental.Infrastructure.csproj --startup-project .\src\ETrental.Presentation\ETrental.Presentation.csproj
```

Generate an idempotent SQL script without applying it:

```powershell
dotnet ef migrations script --idempotent --project .\src\ETrental.Infrastructure\ETrental.Infrastructure.csproj --startup-project .\src\ETrental.Presentation\ETrental.Presentation.csproj --output .\ETrental.Migrations.sql
```
