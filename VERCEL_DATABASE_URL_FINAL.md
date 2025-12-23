# Vercel DATABASE_URL 最终配置

## ✅ 正确的 Vercel 环境变量配置

根据 Supabase 官方推荐和你的项目信息，Vercel 环境变量应该配置如下：

### DATABASE_URL

**Key**: `DATABASE_URL`

**Value**: 
```
postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
```

**Environment**: 选择所有环境（Production, Preview, Development）

## 📋 配置步骤

1. **登录 Vercel 控制台**
   - 访问 https://vercel.com
   - 登录你的账户

2. **进入项目设置**
   - 选择项目 "ai-trainer-backend"
   - 点击 **Settings** → **Environment Variables**

3. **添加环境变量**
   - 点击 **Add New**
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`
   - **Environment**: 选择所有环境
   - 点击 **Save**

4. **添加其他环境变量**
   - `JWT_SECRET`: 你的 JWT 密钥
   - `JWT_EXPIRES_IN`: `7d`

5. **重新部署**
   - 在 **Deployments** 页面点击 **Redeploy**
   - **重要**：选择 **Skip Build Cache**

## ⚠️ 重要说明

1. **端口 6543**：这是 Transaction pooler 端口，Vercel Serverless 环境推荐使用
2. **不要使用端口 5432**：直接连接不适合 Serverless 环境
3. **连接字符串格式**：使用你从 Supabase 控制台复制的 Transaction pooler 连接字符串
4. **本地开发**：本地可以使用直接连接（端口 5432）进行迁移，但 Vercel 必须使用 Transaction pooler（端口 6543）

## 🔍 验证

部署完成后，访问：
```
https://ai-trainer-backend-smoky.vercel.app/api/health
```

应该返回：
```json
{
  "status": "ok",
  "database": "connected"
}
```

## 🆘 如果仍然报错 "Tenant or user not found"

1. **检查连接字符串格式**：
   - 确保从 Supabase 控制台复制的是 **Transaction pooler** 连接字符串
   - 确保端口是 **6543**
   - 确保密码正确

2. **检查 Supabase 设置**：
   - 进入 Supabase 控制台 → Settings → Database
   - 确认 Transaction pooler 已启用
   - 检查防火墙设置

3. **检查 Vercel 环境变量**：
   - 确保环境变量已正确配置
   - 确保选择了所有环境（Production, Preview, Development）
   - 确保已重新部署

