# Funos 设备协议命令

## 概述

`src/devices/adapters/funos/commands.ts` 文件实现了从《律动机通信协议.pdf》中提取的协议命令。

## 协议格式

```
[0xAA, address, func, length, ...data, checksum]
```

- **0xAA**: 帧头
- **address**: 设备地址（默认 0x01）
- **func**: 功能码
- **length**: 数据长度
- **data**: 数据字节数组
- **checksum**: 校验和（所有字节的和，取低 8 位）

## 命令列表

### 1. start() - 启动设备

```typescript
FunosCommands.start(address = 0x01): Uint8Array
```

**功能码**: `0x01`  
**数据**: `[0x01]`

**示例**:
```typescript
const bytes = FunosCommands.start();
// 返回: [0xAA, 0x01, 0x01, 0x01, 0x01, 0x04]
```

### 2. stop() - 停止设备

```typescript
FunosCommands.stop(address = 0x01): Uint8Array
```

**功能码**: `0x01`  
**数据**: `[0x00]`

**示例**:
```typescript
const bytes = FunosCommands.stop();
// 返回: [0xAA, 0x01, 0x01, 0x01, 0x00, 0x03]
```

### 3. setFrequency() - 设置频率

```typescript
FunosCommands.setFrequency(hz: number, address = 0x01): Uint8Array
```

**功能码**: `0x02`  
**数据**: `[高字节, 低字节]`  
**频率编码**: `实际 Hz × 10`

**示例**:
```typescript
const bytes = FunosCommands.setFrequency(32.5);
// 32.5 × 10 = 325 = 0x0145
// 返回: [0xAA, 0x01, 0x02, 0x02, 0x01, 0x45, 0x4D]
```

### 4. setAmplitude() - 设置振幅

```typescript
FunosCommands.setAmplitude(level: number, address = 0x01): Uint8Array
```

**功能码**: `0x03`  
**数据**: `[level]`

**示例**:
```typescript
const bytes = FunosCommands.setAmplitude(5);
// 返回: [0xAA, 0x01, 0x03, 0x01, 0x05, 0x0E]
```

### 5. setMode() - 设置模式

```typescript
FunosCommands.setMode(mode: number, address = 0x01): Uint8Array
```

**功能码**: `0x04`  
**数据**: `[mode]`

**模式映射** (TODO: 从 PDF 中确认):
- `0x01`: 康复 (rehab)
- `0x02`: 力量 (strength)
- `0x03`: 放松 (relax)
- `0x04`: 自定义 (custom)

**示例**:
```typescript
const bytes = FunosCommands.setMode(0x01);
// 返回: [0xAA, 0x01, 0x04, 0x01, 0x01, 0x0B]
```

### 6. queryStatus() - 查询设备状态

```typescript
FunosCommands.queryStatus(address = 0x01): Uint8Array
```

**功能码**: `0x10`  
**数据**: `[]` (空)

**示例**:
```typescript
const bytes = FunosCommands.queryStatus();
// 返回: [0xAA, 0x01, 0x10, 0x00, 0x11]
```

## 使用示例

### 在 Adapter 中使用

```typescript
import { FunosCommands } from './funos/commands';

// 启动设备
const startBytes = FunosCommands.start();
await characteristic.writeValue(startBytes);

// 设置频率
const freqBytes = FunosCommands.setFrequency(32.5);
await characteristic.writeValue(freqBytes);

// 停止设备
const stopBytes = FunosCommands.stop();
await characteristic.writeValue(stopBytes);
```

### 在 fn.adapter.ts 中使用

```typescript
import { FunosCommands } from "./funos/commands";

export function mapToFnProtocol(command: DeviceCommand) {
  switch (command.action) {
    case "start":
      const startBytes = FunosCommands.start();
      return { ble: Array.from(startBytes) };
    
    case "set":
      if (command.params?.frequencyHz !== undefined) {
        const freqBytes = FunosCommands.setFrequency(command.params.frequencyHz);
        return { ble: Array.from(freqBytes) };
      }
      // ...
  }
}
```

## 校验和计算

```typescript
function checksum(bytes: number[]): number {
  return bytes.reduce((sum, b) => sum + b, 0) & 0xff;
}
```

**示例**:
```typescript
// 帧体: [0x01, 0x01, 0x01, 0x01]
// 校验和: (0x01 + 0x01 + 0x01 + 0x01) & 0xff = 0x04
```

## 关键要点

1. ✅ **协议格式统一**: 所有命令都使用相同的帧格式
2. ✅ **频率编码**: 频率值需要乘以 10
3. ✅ **校验和**: 自动计算并添加到帧尾
4. ✅ **设备地址**: 默认 0x01，可以通过参数修改
5. ✅ **返回类型**: 所有命令返回 `Uint8Array`，可直接写入 BLE Characteristic

## 待确认事项

- [ ] 模式值映射（从 PDF 中确认）
- [ ] 设备地址获取方式（从设备配置或参数）
- [ ] 状态响应格式（用于解析 `queryStatus` 的响应）

