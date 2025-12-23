# Vercel 500 错误排查指南

## 问题描述

访问 `/dashboard` 页面时出现 500 错误：`Failed to fetch sessions: 500`

## 可能的原因

### 1. 数据库连接问题（最可能）

**症状：**
- API 返回 500 错误
- 错误信息可能包含 "Can't reach database" 或 "P1001"

**解决方案：**

1. **检查 Vercel 环境变量**
   - 登录 Vercel 控制台
   - 进入项目设置 → Environment Variables
   - 确认 `DATABASE_URL` 已正确配置
   - 格式示例：`postgresql://user:password@host:port/database?schema=public`

2. **验证数据库连接**
   ```bash
   # 在本地测试数据库连接
   cd ai-trainer-backend
   npx prisma db pull
   ```

3. **检查数据库是否可访问**
   - 确认数据库服务正在运行
   - 检查防火墙设置
   - 确认数据库允许来自 Vercel IP 的连接

### 2. 数据库迁移未执行

**症状：**
- 数据库表结构不匹配
- 错误信息可能包含 "column does not exist" 或 "relation does not exist"

**解决方案：**

1. **在 Vercel 构建时运行迁移**
   - 检查 `package.json` 中的 `build` 脚本
   - 确保包含 `prisma migrate deploy` 或 `prisma db push`

2. **手动运行迁移**
   ```bash
   # 在 Vercel 环境中运行（通过 Vercel CLI）
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

### 3. Session 模型字段缺失

**症状：**
- 错误信息可能包含 "userId" 或 "required field"

**解决方案：**

1. **检查数据库中的 Session 记录**
   - 确认所有 Session 记录都有 `userId` 字段
   - 如果没有，需要更新现有数据或运行迁移

2. **运行数据库迁移**
   ```bash
   npx prisma migrate dev --name add_user_id_to_session_required
   ```

## 快速检查清单

- [ ] Vercel 环境变量 `DATABASE_URL` 已配置
- [ ] 数据库服务正在运行
- [ ] 数据库允许来自 Vercel 的连接
- [ ] Prisma schema 已更新并迁移
- [ ] 构建日志中没有数据库连接错误

## 调试步骤

### 1. 查看 Vercel 构建日志

1. 登录 Vercel 控制台
2. 进入项目 → Deployments
3. 点击最新的部署
4. 查看 "Build Logs" 和 "Function Logs"

### 2. 检查 API 响应

```bash
# 直接测试 API 端点
curl https://ai-trainer-backend-smoky.vercel.app/api/session
```

### 3. 查看详细错误信息

在 Vercel 函数日志中查找：
- 数据库连接错误
- Prisma 查询错误
- 类型错误

## 临时解决方案

如果数据库暂时不可用，可以修改 API 返回空数组而不是错误：

```typescript
// 在 app/api/session/route.ts 中
// 如果数据库连接失败，返回空数组
catch (error) {
  return Response.json({ 
    sessions: [],
    pagination: { limit: 10, offset: 0, total: 0, hasMore: false },
    message: '数据库暂时不可用'
  }, { status: 200, headers: corsHeaders });
}
```

## 相关文件

- `app/api/session/route.ts` - Session API 端点
- `prisma/schema.prisma` - 数据库 schema
- `.env` - 环境变量配置（本地）
- Vercel Environment Variables - 生产环境变量

## 下一步

1. 检查 Vercel 环境变量配置
2. 查看 Vercel 函数日志获取详细错误信息
3. 根据错误信息采取相应的修复措施

