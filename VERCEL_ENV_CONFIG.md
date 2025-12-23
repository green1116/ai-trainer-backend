# Vercel 环境变量配置

## ✅ 已完成

1. ✅ Supabase 数据库迁移成功
2. ✅ Prisma Client 已生成
3. ✅ 数据库连接验证通过

## 📋 下一步：配置 Vercel 环境变量

### 步骤 1：登录 Vercel 控制台

1. 访问 https://vercel.com
2. 登录你的账户
3. 选择项目 "ai-trainer-backend"

### 步骤 2：添加环境变量

1. 进入 **Settings** → **Environment Variables**
2. 点击 **Add New** 按钮
3. 添加以下环境变量：

#### 环境变量 1：DATABASE_URL

- **Key**: `DATABASE_URL`
- **Value**: `postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`
- **Environment**: 选择所有环境（Production, Preview, Development）

**重要：**
- 使用 Transaction pooler（端口 6543）
- 这是从 Supabase 控制台复制的 Transaction pooler 连接字符串
- 这是 Vercel Serverless 环境推荐的唯一正确配置
- **不要使用端口 5432**（直接连接不适合 Serverless 环境）

#### 环境变量 2：JWT_SECRET

- **Key**: `JWT_SECRET`
- **Value**: 你的 JWT 密钥（建议使用强随机字符串）
- **Environment**: 选择所有环境

**示例：**
```
your-secret-key-change-in-production-please-use-strong-random-string
```

#### 环境变量 3：JWT_EXPIRES_IN

- **Key**: `JWT_EXPIRES_IN`
- **Value**: `7d`
- **Environment**: 选择所有环境

### 步骤 3：保存并重新部署

1. 点击 **Save** 保存所有环境变量
2. 触发重新部署：
   - **方法 1**：推送新提交到 GitHub（自动触发）
   - **方法 2**：在 **Deployments** 页面点击 **Redeploy**
   - **重要**：选择 **Skip Build Cache** 选项

### 步骤 4：验证部署

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

## 📝 环境变量总结

| Key | Value | 说明 |
|-----|-------|------|
| `DATABASE_URL` | `postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:6543/postgres` | Supabase Transaction pooler（Vercel Serverless 推荐） |
| `JWT_SECRET` | 你的 JWT 密钥 | 用于认证 |
| `JWT_EXPIRES_IN` | `7d` | Token 过期时间 |

## ⚠️ 重要提示

1. **Vercel Serverless 必须使用 Transaction pooler**（端口 6543）
2. **连接字符串格式**：使用从 Supabase 控制台复制的 Transaction pooler 连接字符串
   - 格式：`postgresql://postgres.[project-ref]:[password]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`
   - 端口必须是 **6543**（Transaction pooler）
3. **迁移时使用直接连接**（端口 5432，仅用于本地迁移）
4. **不要提交 `.env` 文件到 Git**
5. **确保所有环境变量都已配置**
6. **Transaction pooler 可能不支持从本地直接连接**，这是正常的，它专为 Serverless 环境设计

## 🔍 验证清单

- [ ] 已在 Vercel 中配置 `DATABASE_URL`（连接池，端口 6543）
- [ ] 已在 Vercel 中配置 `JWT_SECRET`
- [ ] 已在 Vercel 中配置 `JWT_EXPIRES_IN`
- [ ] 已触发重新部署
- [ ] 已访问 `/api/health` 验证连接
- [ ] 已访问 `/dashboard` 验证应用正常

## 🆘 故障排查

### 问题 1：500 错误

**检查：**
- Vercel 环境变量是否已正确配置
- 是否已重新部署
- 查看 Vercel 日志中的错误信息

### 问题 2：数据库连接失败

**检查：**
- `DATABASE_URL` 是否正确（端口 6543，带 `?pgbouncer=true`）
- Supabase 防火墙设置
- 网络连接

### 问题 3：环境变量未生效

**解决方案：**
- 确保选择了所有环境（Production, Preview, Development）
- 触发重新部署，并选择 "Skip Build Cache"

## 📚 相关文档

- `docs/SUPABASE_SETUP.md` - Supabase 完整配置指南
- `docs/VERCEL_DATABASE_URL_SETUP.md` - Vercel 数据库配置指南
- `UPDATE_TO_SUPABASE.md` - Supabase 迁移指南

