# A-5 第五步: 用 API 验证 Adapter 是否工作
# Test Device Adapter via API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "A-5: 测试 Device Adapter API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiBaseUrl = "http://localhost:6001"
$testDeviceId = "VP-2025-000001"

# 检查 API 是否可访问
Write-Host "1. 检查 API 是否可访问..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$apiBaseUrl/api/device" -Method GET -ErrorAction Stop -TimeoutSec 5
    Write-Host "  [OK] API 可访问" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] API 不可访问: $_" -ForegroundColor Red
    Write-Host "  请确保后端服务正在运行 (npm run dev)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 示例 1: 启动设备
Write-Host "2. 示例: 启动设备" -ForegroundColor Yellow
$startCommand = @{
    deviceId = $testDeviceId
    command = @{
        action = "start"
    }
} | ConvertTo-Json -Depth 10

Write-Host "  请求: POST $apiBaseUrl/api/device/command" -ForegroundColor Gray
Write-Host "  命令: { action: 'start' }" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$apiBaseUrl/api/device/command" -Method POST -Body $startCommand -ContentType "application/json" -ErrorAction Stop
    Write-Host "  [OK] 启动命令发送成功" -ForegroundColor Green
    Write-Host "  响应: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $errorDetails = $_.ErrorDetails.Message
    if ($errorDetails) {
        try {
            $errorJson = $errorDetails | ConvertFrom-Json
            Write-Host "  [ERROR] $($errorJson.error): $($errorJson.message)" -ForegroundColor Red
        } catch {
            Write-Host "  [ERROR] $errorDetails" -ForegroundColor Red
        }
    } else {
        Write-Host "  [ERROR] $_" -ForegroundColor Red
    }
}

Write-Host ""

# 示例 2: 设置频率
Write-Host "3. 示例: 设置频率" -ForegroundColor Yellow
$setCommand = @{
    deviceId = $testDeviceId
    command = @{
        action = "set"
        params = @{
            frequencyHz = 20
            intensity = 5
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "  请求: POST $apiBaseUrl/api/device/command" -ForegroundColor Gray
Write-Host "  命令: { action: 'set', params: { frequencyHz: 20, intensity: 5 } }" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$apiBaseUrl/api/device/command" -Method POST -Body $setCommand -ContentType "application/json" -ErrorAction Stop
    Write-Host "  [OK] 设置命令发送成功" -ForegroundColor Green
    Write-Host "  响应: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $errorDetails = $_.ErrorDetails.Message
    if ($errorDetails) {
        try {
            $errorJson = $errorDetails | ConvertFrom-Json
            Write-Host "  [ERROR] $($errorJson.error): $($errorJson.message)" -ForegroundColor Red
        } catch {
            Write-Host "  [ERROR] $errorDetails" -ForegroundColor Red
        }
    } else {
        Write-Host "  [ERROR] $_" -ForegroundColor Red
    }
}

Write-Host ""

# 示例 3: 停止设备
Write-Host "4. 示例: 停止设备" -ForegroundColor Yellow
$stopCommand = @{
    deviceId = $testDeviceId
    command = @{
        action = "stop"
    }
} | ConvertTo-Json -Depth 10

Write-Host "  请求: POST $apiBaseUrl/api/device/command" -ForegroundColor Gray
Write-Host "  命令: { action: 'stop' }" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$apiBaseUrl/api/device/command" -Method POST -Body $stopCommand -ContentType "application/json" -ErrorAction Stop
    Write-Host "  [OK] 停止命令发送成功" -ForegroundColor Green
    Write-Host "  响应: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $errorDetails = $_.ErrorDetails.Message
    if ($errorDetails) {
        try {
            $errorJson = $errorDetails | ConvertFrom-Json
            Write-Host "  [ERROR] $($errorJson.error): $($errorJson.message)" -ForegroundColor Red
        } catch {
            Write-Host "  [ERROR] $errorDetails" -ForegroundColor Red
        }
    } else {
        Write-Host "  [ERROR] $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

