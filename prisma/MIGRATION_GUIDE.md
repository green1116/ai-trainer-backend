# 数据库迁移指南

## 当前情况

数据库中存在以下数据：
- Device 表有 `userId` 列（1 个非空值）
- Session 表有 `userId` 列（1 个非空值）
- Session 表有 `avgHz` 列（1 个非空值）

## 迁移选项

### 选项 1: 使用 prisma db push（开发环境，接受数据丢失）

如果这是开发环境，且可以接受数据丢失：

```bash
cd ai-trainer-backend
npx prisma db push --accept-data-loss
```

### 选项 2: 手动迁移（保留数据）

如果需要保留现有数据，请按以下步骤操作：

#### 步骤 1: 备份数据库

```bash
# 使用 pg_dump 备份
pg_dump -h localhost -U your_user -d ai_trainer > backup.sql
```

#### 步骤 2: 执行迁移脚本

```bash
cd ai-trainer-backend
# 连接到数据库并执行迁移脚本
psql -h localhost -U your_user -d ai_trainer -f prisma/migrations/manual_migration.sql
```

#### 步骤 3: 数据迁移

如果 Device 和 Session 中有 `userId`，需要：

1. **迁移 Device 的 userId 到 Clinic**（如果需要）
   ```sql
   -- 如果设备需要关联到用户的 Clinic
   UPDATE "Device" d
   SET "clinicId" = (
     SELECT u."clinicId" 
     FROM "User" u 
     WHERE u."id" = d."userId"
   )
   WHERE d."userId" IS NOT NULL;
   ```

2. **迁移 Session 的 userId 到 Clinic**（如果需要）
   ```sql
   -- 如果会话需要关联到用户的 Clinic
   UPDATE "Session" s
   SET "clinicId" = (
     SELECT u."clinicId" 
     FROM "User" u 
     WHERE u."id" = s."userId"
   )
   WHERE s."userId" IS NOT NULL;
   ```

3. **保留 avgHz 数据**（如果需要）
   ```sql
   -- 如果需要在 Session 中保留 avgHz，可以先添加到新字段
   -- 或者导出到其他表
   ```

#### 步骤 4: 移除旧字段

在确认数据迁移完成后：

```sql
-- 移除 Device.userId
ALTER TABLE "Device" DROP COLUMN IF EXISTS "userId";

-- 移除 Session.userId 和 avgHz
ALTER TABLE "Session" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "avgHz";
```

#### 步骤 5: 同步 Prisma Client

```bash
cd ai-trainer-backend
npx prisma generate
```

### 选项 3: 创建基线迁移

如果希望使用 Prisma Migrate：

```bash
cd ai-trainer-backend
# 标记当前数据库状态为基线
npx prisma migrate resolve --applied baseline
# 然后创建新迁移
npx prisma migrate dev --name add_clinic_and_update_models
```

## 推荐方案

**开发环境**：使用 `prisma db push --accept-data-loss`

**生产环境**：使用手动迁移脚本，确保数据安全

## 注意事项

1. ⚠️ **备份数据**：在执行任何迁移前，请务必备份数据库
2. ⚠️ **测试环境**：先在测试环境验证迁移脚本
3. ⚠️ **数据验证**：迁移后验证数据完整性
4. ⚠️ **回滚计划**：准备回滚方案以防出现问题

