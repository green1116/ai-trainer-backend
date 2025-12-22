# 版本声明（非常重要）

## 5️⃣ 版本声明

### BLE v0.9

**版本**: v0.9  
**状态**: 已冻结  
**日期**: 2025-01-XX

### 核心原则

#### 1. 后向兼容

**所有未来的 BLE 更新必须保持向后兼容**

- ✅ 必须继续支持 `SessionPayload` 格式
- ✅ 不能删除或修改现有字段
- ✅ 只能添加可选字段
- ✅ 新版本通过版本号区分，但消费端统一使用 `SessionPayload`

#### 2. AI / SaaS 只消费 SessionPayload

**所有上游系统（AI、SaaS）只消费 `SessionPayload`**

- ✅ AI 分析系统只处理 `SessionPayload` 格式
- ✅ SaaS 平台只接收 `SessionPayload` 格式
- ✅ 后端 API 统一接收 `SessionPayload` 格式
- ✅ 数据模型冻结，确保系统稳定性

### 冻结内容

#### 数据契约

```typescript
// 单个采样点（已冻结）
type VibrationSample = {
  t: number;  // timestamp (ms)
  hz: number; // frequency (Hz)
};

// Session 数据（已冻结）
type SessionPayload = {
  deviceId: string;              // 设备唯一 ID
  startedAt: number;            // 开始时间 (ms)
  endedAt: number;              // 结束时间 (ms)
  samples: VibrationSample[];   // 采样点数组
};
```

#### BLE 接口

- **Service UUID**: `VIBRATION_SERVICE`
- **Notify Char**: `FREQUENCY_NOTIFY`
- **Payload**: `uint16 (Hz x 10)`

### 版本兼容性策略

#### 当前版本 (v0.9)

- **数据格式**: `SessionPayload`（已冻结）
- **BLE 协议**: Notify 模式，uint16 (Hz x 10)
- **状态**: 生产就绪

#### 未来版本 (v1.0+)

- **要求**: 必须向后兼容 v0.9
- **扩展**: 可以添加可选字段
- **示例**:
  ```typescript
  type SessionPayloadV1 = {
    // v0.9 字段（必须保留）
    deviceId: string;
    startedAt: number;
    endedAt: number;
    samples: VibrationSample[];
    
    // v1.0 新增字段（可选）
    metadata?: {
      firmwareVersion?: string;
      batteryLevel?: number;
    };
  };
  ```

### 消费端统一接口

#### AI 分析系统

```typescript
// AI 系统只消费 SessionPayload
function analyzeSession(payload: SessionPayload) {
  // 只使用 payload.samples 进行分析
  const frequencies = payload.samples.map(s => s.hz);
  return analyzeStability(frequencies);
}
```

#### SaaS 平台

```typescript
// SaaS 平台只接收 SessionPayload
async function uploadToSaaS(payload: SessionPayload) {
  // 统一格式，不关心底层 BLE 版本
  return await api.post('/sessions', payload);
}
```

#### 后端 API

```typescript
// 后端统一接收 SessionPayload
export async function POST(req: Request) {
  const payload: SessionPayload = await req.json();
  // 处理逻辑...
}
```

### 版本升级指南

#### 添加新字段

1. **保持现有字段不变**
2. **新字段设为可选** (`?`)
3. **更新类型定义**
4. **更新文档**

#### 示例

```typescript
// v0.9 (已冻结)
type SessionPayload = {
  deviceId: string;
  startedAt: number;
  endedAt: number;
  samples: VibrationSample[];
};

// v1.0 (向后兼容)
type SessionPayload = {
  deviceId: string;
  startedAt: number;
  endedAt: number;
  samples: VibrationSample[];
  // 新增可选字段
  metadata?: {
    firmwareVersion?: string;
  };
};
```

### 测试兼容性

#### 兼容性测试清单

- [ ] v0.9 数据可以正常处理
- [ ] v1.0 数据（包含新字段）可以正常处理
- [ ] AI 系统可以处理所有版本
- [ ] SaaS 平台可以接收所有版本
- [ ] 后端 API 可以处理所有版本

### 文档要求

#### 必须明确标注

1. **版本号**: 明确标注当前版本
2. **冻结状态**: 明确标注已冻结的字段
3. **兼容性**: 明确标注向后兼容策略
4. **消费端**: 明确标注只消费 `SessionPayload`

### 相关文档

- **BLE v0.9 冻结**: `BLE_V0.9_FREEZE.md`
- **类型定义**: `src/types/ble.ts`
- **API 文档**: `docs/DEVICE_SDK.md`
- **生命周期**: `docs/LIFECYCLE.md`

### 重要提醒

⚠️ **违反向后兼容性的更改将导致系统崩溃**

- ❌ 不能删除字段
- ❌ 不能修改字段类型
- ❌ 不能修改字段名称
- ✅ 只能添加可选字段
- ✅ 必须保持 `SessionPayload` 格式

**这是避免返工的关键。**

