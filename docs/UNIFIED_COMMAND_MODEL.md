# 统一的"中间指令模型"（系统的"语言中枢"）

## 核心原则

**这是系统的"语言中枢"，你以后全靠它。**

所有设备控制都使用这个统一模型，前端、PDF、AI 永远看不到协议细节。

## 定义位置

```typescript
// src/devices/types.ts
export interface DeviceCommand {
  action: "start" | "stop" | "set";
  params: {
    frequencyHz?: number;    // 频率 (Hz)
    intensity?: number;       // 强度 (0-100)
    mode?: string;            // 模式（动态，不硬编码）
    durationSec?: number;     // 时长（秒）
  };
}
```

## 关键字段说明

### `action`
- `"start"`: 启动设备
- `"stop"`: 停止设备
- `"set"`: 设置参数

### `params.frequencyHz`
- **类型**: `number` (可选)
- **单位**: Hz
- **说明**: 设备工作频率
- **注意**: 使用 `frequencyHz` 而不是 `frequency`

### `params.intensity`
- **类型**: `number` (可选)
- **范围**: 0-100
- **说明**: 设备强度级别

### `params.mode`
- **类型**: `string` (可选)
- **说明**: 设备工作模式（动态，不硬编码）
- **示例**: `"training"`, `"rehab"`, `"balance"`, `"relax"`, `"strength"`

### `params.durationSec`
- **类型**: `number` (可选)
- **单位**: 秒
- **说明**: 训练时长

## 使用示例

### 1. 设置设备参数

```typescript
const command: DeviceCommand = {
  action: "set",
  params: {
    frequencyHz: 32.5,
    mode: "training",
    intensity: 80,
    durationSec: 600,  // 10 分钟
  },
};
```

### 2. 启动设备

```typescript
const command: DeviceCommand = {
  action: "start",
  params: {
    frequencyHz: 30,
    mode: "training",
  },
};
```

### 3. 停止设备

```typescript
const command: DeviceCommand = {
  action: "stop",
  params: {},
};
```

## API 使用

### POST /api/device/command

```json
{
  "deviceId": "VP-2025-000001",
  "command": {
    "action": "set",
    "params": {
      "frequencyHz": 32.5,
      "mode": "training",
      "intensity": 80,
      "durationSec": 600
    }
  }
}
```

## 架构位置

```
src/devices/
├── types.ts              # 统一指令模型定义（系统的"语言中枢"）
├── adapters/             # 设备适配器（只存在于后端）
│   ├── generic.adapter.ts
│   ├── fn_vibration.adapter.ts
│   └── adapter.types.ts
└── device.service.ts     # 设备服务（统一入口）
```

## 重要说明

1. ✅ **只存在于后端**
   - Device Adapter 只存在于后端
   - 所有协议转换逻辑都在 `src/devices/` 目录中

2. ✅ **前端、PDF、AI 永远看不到协议细节**
   - 前端只看到统一指令模型 `DeviceCommand`
   - PDF 生成不涉及协议细节
   - AI 推荐不涉及协议细节

3. ✅ **字段命名规范**
   - 使用 `frequencyHz` 而不是 `frequency`
   - 使用 `durationSec` 而不是 `duration`
   - 保持一致性，便于维护

4. ✅ **可扩展性**
   - 新增设备只需添加适配器和配置文件
   - 不需要修改核心逻辑
   - 统一指令模型保持不变

