# 清理端口 6001 的 PowerShell 脚本
Write-Host "正在查找占用端口 6001 的进程..." -ForegroundColor Yellow

$processIds = @()
$netstatOutput = netstat -ano | findstr :6001

if ($netstatOutput) {
    foreach ($line in $netstatOutput) {
        $parts = $line -split '\s+'
        $processId = $parts[-1]
        if ($processId -match '^\d+$') {
            $processIds += [int]$processId
        }
    }
    $processIds = $processIds | Sort-Object -Unique
}

if ($processIds.Count -gt 0) {
    Write-Host "找到以下进程占用端口 6001: $($processIds -join ', ')" -ForegroundColor Red
    foreach ($processId in $processIds) {
        try {
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "正在停止进程 PID $processId ($($proc.ProcessName))..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "✓ 已停止进程 PID $processId" -ForegroundColor Green
            } else {
                Write-Host "进程 PID $processId 不存在或已停止" -ForegroundColor Yellow
            }
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "无法停止进程 PID $processId : $errorMsg" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "`n端口 6001 已清理完成！" -ForegroundColor Green
} else {
    Write-Host "✓ 端口 6001 未被占用" -ForegroundColor Green
}

