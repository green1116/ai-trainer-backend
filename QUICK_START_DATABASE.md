# 快速启动数据库指南

## ⚠️ 当前问题
数据库服务器未运行，导致无法连接 `localhost:5432`

## ✅ 解决方案

### 方案 1: 使用 Docker（推荐）

**步骤：**

1. **启动 Docker Desktop**
   - 在 Windows 开始菜单搜索 "Docker Desktop"
   - 点击启动，等待 Docker 图标在系统托盘显示为运行状态

2. **启动数据库容器**
   ```powershell
   cd ai-trainer-backend
   docker-compose up -d postgres
   ```

3. **验证数据库运行**
   ```powershell
   docker ps
   ```
   应该看到 `ai-trainer-db` 容器在运行

4. **运行数据库迁移**
   ```powershell
   npx prisma db push
   ```

5. **重启后端服务**
   ```powershell
   npm run dev
   ```

### 方案 2: 使用本地 PostgreSQL（如果已安装）

1. **确保 PostgreSQL 服务运行**
   ```powershell
   # 检查服务状态
   Get-Service postgresql*
   ```

2. **创建数据库**
   ```sql
   createdb ai_trainer
   ```
   或使用 psql:
   ```sql
   psql -U postgres
   CREATE DATABASE ai_trainer;
   ```

3. **更新 .env 文件**
   确保 `DATABASE_URL` 正确：
   ```env
   DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/ai_trainer
   ```

4. **运行数据库迁移**
   ```powershell
   npx prisma db push
   ```

## 🔍 验证数据库连接

运行以下命令测试连接：
```powershell
npx prisma db push
```

如果成功，应该看到：
```
✔ Your database is now in sync with your Prisma schema.
```

## 📝 常见问题

### Docker Desktop 无法启动
- 确保已安装 Docker Desktop
- 检查 Windows 功能中是否启用了虚拟化
- 尝试以管理员身份运行

### 端口 5432 被占用
```powershell
# 查找占用端口的进程
netstat -ano | findstr :5432

# 停止进程（替换 PID 为实际进程ID）
taskkill /PID <PID> /F
```

### 数据库连接字符串错误
检查 `.env` 文件中的 `DATABASE_URL` 格式：
```
postgresql://用户名:密码@localhost:5432/数据库名
```

