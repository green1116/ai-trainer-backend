# 排查 Session API 500 错误

## 问题描述

访问 `/dashboard` 时出现 500 错误：`Failed to fetch sessions: 500`

## 可能的原因

1. **数据库查询错误**
   - Session 表的外键关联问题
   - 无效的 userId 或 deviceId
   - Prisma 查询验证失败

2. **数据库连接问题**
   - Transaction pooler 连接限制
   - 查询超时

3. **数据完整性问题**
   - Session 记录中有无效的外键引用

## 解决方案

### 方案 1：检查 Vercel 日志

1. 登录 Vercel 控制台
2. 进入项目 → **Deployments**
3. 选择最新的部署
4. 点击 **Logs** 标签
5. 查找 `[Session API]` 相关的错误日志

### 方案 2：直接测试 API 端点

在浏览器中访问：
```
https://ai-trainer-backend-smoky.vercel.app/api/session
```

查看返回的错误信息。

### 方案 3：检查数据库数据

1. 登录 Supabase 控制台
2. 进入 **Table Editor**
3. 检查 `Session` 表：
   - 是否有记录
   - `userId` 是否都指向有效的 `User` 记录
   - `deviceId` 是否都指向有效的 `Device` 记录

### 方案 4：临时修复 - 添加错误处理

已更新代码，使用 `select` 明确指定字段，避免 Prisma 自动验证关联。

## 验证步骤

1. **检查健康检查端点**
   ```
   https://ai-trainer-backend-smoky.vercel.app/api/health
   ```
   应该返回 `"database": "connected"`

2. **测试 Session API**
   ```
   https://ai-trainer-backend-smoky.vercel.app/api/session
   ```
   查看返回的错误信息

3. **检查 Vercel 日志**
   - 查看详细的错误堆栈
   - 查找 Prisma 错误代码（如 P2002, P2003 等）

## 常见 Prisma 错误代码

- **P2002**: 唯一约束违反
- **P2003**: 外键约束失败
- **P1001**: 无法连接到数据库
- **P2025**: 记录未找到

## 下一步

1. 查看 Vercel 日志获取详细错误信息
2. 根据错误信息修复问题
3. 重新部署应用

