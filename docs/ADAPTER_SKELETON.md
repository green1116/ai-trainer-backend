# 六、Adapter 骨架（你现在就可以建）

## 概述

Adapter 骨架展示了如何实现 `VibrationDevice` 接口，使用 Web Bluetooth API 直接连接设备。

## 文件位置

```
src/devices/ble/adapters/FunosVibrationAdapter.ts
```

## 骨架结构

```typescript
import { VibrationDevice, DeviceMode, DeviceStatus } from '../device-capabilities'
import { mapToFnProtocol } from '../../adapters/fn.adapter';

export class FunosVibrationAdapter implements VibrationDevice {
  private device: BluetoothDevice
  private characteristic: BluetoothRemoteGATTCharacteristic

  async connect() {
    // 1️⃣ 扫描 BLE
    // 2️⃣ 连接 GATT
    // 3️⃣ 找到 PDF 中定义的 Service / Characteristic
  }

  async start() {
    // 写入：启动指令（来自 PDF）
  }

  async stop() {
    // 写入：停止指令
  }

  async setFrequency(hz: number) {
    // 这里就是：PDF 指令 → bytes
  }

  async setAmplitude(level: number) {
    // 同上
  }

  async setMode(mode: DeviceMode) {
    // mode → 工厂协议值
  }

  async readStatus(): Promise<DeviceStatus> {
    // 订阅 notify → 解析 bytes → DeviceStatus
    return {
      frequency: 0,
      amplitude: 0,
      mode: 'custom',
      running: false
    }
  }
}
```

## 实现细节

### 1. connect() - 连接设备

```typescript
async connect(): Promise<void> {
  // 1️⃣ 扫描 BLE
  const options: RequestDeviceOptions = {
    filters: [
      { namePrefix: 'Funos' },  // TODO: 从 PDF 中找到设备名称
      // 或者使用 Service UUID
      // { services: [0xFFE0] }  // TODO: 从 PDF 中找到 Service UUID
    ],
    optionalServices: [0xFFE0],  // TODO: 从 PDF 中找到 Service UUID
  };

  this.device = await navigator.bluetooth.requestDevice(options);

  // 2️⃣ 连接 GATT
  const server = await this.device.gatt.connect();

  // 3️⃣ 找到 PDF 中定义的 Service / Characteristic
  const service = await server.getPrimaryService(0xFFE0);  // TODO: 从 PDF 中找到 Service UUID
  this.characteristic = await service.getCharacteristic(0xFFE1);  // TODO: 从 PDF 中找到 Characteristic UUID

  // 订阅 notify（如果需要接收设备状态）
  if (this.characteristic.properties.notify) {
    await this.characteristic.startNotifications();
    this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
      this.handleNotification(event);
    });
  }
}
```

### 2. start() / stop() - 启停设备

```typescript
async start(): Promise<void> {
  // 写入：启动指令（来自 PDF）
  const command = { action: 'start' as const };
  const protocol = mapToFnProtocol(command);
  const bytes = new Uint8Array(protocol.ble);
  await this.characteristic.writeValue(bytes);
}

async stop(): Promise<void> {
  // 写入：停止指令
  const command = { action: 'stop' as const };
  const protocol = mapToFnProtocol(command);
  const bytes = new Uint8Array(protocol.ble);
  await this.characteristic.writeValue(bytes);
}
```

### 3. setFrequency() / setAmplitude() / setMode() - 设置参数

```typescript
async setFrequency(hz: number): Promise<void> {
  // 这里就是：PDF 指令 → bytes
  const command = {
    action: 'set' as const,
    params: { frequencyHz: hz },
  };
  const protocol = mapToFnProtocol(command);
  const bytes = new Uint8Array(protocol.ble);
  await this.characteristic.writeValue(bytes);
}
```

### 4. readStatus() - 读取状态

```typescript
async readStatus(): Promise<DeviceStatus> {
  // 订阅 notify → 解析 bytes → DeviceStatus
  // 如果需要主动读取：
  // const value = await this.characteristic.readValue();
  // return this.parseStatus(value);

  // 或者从 notify 事件中更新
  return { ...this.currentStatus };
}

private handleNotification(event: Event): void {
  const target = event.target as BluetoothRemoteGATTCharacteristic;
  const bytes = new Uint8Array(target.value.buffer);
  
  // TODO: 从 PDF 中找到状态解析格式
  // 解析 bytes → DeviceStatus
  this.currentStatus.frequency = bytes[0];
  this.currentStatus.amplitude = bytes[1];
  this.currentStatus.mode = this.parseMode(bytes[2]);
  this.currentStatus.running = bytes[3] === 0x01;
}
```

## 从 PDF 中需要找到的信息

### 1. 设备信息

- **设备名称**: 用于 BLE 扫描过滤
- **Service UUID**: GATT Service 的 UUID
- **Characteristic UUID**: 用于读写命令的 Characteristic UUID

### 2. 命令格式

- **启动命令**: 字节数组格式
- **停止命令**: 字节数组格式
- **设置频率命令**: 命令头 + 频率值编码
- **设置模式命令**: 命令头 + 模式值编码

### 3. 状态格式

- **状态读取**: Characteristic 的读取格式
- **状态通知**: notify 事件的字节格式
- **状态解析**: bytes → DeviceStatus 的映射规则

## 关键要点

1. ✅ **使用 mapToFnProtocol**
   - 所有命令都通过 `mapToFnProtocol` 转换为工厂协议
   - 工厂协议细节在 `fn.adapter.ts` 中处理

2. ✅ **Web Bluetooth API**
   - 使用 `navigator.bluetooth` API
   - 需要浏览器环境支持
   - 需要用户授权

3. ✅ **协议转换流程**
   ```
   VibrationDevice 方法
   → DeviceCommand (统一指令模型)
   → mapToFnProtocol() (协议转换)
   → bytes (工厂协议)
   → BLE writeValue()
   ```

4. ✅ **状态更新**
   - 通过 notify 事件接收设备状态
   - 解析 bytes 并更新 `currentStatus`
   - `readStatus()` 返回最新状态

## 注意事项

### Web Bluetooth API 限制

- ⚠️ **浏览器环境**: Web Bluetooth API 只能在浏览器中使用
- ⚠️ **HTTPS 要求**: 需要 HTTPS 连接（localhost 除外）
- ⚠️ **用户授权**: 需要用户手动选择设备

### 后端环境

如果需要在 Node.js 后端使用，需要使用：
- `@abandonware/noble` - BLE 库
- `bluetooth-hci-socket` - 底层 BLE 访问

## 总结

**六、Adapter 骨架** 展示了：

1. ✅ **完整的连接流程**: 扫描 → 连接 → 获取 Service/Characteristic
2. ✅ **命令发送**: 使用 `mapToFnProtocol` 转换并发送
3. ✅ **状态读取**: 通过 notify 或主动读取获取状态
4. ✅ **协议隔离**: 工厂协议细节在 `fn.adapter.ts` 中处理

通过这个骨架，你可以：
- 实现真实的 BLE 连接
- 发送工厂协议命令
- 接收设备状态
- 保持代码清晰和可维护

