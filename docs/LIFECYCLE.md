# 生命周期流程（后端视角）

## 4️⃣ 生命周期

### 完整流程

```
设备启动
    ↓
BLE 连接
    ↓
频率 Notify
    ↓
Session 结束
    ↓
上传云端 ← [后端接收]
```

### 后端处理流程

#### 1. 设备启动

- **后端状态**: 等待设备连接
- **数据库**: Device 记录已存在（通过设备注册）

#### 2. BLE 连接

- **后端状态**: 等待数据上传
- **验证**: 确保 Device 记录存在

#### 3. 频率 Notify

- **后端状态**: 等待 Session 数据
- **说明**: 后端不直接接收 Notify，由 App 采集后统一上传

#### 4. Session 结束

- **后端状态**: 等待 `SessionPayload` 上传
- **准备**: API 端点准备接收数据

#### 5. 上传云端（后端接收）

- **端点**: `POST /api/session`
- **接收数据**: `SessionPayload`
- **处理流程**:
  1. 验证 `deviceId` 格式
  2. 查找 Device 记录
  3. 获取 `clinicId`（从 Device）
  4. 计算 `avgHz`（从 samples）
  5. 创建 Session 记录
  6. 存储 `samples` 数据（JSON 格式）
  7. 返回响应

### 数据流（后端视角）

```
App 上传 SessionPayload
    ↓
POST /api/session
    ↓
验证 deviceId
    ↓
查找 Device
    ↓
获取 clinicId
    ↓
计算 avgHz
    ↓
创建 Session 记录
    ↓
存储 samples (JSON)
    ↓
返回响应
```

### API 处理

#### 请求

```typescript
POST /api/session
Content-Type: application/json

{
  "deviceId": "VP-2025-000123",
  "startedAt": 1710000000000,
  "endedAt": 1710000300000,
  "samples": [
    { "t": 1710000000000, "hz": 30.2 },
    { "t": 1710000001000, "hz": 31.5 }
  ]
}
```

#### 响应

```typescript
{
  "ok": true,
  "session": {
    "id": "session-uuid",
    "deviceId": "VP-2025-000123",
    "clinicId": "clinic-uuid",
    "startedAt": "2025-01-15T10:00:00.000Z",
    "endedAt": "2025-01-15T10:05:00.000Z",
    "samples": [...]
  },
  "stats": {
    "sampleCount": 1500,
    "avgHz": 35.5,
    "duration": 300000
  }
}
```

### 数据库存储

#### Session 记录

```prisma
model Session {
  id        String   @id @default(uuid())
  deviceId  String
  clinicId  String?
  startedAt DateTime
  endedAt   DateTime?
  samples   Json?    // VibrationSample[]
  device    Device   @relation(...)
  clinic    Clinic?  @relation(...)
}
```

#### samples 字段

- **类型**: `Json?` (可选)
- **格式**: `VibrationSample[]`
- **存储**: PostgreSQL JSON 类型
- **查询**: 可以直接查询 JSON 字段

### 后续处理

#### AI 分析

- **触发**: 查询 Session 详情时
- **输入**: `samples` 数组中的频率数据
- **处理**:
  1. 提取频率数组
  2. 计算稳定性评分
  3. 生成 AI Narrative（如果关联 Clinic）

#### 数据查询

- **端点**: `GET /api/session/{id}`
- **返回**: 完整的 Session 数据，包括 `samples`
- **用途**: 前端展示、PDF 生成、AI 分析

### 相关文件

- **API 路由**: `app/api/session/route.ts`
- **Session 详情**: `app/api/session/[id]/route.ts`
- **数据库 Schema**: `prisma/schema.prisma`
- **类型定义**: `src/types/ble.ts`

