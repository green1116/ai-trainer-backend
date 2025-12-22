# Check if a device exists in the database
# Usage: .\scripts\check-device.ps1 [deviceId]

param(
    [string]$DeviceId = ""
)

$apiUrl = "http://localhost:6001/api/session"

Write-Host ""
Write-Host "=== Device Checker ===" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrWhiteSpace($DeviceId)) {
    $DeviceId = Read-Host "Enter Device ID to check"
}

if ([string]::IsNullOrWhiteSpace($DeviceId)) {
    Write-Host "[FAIL] Device ID cannot be empty" -ForegroundColor Red
    exit 1
}

Write-Host "Checking device: $DeviceId" -ForegroundColor Yellow
Write-Host ""

# Try to create a test session to see the error
$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$testPayload = @{
    deviceId = $DeviceId
    startedAt = $now - 600000
    endedAt = $now
    samples = @(
        @{ t = $now - 600000; hz = 30.5 }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $testPayload -ContentType "application/json" -ErrorAction Stop
    Write-Host "[OK] Device exists and is valid!" -ForegroundColor Green
    Write-Host "  Session ID: $($response.session.id)" -ForegroundColor Gray
    Write-Host "  Clinic ID: $($response.session.clinicId)" -ForegroundColor Gray
    Write-Host "  Device Name: $($response.session.device.name)" -ForegroundColor Gray
} catch {
    $statusCode = $null
    $errorDetails = ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            $errorObj = $responseBody | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($errorObj) {
                $errorDetails = $errorObj | ConvertTo-Json -Depth 3
            }
        } catch {
            $errorDetails = $responseBody
        }
    }
    
    Write-Host "[FAIL] Device check failed" -ForegroundColor Red
    Write-Host "  Status Code: $statusCode" -ForegroundColor Yellow
    if ($errorDetails) {
        Write-Host "  Error Details:" -ForegroundColor Yellow
        Write-Host $errorDetails -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Cyan
    Write-Host "  1. Check if device exists in database:" -ForegroundColor Gray
    Write-Host "     npx prisma studio" -ForegroundColor White
    Write-Host "  2. Create device if it doesn't exist:" -ForegroundColor Gray
    Write-Host "     - Device ID format: VP-YYYY-NNNNNN (e.g., VP-2025-000001)" -ForegroundColor White
    Write-Host "     - Device must be associated with a Clinic" -ForegroundColor White
    Write-Host "  3. Check device ID case sensitivity:" -ForegroundColor Gray
    Write-Host "     - Use uppercase: VP-2025-000001" -ForegroundColor White
    Write-Host "     - Not lowercase: vp-2025-000001" -ForegroundColor White
}

Write-Host ""

