# Device SDK 文档结构

## 1. 概述

本设备通过 BLE 提供实时频率数据，用于 AI 训练与康复分析。

### 功能特性

- ✅ **实时频率采集**: 通过 BLE 实时获取设备振动频率数据
- ✅ **数据标准化**: 统一的数据格式，便于 AI 分析和处理
- ✅ **Session 管理**: 完整的训练会话生命周期管理
- ✅ **云端分析**: 后端接收数据并进行 AI 稳定性分析和叙事生成

### 应用场景

- **AI 训练**: 实时监测训练过程中的频率变化，提供个性化训练建议
- **康复分析**: 分析康复训练数据，评估康复进度和效果
- **数据追踪**: 记录长期训练数据，追踪训练效果

## 2. 数据模型（已冻结）

### VibrationSample

单个振动样本数据点。

```typescript
type VibrationSample = {
  t: number;  // timestamp (ms) - 时间戳，毫秒
  hz: number; // frequency (Hz) - 频率值，赫兹
};
```

**字段说明**:
- `t`: 时间戳，毫秒级精度，使用 `Date.now()` 获取
- `hz`: 频率值，单位赫兹（Hz），范围通常为 0-200 Hz

**示例**:
```typescript
const sample: VibrationSample = {
  t: 1710000000000,
  hz: 30.2
};
```

### SessionPayload

一次训练会话的完整数据。

```typescript
type SessionPayload = {
  deviceId: string;              // 设备唯一 ID (格式: VP-YYYY-NNNNNN)
  startedAt: number;            // 开始时间 (ms)
  endedAt: number;              // 结束时间 (ms)
  samples: VibrationSample[];   // 采样点数组
};
```

**字段说明**:
- `deviceId`: 设备唯一标识符，格式为 `VP-YYYY-NNNNNN`（例如：`VP-2025-000123`）
- `startedAt`: Session 开始时间戳，毫秒级精度
- `endedAt`: Session 结束时间戳，毫秒级精度
- `samples`: 振动样本数组，按时间顺序排列

**示例**:
```typescript
const payload: SessionPayload = {
  deviceId: "VP-2025-000123",
  startedAt: 1710000000000,
  endedAt: 1710000300000,
  samples: [
    { t: 1710000000000, hz: 30.2 },
    { t: 1710000001000, hz: 31.5 },
    { t: 1710000002000, hz: 30.8 },
  ]
};
```

## 3. API 接口

### 3.1 上传 Session 数据

**端点**: `POST /api/session`

**请求体**:
```typescript
SessionPayload
```

**请求示例**:
```json
{
  "deviceId": "VP-2025-000123",
  "startedAt": 1710000000000,
  "endedAt": 1710000300000,
  "samples": [
    { "t": 1710000000000, "hz": 30.2 },
    { "t": 1710000001000, "hz": 31.5 },
    { "t": 1710000002000, "hz": 30.8 }
  ]
}
```

**响应**:
```typescript
{
  ok: true,
  session: {
    id: string,
    deviceId: string,
    clinicId: string,
    startedAt: string,
    endedAt: string,
    samples: VibrationSample[],
    clinic: {
      id: string,
      name: string
    },
    device: {
      id: string,
      name: string
    }
  },
  stats: {
    sampleCount: number,
    avgHz: number,
    duration: number
  }
}
```

**响应示例**:
```json
{
  "ok": true,
  "session": {
    "id": "eed660fb-8254-4f0e-bdff-36f15f5357ef",
    "deviceId": "VP-2025-000123",
    "clinicId": "clinic-uuid",
    "startedAt": "2025-01-15T10:00:00.000Z",
    "endedAt": "2025-01-15T10:05:00.000Z",
    "samples": [
      { "t": 1710000000000, "hz": 30.2 },
      { "t": 1710000001000, "hz": 31.5 }
    ],
    "clinic": {
      "id": "clinic-uuid",
      "name": "测试诊所"
    },
    "device": {
      "id": "VP-2025-000123",
      "name": "设备1"
    }
  },
  "stats": {
    "sampleCount": 1500,
    "avgHz": 35.5,
    "duration": 300000
  }
}
```

### 3.2 查询 Session 详情

**端点**: `GET /api/session/{id}`

**查询参数**:
- `lang`: 语言代码（`zh` 或 `en`），默认 `zh`

**响应**:
```typescript
{
  id: string,
  startedAt: string,
  endedAt: string,
  duration: number,
  avgHz: number,
  score: number,
  deviceId: string,
  clinicId: string,
  samples: VibrationSample[],
  device: {
    id: string,
    name: string
  },
  clinic: {
    id: string,
    name: string
  },
  pdfUrl: string,
  ai: {
    score: number,
    stabilityLevel: string,
    metrics: object
  },
  aiNarrative: string | null
}
```

## 4. 数据格式规范

### 4.1 时间戳格式

- **单位**: 毫秒（ms）
- **精度**: 毫秒级
- **获取方式**: `Date.now()`
- **示例**: `1710000000000`

### 4.2 频率格式

- **单位**: 赫兹（Hz）
- **精度**: 保留一位小数
- **范围**: 0-200 Hz
- **示例**: `30.2`, `50.5`, `100.0`

### 4.3 设备 ID 格式

- **格式**: `VP-YYYY-NNNNNN`
- **说明**:
  - `VP`: 固定前缀
  - `YYYY`: 4位年份（例如：2025）
  - `NNNNNN`: 6位序列号（例如：000123）
- **示例**: `VP-2025-000123`
- **验证**: 使用正则表达式 `/^VP-\d{4}-\d{6}$/`

## 5. 数据模型冻结说明

**冻结版本**: v0.9  
**冻结日期**: 2025-01-XX  
**冻结内容**: `VibrationSample` 和 `SessionPayload` 数据结构

### 冻结原则

1. **向后兼容**: 后续版本必须保持向后兼容
2. **字段不变**: 已定义的字段名称和类型不可更改
3. **扩展方式**: 只能添加可选字段，不能删除或修改现有字段

### 相关文档

- **BLE v0.9 冻结文档**: `BLE_V0.9_FREEZE.md`
- **类型定义**: `src/types/ble.ts`
- **工具函数**: `src/utils/ble.ts`

## 6. 数据处理流程

### 6.1 数据接收

```
App 上传 SessionPayload
    ↓
POST /api/session
    ↓
验证 deviceId
    ↓
查找 Device 并获取 clinicId
    ↓
计算 avgHz（从 samples）
    ↓
创建 Session 记录
    ↓
返回响应
```

### 6.2 数据查询

```
GET /api/session/{id}
    ↓
查询 Session（包含 samples）
    ↓
从 samples 计算 avgHz
    ↓
AI 稳定性分析
    ↓
生成 AI Narrative（如果关联 Clinic）
    ↓
返回完整数据
```

## 7. 数据库存储

### 7.1 Session 模型

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

### 7.2 samples 字段

- **类型**: `Json?` (可选)
- **格式**: `VibrationSample[]`
- **存储**: PostgreSQL JSON 类型
- **查询**: 可以直接查询 JSON 字段

## 8. 最佳实践

### 8.1 数据验证

- **deviceId**: 验证格式是否符合 `VP-YYYY-NNNNNN`
- **samples**: 验证数组格式和每个元素的类型
- **时间戳**: 验证 `startedAt` 和 `endedAt` 的合理性

### 8.2 错误处理

- **设备不存在**: 返回 404 错误
- **数据格式错误**: 返回 400 错误
- **服务器错误**: 返回 500 错误并记录日志

### 8.3 性能优化

- **批量处理**: 如果 samples 数组很大，考虑批量处理
- **索引优化**: 在 `deviceId` 和 `startedAt` 上创建索引
- **数据压缩**: 如果数据量很大，考虑压缩存储

## 9. 相关资源

- **类型定义**: `src/types/ble.ts`
- **API 路由**: `app/api/session/route.ts`
- **Session 详情**: `app/api/session/[id]/route.ts`
- **数据库 Schema**: `prisma/schema.prisma`
- **BLE 冻结文档**: `BLE_V0.9_FREEZE.md`

