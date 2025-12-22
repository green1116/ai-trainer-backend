# Session Samples 数据存储更新

## ✅ 已完成的工作

### 1. 数据库 Schema 更新

**文件**: `prisma/schema.prisma`

在 `Session` 模型中添加了 `samples` 字段：

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

### 2. Session 上传 API 更新

**文件**: `app/api/session/route.ts`

- ✅ 保存 `samples` 数据到数据库
- ✅ 返回 `samples` 数据在响应中

```typescript
const session = await db.session.create({
  data: {
    deviceId: payload.deviceId,
    clinicId: clinicId,
    startedAt: new Date(payload.startedAt),
    endedAt: new Date(payload.endedAt),
    samples: payload.samples ? JSON.parse(JSON.stringify(payload.samples)) : null,
  },
  // ...
});
```

### 3. Session 查询 API 更新

**文件**: `app/api/session/[id]/route.ts`

- ✅ 从 `samples` 数据计算 `avgHz`
- ✅ 从 `samples` 数据提取频率数组用于 AI 分析
- ✅ 返回 `samples` 数据在响应中

```typescript
const samples = session.samples as VibrationSample[] | null;

if (samples && Array.isArray(samples) && samples.length > 0) {
  // 计算平均频率
  const sum = validSamples.reduce((acc, sample) => acc + sample.hz, 0);
  avgHz = sum / validSamples.length;
  
  // 提取频率数组用于 AI 分析
  frequencySamples = validSamples.map(sample => sample.hz);
}
```

### 4. 验证脚本

**文件**: `scripts/verify-session-samples.ts`

创建了验证脚本来检查 Session 数据格式是否符合 BLE v0.9 规范。

**使用方法**:
```bash
# 验证最新的 Session
npx tsx scripts/verify-session-samples.ts

# 验证指定的 Session
npx tsx scripts/verify-session-samples.ts <sessionId>
```

### 5. 文档

**文件**: `docs/SESSION_SAMPLES_VERIFICATION.md`

创建了详细的验证文档，说明：
- 数据结构格式
- 验证方法
- 验证标准
- 解耦成功标志

## 📋 下一步操作

### 1. 运行数据库迁移

```bash
cd ai-trainer-backend
npx prisma db push
```

或者使用迁移：

```bash
npx prisma migrate dev --name add_session_samples
```

### 2. 验证数据格式

上传一个包含 `samples` 的 Session，然后运行验证脚本：

```bash
# 上传 Session（包含 samples）
curl -X POST http://localhost:6001/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "VP-2025-000123",
    "startedAt": 1710000000000,
    "endedAt": 1710000300000,
    "samples": [
      {"t": 1710000000000, "hz": 30.2},
      {"t": 1710000001000, "hz": 31.5}
    ]
  }'

# 验证数据格式
npx tsx scripts/verify-session-samples.ts <sessionId>
```

### 3. 检查 API 响应

```bash
# 查询 Session 详情
curl http://localhost:6001/api/session/<sessionId> | jq '.samples'
```

应该看到类似以下的结构：

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

## ✅ 解耦成功标志

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

## 📝 注意事项

1. **旧数据兼容性**
   - 旧的 Session 数据可能没有 `samples` 字段（`samples` 为 `null`）
   - 这些数据仍然可以正常查询，但会使用默认值或 mock 数据

2. **数据验证**
   - API 会自动验证 `samples` 格式
   - 无效的数据会被过滤或标记为警告

3. **性能考虑**
   - 如果 `samples` 数组很大，考虑使用流式传输或压缩
   - 建议在查询时限制返回的 `samples` 数量

