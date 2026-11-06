# Backend database

The backend uses Entity Framework Core with PostgreSQL. Configure the Aiven
connection locally with .NET user-secrets; do not commit credentials to
`appsettings.json`.

To enable Google sign-in, provide `Authentication__Google__ClientSecret` as a
local user-secret or hosting-provider secret. Do not commit the Google client
secret to the repository.

For PowerShell, set it in the terminal used to run the commands:

```powershell
Set-Location 'C:\Users\moon\OneDrive\Desktop\ETrental\backend'
$securePassword = Read-Host "Aiven database password" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $connection = [System.Data.Common.DbConnectionStringBuilder]::new()
    $connection["Host"] = "pg-32be9535-kefie712-12c3.e.aivencloud.com"
    $connection["Port"] = 12493
    $connection["Database"] = "defaultdb"
    $connection["Username"] = "avnadmin"
    $connection["Password"] = $password
    $connection["SSL Mode"] = "Require"
    $env:ConnectionStrings__DefaultConnection = $connection.ConnectionString
    dotnet user-secrets set "ConnectionStrings:DefaultConnection" $connection.ConnectionString --project .\src\ETrental.Presentation\ETrental.Presentation.csproj
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    Remove-Variable password, securePassword -ErrorAction SilentlyContinue
}
```

Then start the API in that same PowerShell window:

```powershell
dotnet run --project .\src\ETrental.Presentation\ETrental.Presentation.csproj
```

The user-secrets command stores the connection for this project on your
computer, outside the repository. You can run the API from the `backend`
folder; `dotnet run` uses the Development profile and loads that secret. The API
requires PostgreSQL and will not silently use a local SQLite database. For a
deployed site, configure `ConnectionStrings__DefaultConnection` as a secret in
the API hosting provider instead.

The Angular development site sends API requests to `http://localhost:5000/api`;
the API, not the browser, connects to Aiven. For a deployed frontend, configure
its API URL to the public backend URL and allow the frontend origin in the API's
CORS policy. Never put database credentials in frontend code.

The API checks that the SQL-managed schema is present but does not apply
migrations at startup. Back up the target database before applying the script
`ETrental.Migrations.sql` in the Aiven SQL editor. Review it first: it includes
a migration that deletes agency-related records. EF Core migration source files
are not included in this repository, so `dotnet ef migrations add` and
`dotnet ef database update` are not available.
