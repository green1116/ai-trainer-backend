# 修复 Prepared Statement 错误

## 问题

使用 Supabase Transaction pooler 时，出现错误：
```
prepared statement "s0" already exists
```

## 根本原因

Prisma 默认使用 prepared statements 来优化查询。但在 Transaction pooler 环境中，连接会被重用，导致 prepared statements 冲突。

## 解决方案

### 方案 1：在连接字符串中添加 `?pgbouncer=true`（推荐）

在 Vercel 环境变量中，确保 `DATABASE_URL` 包含 `?pgbouncer=true` 参数：

```
postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

这个参数会告诉 Prisma 禁用 prepared statements，从而避免冲突。

### 方案 2：检查当前连接字符串

1. 登录 Vercel 控制台
2. 进入项目 → Settings → Environment Variables
3. 检查 `DATABASE_URL` 是否包含 `?pgbouncer=true`
4. 如果没有，添加该参数并重新部署

### 方案 3：使用直接连接（不推荐）

如果 Transaction pooler 仍有问题，可以临时使用直接连接（端口 5432）：

```
postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

**注意**：直接连接不适合 Serverless 环境，可能导致连接数限制问题。

## 验证

修复后，访问：
```
https://ai-trainer-backend-smoky.vercel.app/api/session
```

应该返回：
```json
{
  "sessions": [],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 0,
    "hasMore": false
  },
  "message": "数据库中没有会话。请先创建一个会话。"
}
```

## 相关文档

- Supabase Connection Pooling: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- Prisma with PgBouncer: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer

