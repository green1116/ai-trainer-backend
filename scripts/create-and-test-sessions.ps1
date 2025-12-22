# Create Test Data and Upload Sessions
# This script creates Clinic/Device if needed, uploads test sessions, and verifies PDF download

$ErrorActionPreference = "Stop"

Write-Host "=== Create Test Data and Upload Sessions ===" -ForegroundColor Cyan
Write-Host ""

$apiBaseUrl = "http://localhost:6001"

# Step 1: Check backend
Write-Host "[1/5] Checking backend server..." -ForegroundColor Yellow
try {
    $portCheck = Get-NetTCPConnection -LocalPort 6001 -ErrorAction SilentlyContinue
    if ($null -eq $portCheck) {
        Write-Host "[ERROR] Backend server is not running on port 6001" -ForegroundColor Red
        Write-Host "[TIP] Start backend with: npm run dev" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[OK] Backend server is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Cannot check port: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create test Clinic and Device using Prisma
Write-Host ""
Write-Host "[2/5] Creating test Clinic and Device..." -ForegroundColor Yellow

$testClinicId = "clinic-test-001"
$testDeviceId = "VP-2025-000001"

# Use Node.js to create test data via Prisma
$createTestDataScript = @'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    const testClinicId = 'clinic-test-001';
    const testDeviceId = 'VP-2025-000001';
    
    // Create Clinic
    let clinic = await prisma.clinic.findUnique({
      where: { id: testClinicId }
    });
    
    if (!clinic) {
      clinic = await prisma.clinic.create({
        data: {
          id: testClinicId,
          name: 'Test Clinic'
        }
      });
      console.log('[OK] Created Clinic:', clinic.id);
    } else {
      console.log('[OK] Clinic already exists:', clinic.id);
    }
    
    // Create Device
    let device = await prisma.device.findUnique({
      where: { id: testDeviceId }
    });
    
    if (!device) {
      device = await prisma.device.create({
        data: {
          id: testDeviceId,
          name: 'Test Device',
          clinicId: testClinicId
        }
      });
      console.log('[OK] Created Device:', device.id);
    } else {
      console.log('[OK] Device already exists:', device.id);
    }
    
    console.log('SUCCESS');
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
'@

try {
    $createTestDataScript | node
    Write-Host "[OK] Test data ready" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create test data: $_" -ForegroundColor Red
    Write-Host "[TIP] Make sure database is running and Prisma is set up" -ForegroundColor Yellow
    exit 1
}

# Step 3: Generate and upload test sessions
Write-Host ""
Write-Host "[3/5] Generating and uploading test sessions..." -ForegroundColor Yellow

function New-FakeSession {
    param(
        [string]$DeviceId,
        [int]$SampleCount = 100
    )
    
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $startedAt = $now - (600 * 1000) # 10 minutes ago
    $endedAt = $now
    
    $samples = @()
    for ($i = 0; $i -lt $SampleCount; $i++) {
        $sampleTime = $startedAt + ($i * 6000) # One sample per 6 seconds
        $hz = 30 + (Get-Random -Minimum -5 -Maximum 5) # 30Hz +/- 5Hz random
        
        $samples += @{
            t = $sampleTime
            hz = [Math]::Round($hz, 1)
        }
    }
    
    return @{
        deviceId = $DeviceId
        startedAt = $startedAt
        endedAt = $endedAt
        samples = $samples
    } | ConvertTo-Json -Depth 10
}

$sessionCount = 3
$successCount = 0
$sessionIds = @()

for ($i = 1; $i -le $sessionCount; $i++) {
    Write-Host "  Uploading session $i/$sessionCount..." -ForegroundColor Gray
    try {
        $sessionData = New-FakeSession -DeviceId $testDeviceId -SampleCount 100
        $response = Invoke-RestMethod -Uri "$apiBaseUrl/api/session" -Method POST -Body $sessionData -ContentType "application/json" -ErrorAction Stop
        
        $sessionId = $response.session.id
        $sessionIds += $sessionId
        $successCount++
        Write-Host "    [OK] Session created: $sessionId" -ForegroundColor Green
    } catch {
        Write-Host "    [ERROR] Failed to upload session: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[OK] Uploaded $successCount/$sessionCount sessions" -ForegroundColor Green

if ($sessionIds.Count -eq 0) {
    Write-Host "[ERROR] No sessions were created" -ForegroundColor Red
    exit 1
}

# Step 4: Verify sessions are visible
Write-Host ""
Write-Host "[4/5] Verifying sessions in database..." -ForegroundColor Yellow

try {
    $sessionsResponse = Invoke-RestMethod -Uri "$apiBaseUrl/api/session" -Method GET -ContentType "application/json" -ErrorAction Stop
    $sessions = $sessionsResponse.sessions
    
    if ($null -ne $sessions -and $sessions.Count -gt 0) {
        Write-Host "[OK] Found $($sessions.Count) sessions in database" -ForegroundColor Green
        Write-Host "  Latest session: $($sessions[0].id)" -ForegroundColor Cyan
    } else {
        Write-Host "[WARN] No sessions found in API response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to verify sessions: $_" -ForegroundColor Red
}

# Step 5: Test PDF download
Write-Host ""
Write-Host "[5/5] Testing PDF download..." -ForegroundColor Yellow

if ($sessionIds.Count -eq 0) {
    Write-Host "[WARN] No session IDs available for PDF test" -ForegroundColor Yellow
} else {
    $testSessionId = $sessionIds[0]
    $pdfUrl = "$apiBaseUrl/api/session/$testSessionId/pdf"

    Write-Host "  Testing PDF URL: $pdfUrl" -ForegroundColor Gray

    try {
        $pdfResponse = Invoke-WebRequest -Uri $pdfUrl -Method GET -ErrorAction Stop
        
        if ($pdfResponse.StatusCode -eq 200) {
            $contentType = $pdfResponse.Headers['Content-Type']
            if ($contentType -like '*pdf*' -or $pdfResponse.Content.Length -gt 1000) {
                Write-Host "[OK] PDF download successful!" -ForegroundColor Green
                Write-Host "  Content-Type: $contentType" -ForegroundColor Cyan
                Write-Host "  Size: $($pdfResponse.Content.Length) bytes" -ForegroundColor Cyan
                
                # Save PDF to file for verification
                $pdfPath = "test-session-$testSessionId.pdf"
                [System.IO.File]::WriteAllBytes($pdfPath, $pdfResponse.Content)
                Write-Host "  Saved to: $pdfPath" -ForegroundColor Cyan
            } else {
                Write-Host "[WARN] Response might not be a PDF" -ForegroundColor Yellow
                Write-Host "  Content-Type: $contentType" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "[ERROR] PDF download failed: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "  Status: $statusCode" -ForegroundColor Red
            
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Response: $responseBody" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - Test Clinic: $testClinicId" -ForegroundColor Gray
Write-Host "  - Test Device: $testDeviceId" -ForegroundColor Gray
Write-Host "  - Sessions created: $successCount" -ForegroundColor Gray
Write-Host "  - Frontend URL: http://localhost:6001/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Refresh the dashboard page to see the sessions" -ForegroundColor Cyan
Write-Host "  2. Click on a session to view details and download PDF" -ForegroundColor Cyan

