@echo off
echo 正在查找占用端口 6001 的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :6001 ^| findstr LISTENING') do (
    echo 找到进程 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo 无法停止进程 PID %%a
    ) else (
        echo 已停止进程 PID %%a
    )
)
echo.
echo 端口 6001 清理完成！
timeout /t 2 /nobreak >nul

