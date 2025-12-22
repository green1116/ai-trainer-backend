# Device Adapter 架构文档

## 正确的三层抽象

### ① Device Adapter (设备适配层)

**只负责一件事：把厂商协议 → 转成"统一指令模型"**

### ② Device Capability Profile (能力描述)

**这是未来扩展所有型号的关键**  
**前端/AI 永远先读它**

设备能力描述定义了设备支持的功能：
- `frequencyRange`: 频率范围 [min, max]
- `modes`: 模式列表（动态，不硬编码）
- `intensityLevels`: 强度级别数

**API**: `GET /api/device/[id]/capability`

### ③ Device Runtime (运行时映射)

**负责将统一指令模型转换为真实的 BLE / 串口指令**

函数：`mapToProtocol(command, deviceProfile)`
- 验证参数是否符合设备能力
- 将统一指令模型编码为 BLE/串口协议格式
- 支持 `start`、`stop`、`set` 三种操作

## 统一指令模型（系统的"语言中枢"）

**这是系统的"语言中枢"，你以后全靠它。**

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

## 架构设计

### 1. 类型定义（系统的"语言中枢"）
- **位置**: `src/devices/types.ts`
- **内容**: `DeviceCommand` 接口和响应类型
- **说明**: 这是统一的"中间指令模型"，所有设备控制都使用这个统一模型

### 2. Device Adapter
- **位置**: `src/services/deviceAdapter.ts`
- **职责**: 
  - 将统一指令模型转换为厂商协议
  - 将厂商协议转换为统一指令模型
  - 发送指令到设备

### 3. API 端点
- **位置**: `app/api/device/command/route.ts`
- **端点**: `POST /api/device/command`
- **功能**: 接收统一指令模型，通过 Device Adapter 发送到设备

## 使用示例

### 发送设备指令

```typescript
// 统一指令模型（系统的"语言中枢"）
const command: DeviceCommand = {
  action: "set",
  params: {
    frequencyHz: 32.5,    // 使用 frequencyHz
    mode: "training",
    intensity: 80,
    durationSec: 600,      // 可选：时长（秒）
  },
};

// 通过 API 发送
const response = await fetch('/api/device/command', {
  method: 'POST',
  body: JSON.stringify({
    deviceId: "VP-2025-000001",
    command: command,
  }),
});
```

### 实现厂商适配器

```typescript
// 为特定厂商创建适配器
class VendorAAdapter implements IDeviceAdapter {
  toVendorProtocol(command: DeviceCommand): VendorProtocol {
    // 转换为厂商 A 的协议格式
    return {
      cmd: command.action,
      freq: command.params.frequency,
      // ... 其他厂商特定字段
    };
  }

  fromVendorProtocol(protocol: VendorProtocol): DeviceCommand {
    // 从厂商 A 的协议解析
    // ...
  }

  async sendCommand(command: DeviceCommand): Promise<DeviceCommandResponse> {
    // 调用厂商 A 的 SDK
    // ...
  }
}
```

## 关键原则

1. **统一指令模型**: 所有设备控制都使用 `DeviceCommand` 接口
2. **适配器隔离**: 厂商协议转换逻辑封装在 Device Adapter 中
3. **可扩展性**: 新增厂商只需实现 `IDeviceAdapter` 接口
4. **不硬编码**: 模式等字段由设备动态提供，不在前端硬编码

## 数据流

```
前端/API
  ↓
DeviceCommand (统一指令模型)
  ↓
Device Adapter (适配器)
  ↓
Vendor Protocol (厂商协议)
  ↓
设备硬件
```

## 使用流程

### 1. 前端/AI 先读取设备能力

```typescript
// 前端/AI 永远先读它
const capability = await fetch(`/api/device/${deviceId}/capability`);
const { frequencyRange, modes, intensityLevels } = capability.supports;

// 根据设备能力调整 UI 或 AI 推荐
if (modes.includes("training")) {
  // 显示训练模式选项
}
```

### 2. 发送设备指令

```typescript
// 使用统一指令模型
const command: DeviceCommand = {
  action: "set",
  params: {
    frequency: 32.5,
    mode: "training",  // 从设备能力中获取
    intensity: 80,
  },
};

// 通过 API 发送
POST /api/device/command
```

### 3. 运行时映射流程

```
统一指令模型 (DeviceCommand)
  ↓
Device Runtime (mapToProtocol)
  ↓
BLE/串口指令 (ProtocolCommand)
  ↓
设备硬件
```

## 文件结构

**正确的 Device Adapter 位置（非常重要）**

👉 **只存在于后端** - 前端、PDF、AI 永远看不到协议细节

```
ai-trainer-backend/
├── src/
│   ├── devices/                    # 设备相关（只存在于后端）
│   │   ├── adapters/              # 设备适配器
│   │   │   ├── fn_vibration.adapter.ts  # FN Vibration 适配器
│   │   │   ├── generic.adapter.ts       # 通用适配器
│   │   │   └── adapter.types.ts         # 适配器类型定义
│   │   ├── profiles/               # 设备能力配置文件
│   │   │   ├── fn_vibration.profile.json
│   │   │   └── generic.profile.json
│   │   └── device.service.ts       # 设备服务（统一入口）
│   ├── types/
│   │   └── types.ts                 # 统一指令模型定义（系统的"语言中枢"）
│   │   └── deviceCapability.ts     # 设备能力描述接口
│   └── services/
│       └── deviceRuntime.ts        # Device Runtime 运行时映射
└── app/
    └── api/
        └── device/
            ├── [id]/
            │   └── capability/
            │       └── route.ts    # 设备能力 API
            └── command/
                └── route.ts        # 设备控制 API
```

## 关键原则

⚠️ **只存在于后端**
- Device Adapter 只存在于后端
- 前端、PDF、AI 永远看不到协议细节
- 所有协议转换逻辑都在 `src/devices/` 目录中

## 完整数据流

```
1. 前端/AI 读取设备能力
   GET /api/device/[id]/capability
   ↓
2. 构建统一指令模型
   DeviceCommand { action, params }
   ↓
3. 发送到后端
   POST /api/device/command
   ↓
4. Device Adapter 获取设备能力
   ↓
5. Device Runtime 运行时映射
   mapToProtocol(command, deviceProfile)
   ↓
6. 转换为 BLE/串口指令
   ProtocolCommand (Uint8Array/Buffer)
   ↓
7. 发送到设备硬件
```

