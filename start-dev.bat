@echo off
echo 正在清理端口 6001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :6001 ^| findstr LISTENING') do (
    echo 停止进程 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo 启动开发服务器...
call npm run dev

