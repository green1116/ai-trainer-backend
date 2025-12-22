# Quick test script - Send one fake session
# Usage: .\scripts\quick-test.ps1

$apiUrl = "http://localhost:6001/api/session"
$deviceId = "VP-2025-000001"

# Generate one fake session
$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$startedAt = $now - 600000
$endedAt = $now

$samples = @()
for ($i = 0; $i -lt 10; $i++) {
    $sampleTime = $startedAt + ($i * 60000)
    $hz = 30 + (Get-Random -Minimum -5 -Maximum 5)
    $samples += @{ t = $sampleTime; hz = $hz }
}

$payload = @{
    deviceId = $deviceId
    startedAt = $startedAt
    endedAt = $endedAt
    samples = $samples
} | ConvertTo-Json -Depth 10

Write-Host "Testing API: $apiUrl" -ForegroundColor Cyan
Write-Host "Device ID: $deviceId" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $payload -ContentType "application/json" -ErrorAction Stop
    Write-Host "[SUCCESS] Session created!" -ForegroundColor Green
    Write-Host "  Session ID: $($response.session.id)" -ForegroundColor Gray
    Write-Host "  Sample count: $($response.stats.sampleCount)" -ForegroundColor Gray
    Write-Host "  Avg Hz: $([math]::Round($response.stats.avgHz, 2)) Hz" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check database:" -ForegroundColor Yellow
    Write-Host "  npx prisma studio" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Failed to create session" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response: $responseBody" -ForegroundColor Yellow
    }
}

