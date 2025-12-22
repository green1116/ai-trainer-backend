# Funos 设备状态解析器

## 概述

`src/devices/adapters/funos/parser.ts` 文件实现了从《律动机通信协议.pdf》中提取的状态解析逻辑。

## 状态帧格式

根据 PDF 协议，状态查询返回帧的格式如下：

```
[0xAA, address, func, length, frequency_high, frequency_low, amplitude, mode, running, ...checksum]
```

### 字段说明

- **data[0]**: 帧头 `0xAA`
- **data[1]**: 设备地址
- **data[2]**: 功能码
- **data[3]**: 数据长度
- **data[4]**: 频率高字节
- **data[5]**: 频率低字节
- **data[6]**: 振幅
- **data[7]**: 模式值
- **data[8]**: 运行状态 (1 = 运行中, 0 = 停止)
- **data[9+]**: 校验和

### 频率计算

频率值由两个字节组成，需要除以 10：

```typescript
frequency = ((data[4] << 8) | data[5]) / 10
```

**示例**:
- `data[4] = 0x01`, `data[5] = 0x45` → `(0x0145) / 10 = 32.5 Hz`

## API 说明

### parseStatus()

解析设备状态数据。

```typescript
function parseStatus(data: Uint8Array): ParsedStatus
```

**参数**:
- `data`: 设备返回的字节数组

**返回**:
```typescript
interface ParsedStatus {
  frequency: number;  // 频率 (Hz)
  amplitude: number;  // 振幅
  mode: number;       // 模式值
  running: boolean;   // 是否运行中
}
```

**示例**:
```typescript
import { parseStatus } from './funos/parser';

// 假设从设备接收到状态数据
const statusData = new Uint8Array([
  0xAA,  // 帧头
  0x01,  // 地址
  0x10,  // 功能码
  0x05,  // 长度
  0x01,  // 频率高字节
  0x45,  // 频率低字节 (32.5 Hz)
  0x05,  // 振幅
  0x01,  // 模式 (rehab)
  0x01,  // 运行中
  0x...  // 校验和
]);

const status = parseStatus(statusData);
// status = {
//   frequency: 32.5,
//   amplitude: 5,
//   mode: 1,
//   running: true
// }
```

### modeValueToDeviceMode()

将协议模式值转换为 DeviceMode 字符串。

```typescript
function modeValueToDeviceMode(modeValue: number): string
```

**模式映射**:
- `0x01` → `'rehab'` (康复)
- `0x02` → `'strength'` (力量)
- `0x03` → `'relax'` (放松)
- `0x04` → `'custom'` (自定义)

**示例**:
```typescript
import { modeValueToDeviceMode } from './funos/parser';

const mode = modeValueToDeviceMode(0x01);  // 'rehab'
const mode2 = modeValueToDeviceMode(0x02); // 'strength'
```

### validateStatusFrame()

验证状态数据帧格式。

```typescript
function validateStatusFrame(data: Uint8Array): boolean
```

**检查项**:
- 最小长度（至少 9 字节）
- 帧头是否为 `0xAA`
- TODO: 功能码验证
- TODO: 数据长度验证
- TODO: 校验和验证

**示例**:
```typescript
import { validateStatusFrame } from './funos/parser';

const data = new Uint8Array([0xAA, 0x01, 0x10, 0x05, ...]);
if (validateStatusFrame(data)) {
  const status = parseStatus(data);
} else {
  console.error('Invalid status frame');
}
```

## 在 Adapter 中使用

### FunosVibrationAdapter

```typescript
import { parseStatus, modeValueToDeviceMode, validateStatusFrame } from '../../adapters/funos/parser';

// 处理 notify 事件
private handleNotification(event: Event): void {
  const bytes = new Uint8Array(target.value.buffer);
  
  if (!validateStatusFrame(bytes)) {
    console.warn('Invalid status frame');
    return;
  }

  const parsed = parseStatus(bytes);
  this.currentStatus.frequency = parsed.frequency;
  this.currentStatus.amplitude = parsed.amplitude;
  this.currentStatus.mode = modeValueToDeviceMode(parsed.mode) as DeviceMode;
  this.currentStatus.running = parsed.running;
}

// 主动读取状态
async readStatus(): Promise<DeviceStatus> {
  const queryBytes = FunosCommands.queryStatus();
  await this.characteristic.writeValue(queryBytes);
  
  const value = await this.characteristic.readValue();
  const parsed = parseStatus(new Uint8Array(value.buffer));
  
  return {
    frequency: parsed.frequency,
    amplitude: parsed.amplitude,
    mode: modeValueToDeviceMode(parsed.mode) as DeviceMode,
    running: parsed.running,
  };
}
```

## 完整流程示例

```typescript
// 1. 查询设备状态
const queryBytes = FunosCommands.queryStatus();
await characteristic.writeValue(queryBytes);

// 2. 接收响应（通过 notify 或 read）
const response = await characteristic.readValue();
const data = new Uint8Array(response.buffer);

// 3. 验证帧格式
if (!validateStatusFrame(data)) {
  throw new Error('Invalid status frame');
}

// 4. 解析状态
const parsed = parseStatus(data);
// parsed = { frequency: 32.5, amplitude: 5, mode: 1, running: true }

// 5. 转换为 DeviceStatus
const deviceStatus: DeviceStatus = {
  frequency: parsed.frequency,
  amplitude: parsed.amplitude,
  mode: modeValueToDeviceMode(parsed.mode) as DeviceMode,
  running: parsed.running,
};
```

## 关键要点

1. ✅ **协议解析**: 严格按照 PDF 协议格式解析
2. ✅ **频率计算**: 两个字节组合后除以 10
3. ✅ **模式转换**: 协议值 → DeviceMode 字符串
4. ✅ **数据验证**: 验证帧格式确保数据正确
5. ✅ **类型安全**: 完整的 TypeScript 类型支持

## 待确认事项

- [ ] 校验和计算和验证（从 PDF 中确认）
- [ ] 功能码验证（从 PDF 中确认）
- [ ] 数据长度验证（从 PDF 中确认）
- [ ] 模式值映射确认（从 PDF 中确认）

