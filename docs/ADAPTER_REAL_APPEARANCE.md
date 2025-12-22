# 五、Adapter 的真实样子 (重点)

## 概述

我们给工厂协议建一个 Adapter。

## 目录结构

```
src/devices/
└── ble/
    └── adapters/
        ├── FunosVibrationAdapter.ts  ← 你这份 PDF (《律动机通信协议.pdf》)
        ├── PowerPlateAdapter.ts      ← 未来可接
        └── MockAdapter.ts            ← 无设备调试
```

## Adapter 说明

### 1. FunosVibrationAdapter.ts

**← 你这份 PDF (《律动机通信协议.pdf》)**

- 实现 `VibrationDevice` 接口
- 内部使用 Device Adapter 层处理工厂协议
- 对应《律动机通信协议.pdf》中的协议

**使用示例**:
```typescript
import { FunosVibrationAdapter } from '@/src/devices/ble/adapters';

const device = new FunosVibrationAdapter('VP-2025-000001');
await device.connect();
await device.setFrequency(20);
await device.setAmplitude(5);
await device.start();
```

### 2. PowerPlateAdapter.ts

**← 未来可接**

- 实现 `VibrationDevice` 接口
- 用于支持 PowerPlate 设备
- 未来可以接入其他厂商的设备

**使用示例**:
```typescript
import { PowerPlateAdapter } from '@/src/devices/ble/adapters';

const device = new PowerPlateAdapter('PP-2025-000001');
await device.connect();
await device.setFrequency(30);
await device.start();
```

### 3. MockAdapter.ts

**← 无设备调试**

- 实现 `VibrationDevice` 接口
- 用于在没有真实设备时进行调试和测试
- 所有操作都是模拟的，不连接真实硬件

**使用示例**:
```typescript
import { MockAdapter } from '@/src/devices/ble/adapters';

const device = new MockAdapter();
await device.connect();
await device.setFrequency(20);
await device.start();

const status = await device.readStatus();
console.log(status); // { frequency: 20, amplitude: 0, mode: 'rehab', running: true }
```

## 架构关系

```
┌─────────────────────────────────────┐
│  VibrationDevice (稳定接口)        │
│  - connect()                        │
│  - setFrequency(hz)                 │
│  - setMode(mode)                    │
└─────────────────────────────────────┘
           ↓ 实现
┌─────────────────────────────────────┐
│  BLE Adapters                       │
│  - FunosVibrationAdapter           │
│  - PowerPlateAdapter                │
│  - MockAdapter                      │
└─────────────────────────────────────┘
           ↓ 使用
┌─────────────────────────────────────┐
│  Device Adapter (协议转换层)         │
│  - mapToFnProtocol()                │
│  - toVendorProtocol()                │
└─────────────────────────────────────┘
           ↓ 转换
┌─────────────────────────────────────┐
│  工厂协议 (BLE/串口)                 │
│  - { ble: [0xB1, 20, 5] }           │
└─────────────────────────────────────┘
```

## 关键要点

### 1. 所有 Adapter 都实现 VibrationDevice 接口

```typescript
export interface VibrationDevice {
  connect(): Promise<void>
  disconnect(): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  setFrequency(hz: number): Promise<void>
  setAmplitude(level: number): Promise<void>
  setMode(mode: DeviceMode): Promise<void>
  readStatus(): Promise<DeviceStatus>
}
```

### 2. 内部使用 Device Adapter 层

所有 BLE Adapter 内部都使用 `DeviceService.getAdapter()` 来获取协议转换层：

```typescript
const device = await db.device.findUnique({ where: { id: this.deviceId } });
const deviceModel = device.name || device.id;
this.adapter = DeviceService.getAdapter(deviceModel);

// 使用统一指令模型发送命令
const command: DeviceCommand = {
  action: 'set',
  params: {
    frequencyHz: hz,
  },
};
await this.adapter.sendCommand(command);
```

### 3. 工厂协议细节被完全隐藏

- 前端、AI、PDF 只看到 `VibrationDevice` 接口
- 工厂协议的细节在 `Device Adapter` 层处理
- BLE Adapter 不需要知道具体的协议格式

## 添加新设备

### 步骤 1: 创建新的 Adapter

```typescript
// src/devices/ble/adapters/NewDeviceAdapter.ts
import { VibrationDevice, DeviceMode, DeviceStatus } from '../../device-capabilities';
import { DeviceCommand } from '../../types';
import { DeviceService } from '../../device.service';

export class NewDeviceAdapter implements VibrationDevice {
  // 实现所有 VibrationDevice 接口方法
  async connect(): Promise<void> { /* ... */ }
  async setFrequency(hz: number): Promise<void> { /* ... */ }
  // ...
}
```

### 步骤 2: 创建协议转换层（如果需要）

```typescript
// src/devices/adapters/new_device.adapter.ts
export function mapToNewDeviceProtocol(command: DeviceCommand) {
  // 实现协议转换
  return { ble: [...] };
}
```

### 步骤 3: 在 DeviceService 中注册

```typescript
// src/devices/device.service.ts
if (deviceModel.startsWith('NewDevice-')) {
  return new NewDeviceAdapter(deviceProfile);
}
```

## 使用场景

### 1. 开发调试（使用 MockAdapter）

```typescript
import { MockAdapter } from '@/src/devices/ble/adapters';

const device = new MockAdapter();
await device.connect();
await device.setFrequency(20);
await device.start();
```

### 2. 生产环境（使用 FunosVibrationAdapter）

```typescript
import { FunosVibrationAdapter } from '@/src/devices/ble/adapters';

const device = new FunosVibrationAdapter(deviceId);
await device.connect();
await device.setFrequency(20);
await device.start();
```

### 3. 多设备支持（根据设备类型选择）

```typescript
import { FunosVibrationAdapter, PowerPlateAdapter } from '@/src/devices/ble/adapters';

function createDevice(deviceId: string, deviceType: string): VibrationDevice {
  switch (deviceType) {
    case 'Funos':
      return new FunosVibrationAdapter(deviceId);
    case 'PowerPlate':
      return new PowerPlateAdapter(deviceId);
    default:
      throw new Error(`Unsupported device type: ${deviceType}`);
  }
}
```

## 总结

**五、Adapter 的真实样子** 展示了：

1. ✅ **目录结构**: `ble/adapters/` 目录包含所有设备适配器
2. ✅ **统一接口**: 所有 Adapter 都实现 `VibrationDevice` 接口
3. ✅ **协议隔离**: 工厂协议细节被完全隐藏
4. ✅ **易于扩展**: 添加新设备只需创建新的 Adapter

通过这个结构，系统可以：
- 支持多种设备
- 隔离协议变化
- 便于测试和调试
- 保持代码清晰

