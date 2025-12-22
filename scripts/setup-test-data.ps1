# Setup test data: Create a test clinic and device
# Usage: .\scripts\setup-test-data.ps1

$apiUrl = "http://localhost:6001"

Write-Host "=== Setting up test data ===" -ForegroundColor Cyan
Write-Host ""

# Check if API is accessible
Write-Host "Checking API..." -ForegroundColor Gray
try {
    $test = Invoke-WebRequest -Uri "$apiUrl/api/session" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] API is accessible" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] API is not accessible" -ForegroundColor Red
    Write-Host "Please start backend: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Note: This script assumes you have a test clinic and device in the database." -ForegroundColor Yellow
Write-Host ""
Write-Host "To create test data manually, run:" -ForegroundColor Cyan
Write-Host "  npx prisma studio" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use SQL:" -ForegroundColor Cyan
Write-Host "  INSERT INTO \"Clinic\" (id, name) VALUES ('clinic-test-001', 'Test Clinic');" -ForegroundColor Gray
Write-Host "  INSERT INTO \"Device\" (id, name, \"clinicId\") VALUES ('VP-2025-000001', 'Test Device', 'clinic-test-001');" -ForegroundColor Gray
Write-Host ""

