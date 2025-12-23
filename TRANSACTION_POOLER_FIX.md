# Transaction Pooler Prepared Statement 错误修复

## 问题描述

使用 Supabase Transaction pooler（端口 6543）时，出现错误：
```
prepared statement "s0" already exists
```

## 原因

Prisma Client 默认使用 prepared statements 来优化查询性能。但在连接池环境中，prepared statements 会在不同的连接之间共享，导致冲突。

## 解决方案

### 方案 1：在连接字符串中禁用 prepared statements（推荐）

在 Vercel 环境变量中，将 `DATABASE_URL` 更新为：

```
postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

添加参数：
- `pgbouncer=true` - 启用 pgbouncer 模式
- `connection_limit=1` - 限制连接数（可选）

### 方案 2：使用直接连接（不推荐用于生产）

如果 Transaction pooler 仍有问题，可以临时使用直接连接（端口 5432）：

```
postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

**注意**：直接连接不适合 Serverless 环境，可能导致连接数限制问题。

### 方案 3：配置 Prisma Client（已实现）

已在 `lib/db.ts` 中配置 Prisma Client，优化了连接管理。

## 验证

访问调试端点验证修复：
```
https://ai-trainer-backend-smoky.vercel.app/api/session/debug
```

应该返回：
```json
{
  "test": "all_tests",
  "status": "success",
  "results": {
    "databaseConnected": true,
    "sessionCount": 0,
    ...
  }
}
```

## 最佳实践

1. **生产环境使用 Transaction pooler**（端口 6543）
2. **迁移时使用直接连接**（端口 5432）
3. **确保连接字符串包含 `pgbouncer=true`**
4. **监控连接数和性能**

## 相关文档

- Supabase Transaction Pooler: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- Prisma Connection Pooling: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

