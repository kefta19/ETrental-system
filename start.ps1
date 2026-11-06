# ETrental Development Runner
# Opens both Backend and Frontend in separate PowerShell windows

Write-Host "Starting ETrental Backend (.NET API)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Starting Backend API on http://localhost:5000...' -ForegroundColor Green; dotnet run --project .\src\ETrental.Presentation\ETrental.Presentation.csproj"

Start-Sleep -Seconds 2

Write-Host "Starting ETrental Frontend (Angular)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Starting Angular Frontend on http://localhost:4200...' -ForegroundColor Green; npm start"

Write-Host "`nBoth services are starting!" -ForegroundColor Green
Write-Host "- Backend API: http://localhost:5000"
Write-Host "- Swagger UI:  http://localhost:5000/swagger"
Write-Host "- Frontend:    http://localhost:4200`n"
