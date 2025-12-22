# Connection Diagnostics Script
# Helps diagnose API connection issues

$apiUrl = "http://localhost:6001/api/session"

Write-Host ""
Write-Host "=== API Connection Diagnostics ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if port is listening
Write-Host "[1] Checking port 6001..." -ForegroundColor Yellow
try {
    $portCheck = Get-NetTCPConnection -LocalPort 6001 -State Listen -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Host "    [OK] Port 6001 is listening" -ForegroundColor Green
        Write-Host "    Process ID: $($portCheck.OwningProcess)" -ForegroundColor Gray
    } else {
        # Fallback to netstat
        $portCheck = netstat -ano 2>$null | Select-String ":6001" | Select-String "LISTENING"
        if ($portCheck) {
            Write-Host "    [OK] Port 6001 is listening" -ForegroundColor Green
            $portInfo = $portCheck.ToString() -split '\s+'
            if ($portInfo.Count -gt 0) {
                Write-Host "    Process ID: $($portInfo[-1])" -ForegroundColor Gray
            }
        } else {
            Write-Host "    [FAIL] Port 6001 is not listening" -ForegroundColor Red
            Write-Host "    Backend service is not running" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "    Solution: Start backend service" -ForegroundColor Cyan
            Write-Host "      cd ai-trainer-backend" -ForegroundColor Gray
            Write-Host "      npm run dev" -ForegroundColor Gray
            exit 1
        }
    }
} catch {
    Write-Host "    [FAIL] Error checking port: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Test TCP connection
Write-Host "[2] Testing TCP connection..." -ForegroundColor Yellow
try {
    $tcpTest = Test-NetConnection -ComputerName localhost -Port 6001 -WarningAction SilentlyContinue -ErrorAction Stop
    if ($tcpTest.TcpTestSucceeded) {
        Write-Host "    [OK] TCP connection successful" -ForegroundColor Green
    } else {
        Write-Host "    [FAIL] TCP connection failed" -ForegroundColor Red
        Write-Host "    This might be a firewall issue" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    [FAIL] TCP test error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Test HTTP connection
Write-Host "[3] Testing HTTP connection..." -ForegroundColor Yellow
try {
    $httpTest = Invoke-WebRequest -Uri $apiUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "    [OK] HTTP connection successful" -ForegroundColor Green
    Write-Host "    Status Code: $($httpTest.StatusCode)" -ForegroundColor Gray
    Write-Host "    Content Length: $($httpTest.Content.Length) bytes" -ForegroundColor Gray
} catch {
    Write-Host "    [FAIL] HTTP connection failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Message -like "*timeout*") {
        Write-Host ""
        Write-Host "    Possible causes:" -ForegroundColor Cyan
        Write-Host "      - Next.js is still compiling (wait 10-20 seconds)" -ForegroundColor Gray
        Write-Host "      - Backend is stuck or crashed" -ForegroundColor Gray
        Write-Host "      - Network/firewall blocking connection" -ForegroundColor Gray
    }
    
    if ($_.Exception.Message -like "*refused*" -or $_.Exception.Message -like "*cannot connect*" -or $_.Exception.Message -like "*connection*") {
        Write-Host ""
        Write-Host "    Possible causes:" -ForegroundColor Cyan
        Write-Host "      - Backend service is not running" -ForegroundColor Gray
        Write-Host "      - Backend is running on a different port" -ForegroundColor Gray
        Write-Host "      - Firewall is blocking the connection" -ForegroundColor Gray
    }
}

Write-Host ""

# 4. Test with curl (if available)
Write-Host "[4] Testing with curl (if available)..." -ForegroundColor Yellow
$curlPath = Get-Command curl -ErrorAction SilentlyContinue
if ($curlPath) {
    try {
        $curlResult = curl -s -w "`nHTTP Status: %{http_code}`nTime: %{time_total}s" -o $null $apiUrl 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    [OK] curl test successful" -ForegroundColor Green
            Write-Host $curlResult -ForegroundColor Gray
        } else {
            Write-Host "    [FAIL] curl test failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "    [SKIP] curl test skipped" -ForegroundColor Gray
    }
} else {
    Write-Host "    [SKIP] curl not available" -ForegroundColor Gray
}

Write-Host ""

# 5. Check Node.js processes
Write-Host "[5] Checking Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "    [OK] Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
    foreach ($proc in $nodeProcesses) {
        Write-Host "    PID: $($proc.Id), Memory: $([math]::Round($proc.WorkingSet64/1MB, 2)) MB" -ForegroundColor Gray
    }
} else {
    Write-Host "    [WARN] No Node.js processes found" -ForegroundColor Yellow
    Write-Host "    Backend service may not be running" -ForegroundColor Gray
}

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests passed, try running the test script:" -ForegroundColor Yellow
Write-Host "  .\scripts\test-session-upload.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "If tests failed, check:" -ForegroundColor Yellow
Write-Host "  1. Backend service is running: npm run dev" -ForegroundColor Gray
Write-Host "  2. Wait 10-20 seconds after starting for compilation" -ForegroundColor Gray
Write-Host "  3. Check backend console for errors" -ForegroundColor Gray
Write-Host "  4. Try accessing in browser: http://localhost:6001/api/session" -ForegroundColor Gray
Write-Host ""

