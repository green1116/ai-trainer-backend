# 四、先定义「你系统认可的设备能力」(核心)

## 核心原则

**这是你唯一需要稳定的接口 👇**

**这层和工厂协议完全无关**

## 接口定义

### 文件位置

```
src/devices/device-capabilities.ts
```

### VibrationDevice 接口

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

### DeviceMode 类型

```typescript
export type DeviceMode =
  | 'rehab'
  | 'strength'
  | 'relax'
  | 'custom'
```

### DeviceStatus 接口

```typescript
export interface DeviceStatus {
  frequency: number
  amplitude: number
  mode: DeviceMode
  running: boolean
  error?: string
}
```

## 关键要点

### 1. 这是唯一需要稳定的接口

- ✅ **VibrationDevice** 接口是系统的核心抽象
- ✅ 所有设备实现都必须遵循这个接口
- ✅ 前端、AI、PDF 都使用这个接口
- ✅ 这个接口不会因为工厂协议变化而改变

### 2. 这层和工厂协议完全无关

- ✅ **VibrationDevice** 接口不包含任何协议细节
- ✅ 接口方法使用业务语义（`setFrequency`, `setMode`）
- ✅ 不涉及 BLE 命令、字节数组、协议格式
- ✅ 工厂协议的变化不影响这个接口

### 3. 分层架构

```
┌─────────────────────────────────────┐
│  VibrationDevice (稳定接口)        │  ← 这层和工厂协议完全无关
│  - connect()                        │
│  - setFrequency(hz)                 │
│  - setMode(mode)                    │
└─────────────────────────────────────┘
           ↓ 实现
┌─────────────────────────────────────┐
│  Device Adapter (协议转换层)         │  ← 只在这里处理工厂协议
│  - mapToFnProtocol()                │
│  - toVendorProtocol()                │
└─────────────────────────────────────┘
           ↓ 转换
┌─────────────────────────────────────┐
│  工厂协议 (BLE/串口)                 │  ← 工厂协议细节
│  - { ble: [0xB1, 20, 5] }           │
└─────────────────────────────────────┘
```

## 使用示例

### 实现 VibrationDevice 接口

```typescript
import { VibrationDevice, DeviceMode, DeviceStatus } from '@/src/devices/device-capabilities';
import { DeviceService } from '@/src/devices/device.service';
import { DeviceCommand } from '@/src/devices/types';

export class FNVibrationDevice implements VibrationDevice {
  private deviceId: string;
  private adapter: IDeviceAdapter;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    const device = await db.device.findUnique({ where: { id: deviceId } });
    this.adapter = DeviceService.getAdapter(device.name);
  }

  async connect(): Promise<void> {
    // 实现连接逻辑
    // 使用 adapter 发送连接命令
  }

  async disconnect(): Promise<void> {
    // 实现断开逻辑
  }

  async start(): Promise<void> {
    const command: DeviceCommand = {
      action: 'start',
    };
    await this.adapter.sendCommand(command);
  }

  async stop(): Promise<void> {
    const command: DeviceCommand = {
      action: 'stop',
    };
    await this.adapter.sendCommand(command);
  }

  async setFrequency(hz: number): Promise<void> {
    const command: DeviceCommand = {
      action: 'set',
      params: {
        frequencyHz: hz,
      },
    };
    await this.adapter.sendCommand(command);
  }

  async setAmplitude(level: number): Promise<void> {
    const command: DeviceCommand = {
      action: 'set',
      params: {
        intensity: level,
      },
    };
    await this.adapter.sendCommand(command);
  }

  async setMode(mode: DeviceMode): Promise<void> {
    const command: DeviceCommand = {
      action: 'set',
      params: {
        mode: mode,
      },
    };
    await this.adapter.sendCommand(command);
  }

  async readStatus(): Promise<DeviceStatus> {
    // 实现读取状态逻辑
    // 返回 DeviceStatus
    return {
      frequency: 0,
      amplitude: 0,
      mode: 'rehab',
      running: false,
    };
  }
}
```

## 与现有架构的关系

### 1. DeviceCommand (统一指令模型)

```typescript
// 统一指令模型（系统的"语言中枢"）
export interface DeviceCommand {
  action: DeviceAction;
  params?: {
    frequencyHz?: number;
    intensity?: number;
    mode?: string;
    durationSec?: number;
  };
}
```

**关系**: `VibrationDevice` 接口方法内部使用 `DeviceCommand` 来发送命令。

### 2. Device Adapter (协议转换层)

```typescript
// Device Adapter 负责将 DeviceCommand 转换为工厂协议
export function mapToFnProtocol(command: DeviceCommand) {
  // 转换为工厂协议
  return { ble: [...] };
}
```

**关系**: `VibrationDevice` 实现使用 `Device Adapter` 来转换协议。

### 3. 工厂协议

```typescript
// 工厂协议（从《律动机通信协议.pdf》）
{ ble: [0xB1, 20, 5] }
```

**关系**: `VibrationDevice` 接口完全隐藏了工厂协议的细节。

## 关键优势

1. ✅ **稳定性**
   - `VibrationDevice` 接口不会因为工厂协议变化而改变
   - 前端、AI、PDF 代码不需要修改

2. ✅ **可扩展性**
   - 新增设备只需实现 `VibrationDevice` 接口
   - 不需要修改其他代码

3. ✅ **清晰的分层**
   - 业务层：`VibrationDevice` 接口
   - 协议层：`Device Adapter`
   - 硬件层：工厂协议

4. ✅ **测试友好**
   - 可以轻松创建 Mock 实现
   - 不依赖真实的硬件协议

## 总结

**四、先定义「你系统认可的设备能力」(核心)** 的核心是：

1. ✅ **VibrationDevice** 接口是唯一需要稳定的接口
2. ✅ 这层和工厂协议完全无关
3. ✅ 所有设备实现都必须遵循这个接口
4. ✅ 工厂协议的变化不影响这个接口

通过定义这个稳定的接口，系统可以：
- 支持多种设备
- 隔离协议变化
- 保持代码稳定
- 便于测试和维护

