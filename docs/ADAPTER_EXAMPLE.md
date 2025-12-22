# A4. 工厂协议 → Adapter 示例

## 核心原则

**你以后只改这里。**

每个设备的适配器文件是唯一需要修改协议细节的地方。

## FN Vibration 适配器示例

### 文件位置

```
src/devices/adapters/fn_vibration.adapter.ts
```

### 核心函数：`mapToFnProtocol`

```typescript
import { DeviceCommand } from '../types'

export function mapToFnProtocol(cmd: DeviceCommand) {
  if (cmd.action === "set") {
    return {
      bleCommand: [
        0xA1,                                    // FN Vibration 设备命令标识符
        cmd.params.frequencyHz ?? 0x00,          // 频率 (Hz)
        cmd.params.intensity ?? 0x00,            // 强度 (0-100)
      ]
    };
  }
  
  if (cmd.action === "start") {
    return {
      bleCommand: [
        0xA2,                                    // 启动命令
        cmd.params.frequencyHz ?? 0x00,
        cmd.params.intensity ?? 0x00,
      ]
    };
  }
  
  if (cmd.action === "stop") {
    return {
      bleCommand: [
        0xA3,                                    // 停止命令
      ]
    };
  }
  
  // 默认返回空命令
  return {
    bleCommand: [0x00]
  };
}
```

## 工作流程

### 1. 输入：统一指令模型

```typescript
const command: DeviceCommand = {
  action: "set",
  params: {
    frequencyHz: 32.5,
    intensity: 80,
  },
};
```

### 2. 转换：`mapToFnProtocol`

```typescript
const fnProtocol = mapToFnProtocol(command);
// 结果：
// {
//   bleCommand: [0xA1, 32.5, 80]
// }
```

### 3. 输出：设备特定的 BLE 协议

```typescript
{
  bleCommand: [0xA1, 32.5, 80]
}
```

## 在适配器类中使用

```typescript
export class FNVibrationAdapter extends GenericAdapter {
  /**
   * 覆盖厂商协议转换方法
   * 使用 mapToFnProtocol 将统一指令模型转换为 FN Vibration 协议
   */
  toVendorProtocol(command: DeviceCommand): VendorProtocol {
    // 使用 mapToFnProtocol 函数转换
    return mapToFnProtocol(command);
  }

  /**
   * 覆盖发送方法
   */
  async sendCommand(command: DeviceCommand): Promise<DeviceCommandResponse> {
    // 使用 mapToFnProtocol 转换为 FN Vibration 协议
    const fnProtocol = mapToFnProtocol(command);
    
    // TODO: 实际实现应该：
    // 1. 使用 fnProtocol.bleCommand 发送到 FN Vibration 设备
    // 2. 调用 FN Vibration SDK 或蓝牙 API
    // 3. 等待设备响应
    // 4. 解析响应并返回
    
    return {
      success: true,
      message: `FN Vibration command ${command.action} sent successfully`,
    };
  }
}
```

## 添加新设备适配器

### 步骤 1：创建适配器文件

```typescript
// src/devices/adapters/new_device.adapter.ts
import { DeviceCommand } from '../types';

export function mapToNewDeviceProtocol(cmd: DeviceCommand) {
  // 你以后只改这里
  if (cmd.action === "set") {
    return {
      // 新设备的协议格式
      command: [/* ... */],
    };
  }
  // ...
}
```

### 步骤 2：创建适配器类

```typescript
export class NewDeviceAdapter extends GenericAdapter {
  constructor(deviceProfile?: DeviceCapabilityProfile) {
    super('New-Device-Model', deviceProfile);
  }

  toVendorProtocol(command: DeviceCommand): VendorProtocol {
    return mapToNewDeviceProtocol(command);
  }
}
```

### 步骤 3：在 DeviceService 中注册

```typescript
// src/devices/device.service.ts
static getAdapter(deviceModel: string): IDeviceAdapter {
  // ...
  if (deviceModel.startsWith('New-Device-')) {
    return new NewDeviceAdapter(deviceProfile);
  }
  // ...
}
```

## 关键要点

1. ✅ **只改这里**
   - 每个设备的协议转换逻辑都在对应的适配器文件中
   - 不需要修改其他文件

2. ✅ **统一输入**
   - 所有适配器都接收 `DeviceCommand`（统一指令模型）
   - 字段名：`frequencyHz`、`intensity`、`mode`、`durationSec`

3. ✅ **设备特定输出**
   - 每个适配器返回设备特定的协议格式
   - 可以是 BLE 命令数组、串口协议、JSON 等

4. ✅ **可扩展性**
   - 新增设备只需添加新的适配器文件
   - 不需要修改核心逻辑

## 协议格式示例

### BLE 命令数组（FN Vibration）

```typescript
{
  bleCommand: [0xA1, frequencyHz, intensity]
}
```

### JSON 协议（其他设备）

```typescript
{
  command: "set",
  frequency: frequencyHz,
  intensity: intensity,
}
```

### 串口协议（其他设备）

```typescript
{
  serialCommand: "SET:FREQ=" + frequencyHz + ",INT=" + intensity
}
```

## 总结

**你以后只改这里。** 每个设备的适配器文件是唯一需要修改协议细节的地方。

