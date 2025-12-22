# Create test data: Clinic and Device
# This script helps create test data for API testing

$apiUrl = "http://localhost:6001"

Write-Host ""
Write-Host "=== Create Test Data ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script helps you create test Clinic and Device data." -ForegroundColor Gray
Write-Host ""

# Check if API is accessible
Write-Host "Checking API..." -ForegroundColor Yellow
try {
    $test = Invoke-WebRequest -Uri "$apiUrl/api/session" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[OK] API is accessible" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] API is not accessible" -ForegroundColor Red
    Write-Host "Please start backend: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "To create test data, you have two options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use Prisma Studio (Recommended)" -ForegroundColor Cyan
Write-Host "  npx prisma studio" -ForegroundColor Gray
Write-Host ""
Write-Host "  Steps:" -ForegroundColor Yellow
Write-Host "  1. Open Prisma Studio in your browser" -ForegroundColor Gray
Write-Host "  2. Go to 'Clinic' table" -ForegroundColor Gray
Write-Host "  3. Click 'Add record' and create:" -ForegroundColor Gray
Write-Host "     - id: clinic-test-001" -ForegroundColor White
Write-Host "     - name: Test Clinic" -ForegroundColor White
Write-Host "  4. Go to 'Device' table" -ForegroundColor Gray
Write-Host "  5. Click 'Add record' and create:" -ForegroundColor Gray
Write-Host "     - id: VP-2025-000001" -ForegroundColor White
Write-Host "     - name: Test Device" -ForegroundColor White
Write-Host "     - clinicId: clinic-test-001" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Use SQL directly" -ForegroundColor Cyan
Write-Host "  Connect to your database and run:" -ForegroundColor Gray
Write-Host ""
Write-Host "  INSERT INTO \"Clinic\" (id, name) VALUES ('clinic-test-001', 'Test Clinic');" -ForegroundColor White
Write-Host "  INSERT INTO \"Device\" (id, name, \"clinicId\") VALUES ('VP-2025-000001', 'Test Device', 'clinic-test-001');" -ForegroundColor White
Write-Host ""
Write-Host "After creating test data, you can test the API:" -ForegroundColor Yellow
Write-Host "  .\scripts\test-session-upload.ps1" -ForegroundColor Cyan
Write-Host ""

