# ETrental End-to-End (E2E) Test Suite
# Tests full multi-role workflows against the live backend API

$baseUrl = "http://localhost:5000/api"
$passed = 0
$failed = 0

function Assert-Step($name, [scriptblock]$action) {
    try {
        $result = & $action
        if ($result -eq $false) {
            Write-Host "  [-] FAIL: $name" -ForegroundColor Red
            $global:failed++
        } else {
            Write-Host "  [+] PASS: $name" -ForegroundColor Green
            $global:passed++
        }
    } catch {
        Write-Host "  [-] FAIL: $name - $($_.Exception.Message)" -ForegroundColor Red
        $global:failed++
    }
}

function Get-Token($email, $pass) {
    $body = @{ email = $email; password = $pass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    return $res.data.token
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   ETRENTAL AUTOMATED END-TO-END WORKFLOW SUITE" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# ----------------- 1. Authentication & Role Validation -----------------
Write-Host "[1/6] Testing Authentication & Token Issuance..." -ForegroundColor Yellow

$adminToken = $null
$landlordToken = $null
$renterToken = $null
$supportToken = $null

Assert-Step "Admin Login & Token" {
    $global:adminToken = Get-Token "admin@etrental.com" "Admin@123456"
    return ($global:adminToken -ne $null)
}
Assert-Step "Landlord Login & Token" {
    $global:landlordToken = Get-Token "landlord@etrental.com" "Landlord@123456"
    return ($global:landlordToken -ne $null)
}
Assert-Step "Renter Login & Token" {
    $global:renterToken = Get-Token "renter@etrental.com" "Renter@123456"
    return ($global:renterToken -ne $null)
}
Assert-Step "Support Agent Login & Token" {
    $global:supportToken = Get-Token "support@etrental.com" "Support@123456"
    return ($global:supportToken -ne $null)
}

# ----------------- 2. Public Property Search & Filters -----------------
Write-Host "`n[2/6] Testing Public Discovery & Search..." -ForegroundColor Yellow

Assert-Step "Public Paginated Search" {
    $res = Invoke-RestMethod -Uri "$baseUrl/properties/search?page=1&pageSize=5" -Method Get
    return ($res.succeeded -and $res.data.items.Count -gt 0)
}
Assert-Step "Ethiopian Location Filter (Addis Ababa)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/properties/search?city=Addis%20Ababa" -Method Get
    return ($res.succeeded -and $res.data.items.Count -gt 0)
}
Assert-Step "Subscription Plans Public Listing" {
    $res = Invoke-RestMethod -Uri "$baseUrl/subscriptions/plans" -Method Get
    return ($res.succeeded -and $res.data.Count -ge 2)
}

# ----------------- 3. Renter Workflow (Favorites & Inquiries) -----------------
Write-Host "`n[3/6] Testing Renter Journey..." -ForegroundColor Yellow

Assert-Step "Renter KPI Dashboard" {
    $res = Invoke-RestMethod -Uri "$baseUrl/dashboard/renter" -Method Get -Headers @{ Authorization = "Bearer $renterToken" }
    return ($res.succeeded -and $res.data.recommendedPropertyCount -ge 0)
}
Assert-Step "Renter Favorites Query" {
    $res = Invoke-RestMethod -Uri "$baseUrl/favorites" -Method Get -Headers @{ Authorization = "Bearer $renterToken" }
    return ($res.succeeded)
}
Assert-Step "Renter Active Subscriptions & Entitlements" {
    $res = Invoke-RestMethod -Uri "$baseUrl/subscriptions/entitlements" -Method Get -Headers @{ Authorization = "Bearer $renterToken" }
    return ($res.succeeded)
}

# ----------------- 4. Landlord Tenancy & Agreements -----------------
Write-Host "`n[4/6] Testing Landlord Portfolio & Tenancy Lifecycle..." -ForegroundColor Yellow

Assert-Step "Landlord Portfolio & Statistics" {
    $res = Invoke-RestMethod -Uri "$baseUrl/dashboard/landlord" -Method Get -Headers @{ Authorization = "Bearer $landlordToken" }
    return ($res.succeeded -and $res.data.totalProperties -gt 0)
}
Assert-Step "Landlord Listing Inventory Query" {
    $res = Invoke-RestMethod -Uri "$baseUrl/properties/landlord/my-listings" -Method Get -Headers @{ Authorization = "Bearer $landlordToken" }
    return ($res.succeeded -and $res.data.Count -gt 0)
}
Assert-Step "Landlord Rental Agreements Management" {
    $res = Invoke-RestMethod -Uri "$baseUrl/agreements" -Method Get -Headers @{ Authorization = "Bearer $landlordToken" }
    return ($res.succeeded)
}

# ----------------- 5. Admin Moderation & Platform Governance -----------------
Write-Host "`n[5/6] Testing Admin Governance & Moderation..." -ForegroundColor Yellow

Assert-Step "Admin KPI Dashboard Metrics" {
    $res = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    return ($res.succeeded -and $res.data.totalUsers -gt 0)
}
Assert-Step "Admin User Accounts Management" {
    $res = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    return ($res.succeeded -and $res.data.items.Count -gt 0)
}
Assert-Step "Admin Listing Moderation Queue" {
    $res = Invoke-RestMethod -Uri "$baseUrl/admin/moderation/pending" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    return ($res.succeeded)
}
Assert-Step "Platform Policy & Financial Settings" {
    $res = Invoke-RestMethod -Uri "$baseUrl/admin/settings" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    return ($res.succeeded -and $res.data.Count -ge 10)
}
Assert-Step "Security Audit Logs Trail" {
    $res = Invoke-RestMethod -Uri "$baseUrl/admin/audit-logs" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    return ($res.succeeded)
}

# ----------------- 6. Support Ticketing & Dispute Handling -----------------
Write-Host "`n[6/6] Testing Support Agent Operations..." -ForegroundColor Yellow

Assert-Step "Support Agent KPI Dashboard" {
    $res = Invoke-RestMethod -Uri "$baseUrl/support/dashboard" -Method Get -Headers @{ Authorization = "Bearer $supportToken" }
    return ($res.succeeded)
}
Assert-Step "Support Incident Reports Center" {
    $res = Invoke-RestMethod -Uri "$baseUrl/reports/dashboard" -Method Get -Headers @{ Authorization = "Bearer $supportToken" }
    return ($res.succeeded)
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   RESULTS: $passed PASSED, $failed FAILED" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=======================================================`n" -ForegroundColor Cyan

exit $failed
