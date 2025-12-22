# Fix Session clinicId - Update sessions with null clinicId
# This script helps fix sessions that were created before the auto-clinicId binding logic

$apiUrl = "http://localhost:6001/api/session"

Write-Host ""
Write-Host "=== Fix Session clinicId ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script helps identify and fix sessions with null clinicId." -ForegroundColor Gray
Write-Host ""

# Get all sessions
Write-Host "Fetching sessions..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method GET -ErrorAction Stop
    $sessions = $response.sessions
    
    Write-Host "Found $($sessions.Count) sessions" -ForegroundColor Green
    Write-Host ""
    
    # Find sessions with null clinicId
    $sessionsWithNullClinic = $sessions | Where-Object { $null -eq $_.clinicId }
    
    if ($sessionsWithNullClinic.Count -eq 0) {
        Write-Host "[OK] All sessions have clinicId assigned" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Found $($sessionsWithNullClinic.Count) session(s) with null clinicId:" -ForegroundColor Yellow
        Write-Host ""
        
        foreach ($session in $sessionsWithNullClinic) {
            Write-Host "  Session ID: $($session.id)" -ForegroundColor Gray
            Write-Host "  Device ID: $($session.deviceId)" -ForegroundColor Gray
            Write-Host "  Device Name: $($session.device.name)" -ForegroundColor Gray
            Write-Host "  Started At: $($session.startedAt)" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "Possible causes:" -ForegroundColor Cyan
        Write-Host "  1. Session was created before auto-clinicId binding logic" -ForegroundColor Gray
        Write-Host "  2. Device is not associated with a clinic" -ForegroundColor Gray
        Write-Host "  3. Session was created through a different API endpoint" -ForegroundColor Gray
        Write-Host ""
        Write-Host "To fix:" -ForegroundColor Yellow
        Write-Host "  1. Ensure devices are associated with clinics" -ForegroundColor Gray
        Write-Host "  2. Create new sessions through POST /api/session" -ForegroundColor Gray
        Write-Host "  3. Or manually update in database using Prisma Studio" -ForegroundColor Gray
        Write-Host "     npx prisma studio" -ForegroundColor Cyan
    }
} catch {
    Write-Host "[ERROR] Failed to fetch sessions: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

