# Supabase 迁移快速指南

## ⚠️ 重要提示

**对于数据库迁移，请使用直接连接（端口 5432），而不是连接池（端口 6543）**

连接池模式不支持某些迁移操作，会导致迁移失败。

## 步骤 1：获取 Supabase 连接字符串

1. 登录 Supabase 控制台：https://supabase.com
2. 选择你的项目
3. 进入 **Settings** → **Database**
4. 在 **Connection string** 部分，选择 **URI** 标签
5. **使用直接连接（端口 5432）**：
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
   ⚠️ **注意**：使用端口 `5432`，不要使用 `6543`（连接池）

## 步骤 2：更新 .env 文件

在 `ai-trainer-backend/.env` 文件中更新 `DATABASE_URL`：

```bash
# 迁移时使用直接连接（端口 5432）
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# JWT 配置
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

## 步骤 3：运行迁移

```bash
cd ai-trainer-backend
npx prisma migrate deploy
```

或者，如果你想创建新的迁移：

```bash
npx prisma migrate dev
```

## 步骤 4：生成 Prisma Client

```bash
npx prisma generate
```

## 步骤 5：验证迁移

```bash
# 测试数据库连接
npx prisma db pull

# 查看数据库结构
npx prisma studio
```

## 步骤 6：配置 Vercel（生产环境）

迁移完成后，在 Vercel 中配置环境变量：

1. 登录 Vercel 控制台
2. 进入项目 → Settings → Environment Variables
3. 添加 `DATABASE_URL`：
   - **生产环境**：可以使用连接池（端口 6543）
   - **迁移时**：使用直接连接（端口 5432）

**生产环境连接字符串（使用连接池）：**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

## 故障排查

### 问题 1：迁移失败 - 连接超时
**解决方案：**
- 确保使用直接连接（端口 5432）
- 检查 Supabase 防火墙设置
- 确认密码正确

### 问题 2：迁移失败 - 权限错误
**解决方案：**
- 确保使用 `postgres` 用户连接
- 检查 Supabase 项目设置中的数据库权限

### 问题 3：迁移后应用无法连接
**解决方案：**
- 生产环境使用连接池（端口 6543）
- 确保 Vercel 环境变量已正确配置

## 下一步

1. ✅ 更新 `.env` 文件中的 `DATABASE_URL`
2. ✅ 运行 `npx prisma migrate deploy`
3. ✅ 运行 `npx prisma generate`
4. ✅ 配置 Vercel 环境变量
5. ✅ 重新部署应用

