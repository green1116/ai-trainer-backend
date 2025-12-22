# DeviceData Schema 更新说明

## 更新内容

根据要求，DeviceData 模型已更新为"原子数据"结构，包含以下字段：

### 新字段
- `frequencyHz`: 频率（Hz）- 从 `frequency` 重命名
- `timestamp`: 数据采集时间戳 - 新增（与 `createdAt` 区分）
- `amplitude`: 振幅（可选，0-100）
- `mode`: 模式（可选，动态值，不硬编码）
- `intensity`: 强度（可选，0-100）

### 保留字段
- `id`: 主键
- `sessionId`: 会话ID
- `createdAt`: 记录创建时间（系统时间）

## 数据库同步

运行以下命令同步数据库 schema：

```powershell
cd ai-trainer-backend
npx prisma db push
```

## 向后兼容

代码已实现向后兼容：
- 如果新字段不存在，会回退到旧字段名
- 现有数据不会丢失
- API 同时支持新旧字段名

## 重要提示

⚠️ **不要在前端硬编码模式值**

模式（mode）应该由设备动态提供，例如：
- "training"
- "rehab"
- "balance"
- 或其他设备定义的值

前端会根据实际数据动态显示模式，不会硬编码 "模式 A / 模式 B"。

## API 更新

### POST /api/device/data

现在支持以下字段：
```json
{
  "sessionId": "uuid",
  "frequencyHz": 32.5,
  "timestamp": "2025-01-20T10:00:00Z",
  "amplitude": 75.0,
  "mode": "training",
  "intensity": 80.0
}
```

### GET /api/session/[id]

返回的 `deviceData` 数组现在包含：
- `time`: 时间偏移（秒）
- `hz`: 频率
- `timestamp`: ISO 时间戳
- `amplitude`: 振幅（如果有）
- `mode`: 模式（如果有）
- `intensity`: 强度（如果有）

