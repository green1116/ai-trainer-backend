# PostureEvent 模型迁移指南

## 已完成

✅ **PostureEvent 模型已添加到 Prisma Schema**
- 模型定义：`prisma/schema.prisma`
- Prisma Client 已重新生成
- 代码已提交到 GitHub（提交：`7fb0b0b`）

## 迁移问题

数据库迁移无法自动执行，因为数据库中存在现有数据，需要手动处理以下字段：

### 需要处理的字段

1. **Device 表**
   - 需要添加 `updatedAt` 字段（表中有 1 行数据）

2. **DeviceData 表**
   - 需要添加 `frequencyHz` 字段（表中有 600 行数据）
   - 需要删除 `frequency` 字段（如果存在）

3. **Session 表**
   - 需要添加 `updatedAt` 字段（表中有 6 行数据）
   - 需要添加 `userId` 字段（表中有 6 行数据）

## 解决方案

### 方案一：手动创建迁移文件（推荐）

1. **创建迁移文件（不应用）**
   ```bash
   cd ai-trainer-backend
   npx prisma migrate dev --create-only --name add_posture_event_model
   ```

2. **编辑迁移文件**
   找到生成的迁移文件（在 `prisma/migrations/` 目录下），手动修改 SQL：

   ```sql
   -- 为现有数据添加默认值
   ALTER TABLE "Device" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
   ALTER TABLE "Session" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
   
   -- 为 DeviceData 添加 frequencyHz（从 frequency 迁移数据）
   ALTER TABLE "DeviceData" ADD COLUMN "frequencyHz" DOUBLE PRECISION;
   UPDATE "DeviceData" SET "frequencyHz" = "frequency" WHERE "frequency" IS NOT NULL;
   ALTER TABLE "DeviceData" ALTER COLUMN "frequencyHz" SET NOT NULL;
   ALTER TABLE "DeviceData" DROP COLUMN "frequency"; -- 如果存在
   
   -- 为 Session 添加 userId（需要为现有数据分配一个默认用户）
   -- 注意：需要先创建一个默认用户，或者为现有 Session 分配真实的 userId
   ALTER TABLE "Session" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
   -- 然后手动更新现有 Session 的 userId 为真实的用户 ID
   
   -- 创建 PostureEvent 表
   CREATE TABLE "PostureEvent" (
     "id" TEXT NOT NULL,
     "sessionId" TEXT NOT NULL,
     "eventTime" TIMESTAMP(3) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL,
     CONSTRAINT "PostureEvent_pkey" PRIMARY KEY ("id")
   );
   
   CREATE INDEX "PostureEvent_sessionId_idx" ON "PostureEvent"("sessionId");
   CREATE INDEX "PostureEvent_eventTime_idx" ON "PostureEvent"("eventTime");
   
   ALTER TABLE "PostureEvent" ADD CONSTRAINT "PostureEvent_sessionId_fkey" 
     FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   ```

3. **应用迁移**
   ```bash
   npx prisma migrate dev
   ```

### 方案二：重置数据库（仅开发环境）

⚠️ **警告：这将删除所有数据！**

```bash
cd ai-trainer-backend
npx prisma migrate reset
```

### 方案三：使用 Prisma Studio 手动更新数据

1. **打开 Prisma Studio**
   ```bash
   npx prisma studio
   ```

2. **手动更新现有数据**
   - 为每个 `Session` 记录添加 `userId`
   - 为每个 `DeviceData` 记录添加 `frequencyHz`（从 `frequency` 复制）

3. **然后运行迁移**
   ```bash
   npx prisma migrate dev --name add_posture_event_model
   ```

## PostureEvent 模型结构

```prisma
model PostureEvent {
  id        String   @id @default(cuid())
  sessionId String   // 关联Session的id
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  eventTime DateTime // 事件时间(代码中用到的字段)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sessionId])
  @@index([eventTime])
}
```

## 使用示例

```typescript
import { db } from "@/lib/db"

// 创建姿势事件
const postureEvent = await db.postureEvent.create({
  data: {
    sessionId: "session-id",
    eventTime: new Date(),
  },
})

// 查询某个 Session 的所有姿势事件
const events = await db.postureEvent.findMany({
  where: {
    sessionId: "session-id",
  },
  orderBy: {
    eventTime: "asc",
  },
})
```

## 下一步

1. ✅ Schema 已更新
2. ✅ Prisma Client 已生成
3. ✅ 代码已提交
4. ⚠️ **需要手动处理数据库迁移**（选择上述方案之一）

## 注意事项

- 如果使用方案一，请确保为现有 `Session` 记录分配真实的 `userId`
- 如果 `DeviceData` 表中有 `frequency` 字段，需要先迁移数据到 `frequencyHz`
- 在生产环境部署前，请先在开发环境测试迁移

