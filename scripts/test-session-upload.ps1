# Test Session Upload Script
# Validate data pipeline before connecting to real BLE device

$apiUrl = "http://localhost:6001/api/session"

# Generate fake session data
function New-FakeSession {
    param(
        [string]$DeviceId,
        [int]$SampleCount = 10
    )
    
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $startedAt = $now - (600 * 1000) # 10 minutes ago
    $endedAt = $now
    
    $samples = @()
    for ($i = 0; $i -lt $SampleCount; $i++) {
        $sampleTime = $startedAt + ($i * 60000) # One sample per minute
        $hz = 30 + (Get-Random -Minimum -5 -Maximum 5) # 30Hz +/- 5Hz random
        
        $samples += @{
            t = $sampleTime
            hz = $hz
        }
    }
    
    return @{
        deviceId = $DeviceId
        startedAt = $startedAt
        endedAt = $endedAt
        samples = $samples
    } | ConvertTo-Json -Depth 10
}

# Send session data
function Send-SessionData {
    param(
        [string]$DeviceId,
        [int]$Count = 10
    )
    
    Write-Host "[SEND] Sending $Count fake data entries to API..." -ForegroundColor Cyan
    Write-Host "Device ID: $DeviceId" -ForegroundColor Gray
    Write-Host ""
    
    $successCount = 0
    $failCount = 0
    
    for ($i = 1; $i -le $Count; $i++) {
        $payload = New-FakeSession -DeviceId $DeviceId -SampleCount 10
        
        try {
            $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $payload -ContentType "application/json" -ErrorAction Stop
            
            Write-Host "[OK] [$i/$Count] Success - Session ID: $($response.session.id)" -ForegroundColor Green
            Write-Host "     Sample count: $($response.stats.sampleCount), Avg Hz: $([math]::Round($response.stats.avgHz, 2)) Hz" -ForegroundColor Gray
            $successCount++
        }
        catch {
            $errorMsg = $_.Exception.Message
            $statusCode = $null
            
            # Try to extract HTTP status code from error
            if ($_.Exception.Response) {
                $statusCode = $_.Exception.Response.StatusCode.value__
            }
            
            # Get more detailed error information
            $errorDetails = ""
            if ($_.Exception.Response) {
                try {
                    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $responseBody = $reader.ReadToEnd()
                    $reader.Close()
                    $errorObj = $responseBody | ConvertFrom-Json -ErrorAction SilentlyContinue
                    if ($errorObj -and $errorObj.error) {
                        $errorDetails = " - $($errorObj.error)"
                        if ($errorObj.message) {
                            $errorDetails += ": $($errorObj.message)"
                        }
                    }
                } catch {
                    # Ignore JSON parsing errors
                }
            }
            
            Write-Host "[FAIL] [$i/$Count] Error: $errorMsg" -ForegroundColor Red
            if ($statusCode) {
                Write-Host "        HTTP Status: $statusCode" -ForegroundColor Yellow
            }
            if ($errorDetails) {
                Write-Host "        Details:$errorDetails" -ForegroundColor Yellow
            }
            
            # Provide helpful suggestions based on status code
            if ($statusCode -eq 404) {
                Write-Host "        Hint: Device not found. Make sure:" -ForegroundColor Cyan
                Write-Host "          - Device ID is correct (case-sensitive)" -ForegroundColor Gray
                Write-Host "          - Device exists in database" -ForegroundColor Gray
                Write-Host "          - Device is associated with a Clinic" -ForegroundColor Gray
            } elseif ($statusCode -eq 400) {
                Write-Host "        Hint: Bad request. Check:" -ForegroundColor Cyan
                Write-Host "          - Device is associated with a Clinic" -ForegroundColor Gray
                Write-Host "          - Request data format is correct" -ForegroundColor Gray
            }
            
            $failCount++
        }
        
        Start-Sleep -Milliseconds 500 # Avoid too fast requests
    }
    
    Write-Host ""
    Write-Host "=== Test Results ===" -ForegroundColor Cyan
    Write-Host "Success: $successCount" -ForegroundColor Green
    if ($failCount -gt 0) {
        Write-Host "Failed: $failCount" -ForegroundColor Red
    } else {
        Write-Host "Failed: $failCount" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "[TIP] Now check the database, you should see this data!" -ForegroundColor Yellow
    Write-Host "     - Session table: Should have $successCount records" -ForegroundColor Gray
    Write-Host "     - DeviceData table: Should have $($successCount * 10) frequency point records" -ForegroundColor Gray
}

# Main program
Write-Host ""
Write-Host "=== Session Upload Test Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if API is accessible with better diagnostics
Write-Host "Checking API accessibility..." -ForegroundColor Gray
Write-Host ""

# Step 1: Check if port is listening
Write-Host "[1/4] Checking if port 6001 is listening..." -ForegroundColor Cyan
try {
    $portCheck = Get-NetTCPConnection -LocalPort 6001 -State Listen -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Host "       [OK] Port 6001 is listening" -ForegroundColor Green
    } else {
        Write-Host "       [FAIL] Port 6001 is not listening" -ForegroundColor Red
        Write-Host "              Backend service may not be running" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please start the backend service:" -ForegroundColor Yellow
        Write-Host "  cd ai-trainer-backend" -ForegroundColor Cyan
        Write-Host "  npm run dev" -ForegroundColor Cyan
        exit 1
    }
} catch {
    # Fallback to netstat if Get-NetTCPConnection fails
    $portCheck = netstat -ano 2>$null | Select-String ":6001" | Select-String "LISTENING"
    if ($portCheck) {
        Write-Host "       [OK] Port 6001 is listening" -ForegroundColor Green
    } else {
        Write-Host "       [FAIL] Port 6001 is not listening" -ForegroundColor Red
        Write-Host "              Backend service may not be running" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please start the backend service:" -ForegroundColor Yellow
        Write-Host "  cd ai-trainer-backend" -ForegroundColor Cyan
        Write-Host "  npm run dev" -ForegroundColor Cyan
        exit 1
    }
}

# Step 2: Test TCP connection
Write-Host "[2/4] Testing TCP connection..." -ForegroundColor Cyan
try {
    $tcpTest = Test-NetConnection -ComputerName localhost -Port 6001 -WarningAction SilentlyContinue -ErrorAction Stop
    if ($tcpTest.TcpTestSucceeded) {
        Write-Host "       [OK] TCP connection successful" -ForegroundColor Green
    } else {
        Write-Host "       [FAIL] TCP connection failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "       [FAIL] TCP test error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Test HTTP GET request
Write-Host "[3/4] Testing HTTP GET request..." -ForegroundColor Cyan
$maxRetries = 3
$retryCount = 0
$success = $false

while ($retryCount -lt $maxRetries -and -not $success) {
    $retryCount++
    try {
        $testResponse = Invoke-WebRequest -Uri $apiUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "       [OK] HTTP request successful (Status: $($testResponse.StatusCode))" -ForegroundColor Green
        $success = $true
    }
    catch {
        if ($retryCount -lt $maxRetries) {
            Write-Host "       [RETRY $retryCount/$maxRetries] Request failed, retrying in 2 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        } else {
            Write-Host "       [FAIL] HTTP request failed after $maxRetries attempts" -ForegroundColor Red
            Write-Host "              Error: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Troubleshooting:" -ForegroundColor Cyan
            Write-Host "  1. Make sure backend is running: npm run dev" -ForegroundColor Gray
            Write-Host "  2. Wait 10-20 seconds for Next.js to compile" -ForegroundColor Gray
            Write-Host "  3. Check if there are any errors in the backend console" -ForegroundColor Gray
            Write-Host "  4. Try accessing in browser: http://localhost:6001/api/session" -ForegroundColor Gray
            exit 1
        }
    }
}

# Step 4: Verify API response format
Write-Host "[4/4] Verifying API response format..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method GET -ErrorAction Stop
    if ($null -ne $response.sessions -or $null -ne $response.count) {
        Write-Host "       [OK] API response format is correct" -ForegroundColor Green
    } else {
        Write-Host "       [WARN] Unexpected API response format" -ForegroundColor Yellow
    }
} catch {
    Write-Host "       [WARN] Could not verify response format" -ForegroundColor Yellow
}

Write-Host ""

Write-Host ""

# Prompt for device ID
$deviceId = Read-Host "Enter Device ID (e.g., VP-2025-000001)"

if ([string]::IsNullOrWhiteSpace($deviceId)) {
    Write-Host "[FAIL] Device ID cannot be empty" -ForegroundColor Red
    exit 1
}

# Send 10 data entries
Send-SessionData -DeviceId $deviceId -Count 10

Write-Host ""
Write-Host "[DONE] Test completed!" -ForegroundColor Green
