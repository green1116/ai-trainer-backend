# 启动数据库脚本

Write-Host "=== 启动 PostgreSQL 数据库 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否运行
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker 正在运行" -ForegroundColor Green
    Write-Host ""
    
    # 检查容器是否已存在
    $containerExists = docker ps -a --filter "name=ai-trainer-db" --format "{{.Names}}" 2>&1
    if ($containerExists -eq "ai-trainer-db") {
        Write-Host "数据库容器已存在，正在启动..." -ForegroundColor Yellow
        docker start ai-trainer-db
    } else {
        Write-Host "正在创建并启动数据库容器..." -ForegroundColor Yellow
        docker-compose up -d postgres
    }
    
    Write-Host ""
    Write-Host "等待数据库启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # 检查数据库是否就绪
    $dbReady = docker exec ai-trainer-db pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 数据库已启动并运行在 localhost:5432" -ForegroundColor Green
    } else {
        Write-Host "⚠️  数据库可能还在启动中，请稍候..." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Docker 未运行" -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择以下方式之一启动数据库：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "方案 1: 使用 Docker（推荐）" -ForegroundColor Cyan
    Write-Host "  1. 启动 Docker Desktop" -ForegroundColor Gray
    Write-Host "  2. 运行此脚本 again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "方案 2: 使用本地 PostgreSQL" -ForegroundColor Cyan
    Write-Host "  1. 确保 PostgreSQL 已安装并运行在 localhost:5432" -ForegroundColor Gray
    Write-Host "  2. 创建数据库: createdb ai_trainer" -ForegroundColor Gray
    Write-Host "  3. 更新 .env 文件中的 DATABASE_URL" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "数据库连接字符串示例：" -ForegroundColor Cyan
Write-Host "  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_trainer" -ForegroundColor Gray
Write-Host ""

