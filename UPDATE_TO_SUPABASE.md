# 更新到 Supabase 数据库

## ✅ 已完成

1. ✅ 本地数据库迁移成功
2. ✅ Prisma Client 已生成
3. ✅ 迁移文件已修复并测试

## 📋 下一步：配置 Supabase

### 步骤 1：获取 Supabase 连接字符串

1. **登录 Supabase 控制台**
   - 访问：https://supabase.com
   - 登录你的账户

2. **选择项目**
   - 选择你的项目（或创建新项目）

3. **获取连接字符串**
   - 进入 **Settings** → **Database**
   - 在 **Connection string** 部分，选择 **URI** 标签
   - **复制直接连接字符串（端口 5432，用于迁移）**：
     ```
     postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
     ```

### 步骤 2：更新 .env 文件

在 `ai-trainer-backend/.env` 文件中，将 `DATABASE_URL` 更新为 Supabase 连接字符串：

```bash
# Supabase 数据库连接字符串（迁移时使用直接连接，端口 5432）
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# JWT 配置
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

**重要提示：**
- 替换 `[project-ref]` 为你的 Supabase 项目引用 ID
- 替换 `[password]` 为你的数据库密码
- 替换 `[region]` 为你的项目区域（如 `us-east-1`）
- **迁移时使用端口 5432**（直接连接）

### 步骤 3：运行迁移到 Supabase

更新 `.env` 后，运行以下命令将迁移应用到 Supabase：

```bash
cd ai-trainer-backend
npx prisma migrate deploy
```

### 步骤 4：生成 Prisma Client（如果需要）

```bash
npx prisma generate
```

### 步骤 5：验证 Supabase 连接

```bash
# 测试数据库连接
npx prisma db pull

# 查看数据库结构
npx prisma studio
```

### 步骤 6：配置 Vercel 环境变量

**生产环境使用连接池（端口 6543）：**

1. 登录 Vercel 控制台：https://vercel.com
2. 进入项目 "ai-trainer-backend" → **Settings** → **Environment Variables**
3. 添加环境变量：

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` | Production, Preview, Development |
| `JWT_SECRET` | 你的 JWT 密钥 | Production, Preview, Development |
| `JWT_EXPIRES_IN` | `7d` | Production, Preview, Development |

**注意：**
- 生产环境使用连接池（端口 6543，带 `?pgbouncer=true`）
- 迁移时使用直接连接（端口 5432）

### 步骤 7：重新部署 Vercel

配置环境变量后，触发重新部署：
- 推送新提交到 GitHub（自动触发）
- 或在 Vercel Deployments 页面点击 "Redeploy"

## 🔍 验证清单

- [ ] 已获取 Supabase 连接字符串
- [ ] 已更新 `.env` 文件中的 `DATABASE_URL`
- [ ] 已运行 `npx prisma migrate deploy` 到 Supabase
- [ ] 已生成 Prisma Client（如需要）
- [ ] 已验证 Supabase 数据库连接
- [ ] 已在 Vercel 中配置 `DATABASE_URL`（使用连接池）
- [ ] 已重新部署 Vercel 应用
- [ ] 已访问 `/api/health` 验证数据库连接

## 📚 相关文档

- `docs/SUPABASE_SETUP.md` - 完整的 Supabase 配置指南
- `SUPABASE_MIGRATION_QUICK_START.md` - 快速迁移指南
- `docs/VERCEL_DATABASE_URL_SETUP.md` - Vercel 配置指南

## ⚠️ 重要提示

1. **迁移时使用直接连接（端口 5432）**
2. **生产环境使用连接池（端口 6543）**
3. **不要提交 `.env` 文件到 Git**
4. **确保密码中的特殊字符已正确 URL 编码**

## 🆘 需要帮助？

如果遇到问题，请检查：
1. Supabase 连接字符串格式是否正确
2. 数据库密码是否正确
3. Supabase 防火墙设置是否允许连接
4. Vercel 环境变量是否已正确配置

