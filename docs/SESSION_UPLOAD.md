# Session 上传逻辑

## 概述

Session 上传时的逻辑（必须）：

1. 后端接收 `SessionPayload`
2. 查 `deviceId`
3. 绑定 `clinicId`（从 Device 获取）
4. Session 自动归属场馆

## API 端点

**POST** `/api/session`

## 请求格式

```typescript
import { SessionPayload } from '@/src/types/ble';

const payload: SessionPayload = {
  deviceId: 'VP-2025-000001', // 设备唯一 ID
  startedAt: 1704067200000,    // 开始时间 (ms)
  endedAt: 1704067500000,       // 结束时间 (ms)
  samples: [                    // 采样点数组
    { t: 1704067200000, hz: 50.5 },
    { t: 1704067210000, hz: 51.2 },
    // ... 更多采样点
  ],
};
```

## 处理流程

### 1. 接收 SessionPayload

后端接收完整的 `SessionPayload` 对象，包含：
- `deviceId`: 设备 ID（格式：VP-YYYY-NNNNNN）
- `startedAt`: 开始时间（毫秒时间戳）
- `endedAt`: 结束时间（毫秒时间戳）
- `samples`: 频率采样点数组

### 2. 查 deviceId

```typescript
const device = await db.device.findUnique({
  where: { id: payload.deviceId },
  include: { clinic: true },
});
```

如果设备不存在，返回 404 错误。

### 3. 绑定 clinicId

从 Device 对象中获取 `clinicId`：

```typescript
const clinicId = device.clinicId;
```

如果设备未关联到任何 Clinic，返回 400 错误。

### 4. Session 自动归属场馆

创建 Session 时自动绑定 `clinicId`：

```typescript
const session = await db.session.create({
  data: {
    deviceId: payload.deviceId,
    clinicId: clinicId, // 自动绑定
    startedAt: new Date(payload.startedAt),
    endedAt: new Date(payload.endedAt),
  },
});
```

## 响应格式

```json
{
  "ok": true,
  "session": {
    "id": "session-uuid",
    "deviceId": "VP-2025-000001",
    "clinicId": "clinic-uuid",
    "startedAt": "2024-01-01T00:00:00.000Z",
    "endedAt": "2024-01-01T00:05:00.000Z",
    "clinic": {
      "id": "clinic-uuid",
      "name": "My Clinic"
    },
    "device": {
      "id": "VP-2025-000001",
      "name": "Device 1"
    }
  },
  "stats": {
    "sampleCount": 30,
    "avgHz": 50.5,
    "duration": 300000
  }
}
```

## 错误处理

### 设备不存在

```json
{
  "error": "Device not found: VP-2025-000001"
}
```
状态码: 404

### 设备未关联 Clinic

```json
{
  "error": "Device VP-2025-000001 is not associated with any clinic"
}
```
状态码: 400

### 缺少必需字段

```json
{
  "error": "Missing required fields: deviceId, startedAt, endedAt"
}
```
状态码: 400

## 功能特性

通过这个逻辑，你什么都没卖，但已经具备：

- ✅ **多设备** - 支持多个设备上传 Session
- ✅ **多教练** - 每个 Clinic 可以有多个 User（教练）
- ✅ **多场馆** - 每个 Session 自动归属到对应的 Clinic（场馆）

## 使用示例

### cURL

```bash
curl -X POST http://localhost:6001/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "VP-2025-000001",
    "startedAt": 1704067200000,
    "endedAt": 1704067500000,
    "samples": [
      {"t": 1704067200000, "hz": 50.5},
      {"t": 1704067210000, "hz": 51.2}
    ]
  }'
```

### TypeScript/JavaScript

```typescript
import { SessionPayload } from '@/src/types/ble';

const payload: SessionPayload = {
  deviceId: 'VP-2025-000001',
  startedAt: Date.now() - 300000,
  endedAt: Date.now(),
  samples: [
    { t: Date.now() - 300000, hz: 50.5 },
    { t: Date.now() - 290000, hz: 51.2 },
  ],
};

const response = await fetch('http://localhost:6001/api/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log('Session created:', result.session);
```

## 注意事项

1. **DeviceId 格式**：必须符合 `VP-YYYY-NNNNNN` 格式
2. **时间戳**：使用毫秒时间戳（不是秒）
3. **Clinic 关联**：设备必须先关联到 Clinic 才能上传 Session
4. **自动归属**：Session 会自动归属到设备所在的 Clinic，无需手动指定

