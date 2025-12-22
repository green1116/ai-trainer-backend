# Session Samples 数据格式验证

## 概述

根据 BLE v0.9 数据契约，Session 数据应包含以下结构：

```json
{
  "deviceId": "VP-2025-000123",
  "samples": [
    {
      "t": 1710000000000,
      "hz": 30.2
    },
    {
      "t": 1710000001000,
      "hz": 31.5
    }
  ]
}
```

## 数据结构说明

### deviceId
- **类型**: `string`
- **格式**: `VP-YYYY-NNNNNN`
- **示例**: `VP-2025-000123`
- **说明**: 设备唯一标识符

### samples
- **类型**: `VibrationSample[]`
- **格式**: 数组，每个元素包含：
  - `t`: `number` - 时间戳（毫秒）
  - `hz`: `number` - 频率值（Hz）

## 验证方法

### 1. 使用验证脚本

```bash
cd ai-trainer-backend

# 验证最新的 Session
npx tsx scripts/verify-session-samples.ts

# 验证指定的 Session
npx tsx scripts/verify-session-samples.ts <sessionId>
```

### 2. 通过 API 查询

```bash
# 查询 Session 详情（包含 samples）
curl http://localhost:6001/api/session/<sessionId>

# 查看返回的 JSON 结构
curl http://localhost:6001/api/session/<sessionId> | jq '.samples'
```

### 3. 直接查询数据库

```sql
-- 查询 Session 数据
SELECT 
  id,
  "deviceId",
  "samples",
  "startedAt",
  "endedAt"
FROM "Session"
ORDER BY "startedAt" DESC
LIMIT 1;

-- 查看 samples 数据格式
SELECT 
  id,
  "deviceId",
  "samples"::jsonb
FROM "Session"
WHERE "samples" IS NOT NULL
LIMIT 1;
```

## 验证标准

### ✅ 通过标准

1. **deviceId 格式正确**
   - 符合 `VP-YYYY-NNNNNN` 格式
   - 示例: `VP-2025-000123`

2. **samples 数据存在**
   - `samples` 字段不为 `null`
   - `samples` 是数组类型

3. **samples 格式正确**
   - 每个元素包含 `t` 和 `hz` 字段
   - `t` 是数字类型（时间戳，毫秒）
   - `hz` 是数字类型（频率值，0-200 Hz）
   - 时间戳递增（可选，建议）

### ⚠️ 警告情况

1. **samples 为空数组**
   - 数据格式正确，但没有采样数据

2. **时间戳不递增**
   - 数据格式正确，但时间顺序可能有问题

### ❌ 失败情况

1. **deviceId 格式错误**
   - 不符合 `VP-YYYY-NNNNNN` 格式

2. **samples 格式错误**
   - `samples` 不是数组
   - 元素缺少 `t` 或 `hz` 字段
   - 字段类型不正确

## 解耦成功标志

如果看到以下结构，说明 **BLE / App / 后端已成功解耦**：

```json
{
  "deviceId": "VP-2025-000123",
  "samples": [
    {
      "t": 1710000000000,
      "hz": 30.2
    }
  ]
}
```

## 数据库 Schema

```prisma
model Session {
  id        String   @id @default(uuid())
  deviceId  String
  clinicId  String?
  startedAt DateTime
  endedAt   DateTime?
  samples   Json?    // BLE v0.9: VibrationSample[] 格式 [{ t: number, hz: number }]
  device    Device   @relation(fields: [deviceId], references: [id])
  clinic    Clinic?  @relation(fields: [clinicId], references: [id])
}
```

## 相关文件

- **类型定义**: `src/types/ble.ts`
- **验证脚本**: `scripts/verify-session-samples.ts`
- **上传 API**: `app/api/session/route.ts` (POST)
- **查询 API**: `app/api/session/[id]/route.ts` (GET)

## 注意事项

1. **旧数据兼容性**
   - 旧的 Session 数据可能没有 `samples` 字段
   - 这些数据仍然可以正常查询，但会显示警告

2. **数据大小**
   - `samples` 数组可能包含大量数据
   - 建议在查询时使用分页或限制返回数量

3. **性能考虑**
   - 如果 `samples` 数组很大，考虑使用流式传输或压缩

