# Simple API test - No timeout, just try once
# Usage: .\scripts\test-api-simple.ps1

$apiUrl = "http://localhost:6001/api/session"

Write-Host "Testing API: $apiUrl" -ForegroundColor Cyan
Write-Host ""

# Try GET request
try {
    Write-Host "Attempting GET request..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri $apiUrl -Method GET -ErrorAction Stop
    Write-Host "[SUCCESS] API is working!" -ForegroundColor Green
    Write-Host "  Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] API test failed" -ForegroundColor Red
    Write-Host "  Error Type: $($_.Exception.GetType().Name)" -ForegroundColor Yellow
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  HTTP Status: $statusCode" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  1. Make sure backend is running: npm run dev" -ForegroundColor Gray
    Write-Host "  2. Wait 10-20 seconds after starting for compilation" -ForegroundColor Gray
    Write-Host "  3. Check if port 6001 is accessible" -ForegroundColor Gray
    Write-Host "  4. Try in browser: http://localhost:6001/api/session" -ForegroundColor Gray
}

