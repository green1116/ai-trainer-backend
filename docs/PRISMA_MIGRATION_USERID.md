# Prisma Schema 更新：添加 userId 字段到 Session 模型

## 更新内容

### 1. Session 模型

添加了 `userId` 字段和与 `User` 模型的关联：

```prisma
model Session {
  id        String    @id @default(uuid())
  userId    String?   // 新增：关联到 User 模型（可选）
  deviceId  String
  clinicId  String?
  // ... 其他字段
  user      User?     @relation(fields: [userId], references: [id]) // 新增：关联关系
  device    Device    @relation(fields: [deviceId], references: [id])
  clinic    Clinic?   @relation(fields: [clinicId], references: [id])
  deviceData DeviceData[]
}
```

### 2. User 模型

添加了反向关联：

```prisma
model User {
  id       String    @id @default(uuid())
  // ... 其他字段
  sessions Session[] // 新增：反向关联
}
```

## 数据库迁移

### 步骤 1：生成迁移文件

```bash
cd ai-trainer-backend
npx prisma migrate dev --name add_user_id_to_session
```

这将：
- 创建迁移文件
- 应用迁移到开发数据库
- 重新生成 Prisma Client

### 步骤 2：在生产环境应用迁移

**对于 Vercel 部署**：

迁移会在构建时自动运行（如果配置了 `prisma migrate deploy`）。

或者手动运行：

```bash
npx prisma migrate deploy
```

### 步骤 3：更新现有数据（可选）

如果数据库中有现有的 Session 记录，可能需要更新它们：

```sql
-- 示例：将现有 Session 关联到用户（根据业务逻辑调整）
UPDATE "Session" 
SET "userId" = (SELECT id FROM "User" WHERE email = 'user@example.com')
WHERE "userId" IS NULL;
```

## 代码更新

### 已更新的文件

1. **`app/api/report/[sessionId]/route.ts`**
   - 恢复了 `userId: user.id` 过滤条件
   - 在报告响应中包含 `userId` 字段

2. **`app/api/report/route.ts`**
   - 恢复了 `userId: user.id` 过滤条件
   - 在报告响应中包含 `userId` 字段

### 使用示例

```typescript
// 查询用户的会话
const sessions = await db.session.findMany({
  where: {
    userId: user.id,
  },
});

// 创建会话时关联用户
const session = await db.session.create({
  data: {
    userId: user.id,
    deviceId: device.id,
    startedAt: new Date(),
    // ... 其他字段
  },
});
```

## 注意事项

1. **`userId` 是可选的**（`String?`）：
   - 允许现有数据在没有 `userId` 的情况下继续工作
   - 新创建的 Session 应该设置 `userId`

2. **向后兼容**：
   - 现有代码不会因为缺少 `userId` 而失败
   - 但建议在创建新 Session 时设置 `userId`

3. **权限验证**：
   - 现在可以通过 `userId` 字段验证用户是否有权访问特定 Session
   - 也可以通过 `clinicId` 进行 Clinic 级别的权限验证

## 验证

迁移完成后，验证：

1. **检查数据库**：
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'Session' AND column_name = 'userId';
   ```

2. **测试 API**：
   ```bash
   # 应该能正常查询用户的会话
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:6001/api/report/SESSION_ID
   ```

## 参考

- [Prisma 迁移文档](https://www.prisma.io/docs/guides/migrate)
- [Prisma 关系文档](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

