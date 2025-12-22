# Prisma Schema 字段不匹配修复

## 问题描述

构建时出现 TypeScript 错误：
```
Type error: Object literal may only specify known properties, and 'passwordHash' does not exist in type 'UserCreateInput'
```

## 原因

代码中使用了 Prisma schema 中不存在的字段：
- `passwordHash` - User 模型中不存在
- `name` - User 模型中不存在
- `createdAt` - User 模型中不存在
- `userPreferences` - 模型不存在

## 修复方案

### 1. 移除不存在的字段引用

**修复的文件：**
- `app/api/auth/register/route.ts`
- `app/api/auth/route.ts`
- `app/api/users/me/route.ts`

### 2. 更新字段选择

将不存在的字段替换为实际存在的字段：

**之前：**
```typescript
user: {
  id: user.id,
  email: user.email,
  name: user.name,  // ❌ 不存在
  createdAt: user.createdAt,  // ❌ 不存在
}
```

**之后：**
```typescript
user: {
  id: user.id,
  email: user.email,
  plan: user.plan,  // ✅ 存在
  role: user.role,  // ✅ 存在
  clinicId: user.clinicId,  // ✅ 存在
}
```

### 3. 临时禁用密码认证

由于 User 模型不包含 `passwordHash` 字段，暂时禁用了密码验证：

```typescript
// 注意：当前 User 模型不包含 passwordHash 字段
// 如果需要密码认证，需要更新 Prisma schema 添加该字段
// const isValid = await verifyPassword(password, user.passwordHash)
```

## 当前 User 模型结构

根据 `prisma/schema.prisma`：

```prisma
model User {
  id       String  @id @default(uuid())
  email    String  @unique
  plan     String  @default("free")
  role     String?
  clinicId String?
  clinic   Clinic? @relation(fields: [clinicId], references: [id])
}
```

## 如果需要添加密码支持

### 方案 1：更新 Prisma Schema

在 `prisma/schema.prisma` 中添加字段：

```prisma
model User {
  id          String  @id @default(uuid())
  email       String  @unique
  passwordHash String?  // 添加密码哈希字段
  name        String?  // 添加名称字段
  plan        String  @default("free")
  role        String?
  clinicId    String?
  clinic      Clinic? @relation(fields: [clinicId], references: [id])
  createdAt   DateTime @default(now())  // 添加创建时间
  updatedAt   DateTime @updatedAt  // 添加更新时间
}
```

然后运行迁移：

```bash
npx prisma migrate dev --name add_user_password_and_name
```

### 方案 2：使用外部认证服务

- 使用 Auth0、Firebase Auth 等第三方服务
- 使用 OAuth（Google、GitHub 等）
- 使用 JWT-only 认证（当前方案）

## 当前状态

✅ **已修复**：
- 移除了所有对不存在字段的引用
- 更新了 API 响应格式以匹配实际 schema
- 清理了未使用的导入

⚠️ **临时限制**：
- 密码认证暂时禁用（仅检查用户是否存在）
- 用户注册不需要密码（仅需 email）
- 用户信息不包含 name 和 createdAt

## 后续工作

1. **如果需要密码认证**：
   - 更新 Prisma schema 添加 `passwordHash` 字段
   - 运行数据库迁移
   - 恢复密码验证逻辑

2. **如果需要用户名称**：
   - 更新 Prisma schema 添加 `name` 字段
   - 运行数据库迁移
   - 更新 API 以支持名称字段

3. **如果需要用户偏好设置**：
   - 创建 `UserPreferences` 模型
   - 建立与 User 的关系
   - 实现偏好设置 API

## 参考

- [Prisma Schema 文档](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [Prisma 迁移指南](https://www.prisma.io/docs/guides/migrate)

