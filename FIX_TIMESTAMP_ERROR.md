# 修复 timestamp 字段错误

## 问题

当数据库 schema 还未更新时，API 尝试使用 `timestamp` 字段排序会导致 Prisma 验证错误：
```
Unknown argument 'timestamp'. Available options are: id, sessionId, frequency, createdAt, session
```

## 解决方案

已修复两个 API 端点，使其在 schema 未更新时也能正常工作：

1. **`/api/session/[id]`** - 会话详情 API
2. **`/api/session/[id]/device-data`** - DeviceData 专用 API

### 修复逻辑

代码现在会：
1. 首先尝试使用 `timestamp` 字段排序（新 schema）
2. 如果失败，自动回退到使用 `createdAt` 字段排序（旧 schema）

```typescript
try {
  deviceDataRecords = await db.deviceData.findMany({
    where: { sessionId: id },
    orderBy: { timestamp: 'asc' }, // 优先使用 timestamp
  });
} catch (error) {
  // 如果 timestamp 字段不存在，使用 createdAt
  deviceDataRecords = await db.deviceData.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'asc' },
  });
}
```

## 当前状态

✅ **API 现在可以正常工作**（即使 schema 未更新）

## 可选：更新数据库 Schema

如果你想使用新字段（`timestamp`, `frequencyHz`, `amplitude`, `mode`, `intensity`），运行：

```powershell
cd ai-trainer-backend
npx prisma db push
```

更新后，API 会自动使用新字段，性能会更好。

## 向后兼容

- ✅ 支持旧 schema（只有 `frequency`, `createdAt`）
- ✅ 支持新 schema（有 `frequencyHz`, `timestamp`, `amplitude`, `mode`, `intensity`）
- ✅ 自动检测并使用可用的字段

