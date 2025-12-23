# Supabase 数据库配置指南

## 步骤 1：获取 Supabase 连接字符串

### 1.1 登录 Supabase 控制台
1. 访问 https://supabase.com
2. 登录你的账户
3. 选择你的项目（或创建新项目）

### 1.2 获取数据库连接字符串
1. 进入项目后，点击左侧菜单的 **Settings**（设置）
2. 选择 **Database**（数据库）
3. 在 **Connection string**（连接字符串）部分
4. 选择 **URI** 标签页
5. 复制连接字符串，格式如下：
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   或者使用直接连接（不使用连接池）：
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

### 1.3 连接字符串格式说明
- **使用连接池（推荐）**：端口 `6543`，适合生产环境，支持更多并发连接
- **直接连接**：端口 `5432`，适合迁移和一次性操作

## 步骤 2：配置本地环境变量

### 2.1 创建 `.env` 文件
在 `ai-trainer-backend` 目录下创建 `.env` 文件：

```bash
# Supabase 数据库连接字符串
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# JWT 密钥（用于认证）
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

### 2.2 替换占位符
将连接字符串中的占位符替换为实际值：
- `[project-ref]`: 你的 Supabase 项目引用 ID
- `[password]`: 你的数据库密码（在 Supabase 设置中可以重置）
- `[region]`: 你的 Supabase 项目区域（如 `us-east-1`）

## 步骤 3：运行数据库迁移

### 3.1 使用迁移模式（推荐）
```bash
cd ai-trainer-backend
npx prisma migrate dev
```

这会：
- 创建新的迁移文件
- 应用迁移到 Supabase 数据库
- 生成 Prisma Client

### 3.2 如果已有迁移文件
```bash
# 仅应用迁移（不创建新迁移）
npx prisma migrate deploy
```

### 3.3 生成 Prisma Client
```bash
npx prisma generate
```

## 步骤 4：配置 Vercel 环境变量

### 4.1 在 Vercel 中添加环境变量
1. 登录 Vercel 控制台：https://vercel.com
2. 选择项目 "ai-trainer-backend"
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | 你的 Supabase 连接字符串 | Production, Preview, Development |
| `JWT_SECRET` | 你的 JWT 密钥 | Production, Preview, Development |
| `JWT_EXPIRES_IN` | `7d` | Production, Preview, Development |

### 4.2 使用连接池（推荐）
对于 Vercel 生产环境，**强烈建议使用连接池**：
- 端口：`6543`
- 参数：`?pgbouncer=true`

示例：
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 4.3 重新部署
配置环境变量后，需要重新部署：
- 方法 1：推送新提交到 GitHub（自动触发）
- 方法 2：在 Vercel Deployments 页面点击 "Redeploy"

## 步骤 5：验证配置

### 5.1 本地验证
```bash
# 测试数据库连接
npx prisma db pull

# 查看数据库状态
npx prisma studio
```

### 5.2 生产环境验证
部署完成后，访问健康检查端点：
```
https://ai-trainer-backend-smoky.vercel.app/api/health
```

应该返回：
```json
{
  "status": "ok",
  "database": "connected",
  "counts": {
    "users": 0,
    "sessions": 0
  }
}
```

## 常见问题

### Q1: 连接超时
**原因：** Supabase 可能限制了 IP 访问

**解决方案：**
1. 在 Supabase 控制台 → Settings → Database
2. 检查 **Connection pooling** 设置
3. 确保使用连接池模式（端口 6543）

### Q2: 迁移失败
**原因：** 数据库权限或连接问题

**解决方案：**
1. 使用直接连接（端口 5432）进行迁移
2. 迁移完成后，切换回连接池（端口 6543）用于应用

### Q3: 连接数限制
**原因：** Supabase 免费版有连接数限制

**解决方案：**
- 使用连接池（pgbouncer）模式
- 确保应用正确关闭数据库连接
- 考虑升级到付费计划

### Q4: 密码包含特殊字符
**原因：** URL 中特殊字符需要编码

**解决方案：**
- 在 Supabase 控制台重置密码，使用简单密码
- 或对密码进行 URL 编码：
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - 等等

## Supabase 数据库管理

### 查看数据库
1. 在 Supabase 控制台 → **Table Editor**
2. 查看所有表和数据

### 运行 SQL 查询
1. 在 Supabase 控制台 → **SQL Editor**
2. 编写和执行 SQL 查询

### 备份数据库
1. 在 Supabase 控制台 → **Settings** → **Database**
2. 使用 **Backups** 功能

## 安全最佳实践

1. **不要提交 `.env` 文件**
   - 确保 `.env` 在 `.gitignore` 中
   - 使用环境变量管理敏感信息

2. **使用连接池**
   - 生产环境使用连接池模式
   - 减少数据库连接数

3. **定期更新密码**
   - 定期更换数据库密码
   - 更新所有环境变量

4. **限制数据库访问**
   - 在 Supabase 中配置 IP 白名单（如需要）
   - 使用 Row Level Security (RLS) 策略

## 相关文件

- `prisma/schema.prisma` - Prisma schema 定义
- `lib/db.ts` - 数据库客户端初始化
- `.env` - 本地环境变量（不提交到 Git）
- `docs/VERCEL_DATABASE_URL_SETUP.md` - Vercel 配置指南

## 下一步

1. ✅ 获取 Supabase 连接字符串
2. ✅ 配置本地 `.env` 文件
3. ✅ 运行数据库迁移
4. ✅ 配置 Vercel 环境变量
5. ✅ 验证数据库连接
6. ✅ 测试 API 端点

