# Device Adapters Directory

## 正确的 Device Adapter 位置（非常重要）

👉 **只存在于后端** - 前端、PDF、AI 永远看不到协议细节

## 目录结构

```
src/devices/
├── adapters/              # 设备适配器
│   ├── fn_vibration.adapter.ts  # FN Vibration 设备适配器
│   ├── generic.adapter.ts       # 通用设备适配器
│   └── adapter.types.ts         # 适配器类型定义
├── profiles/               # 设备能力配置文件
│   ├── fn_vibration.profile.json
│   └── generic.profile.json
└── device.service.ts       # 设备服务（统一入口）
```

## 使用方式

### 1. 获取设备适配器

```typescript
import { DeviceService } from '@/src/devices/device.service';

const adapter = DeviceService.getAdapter(deviceModel);
```

### 2. 获取设备能力

```typescript
const capability = DeviceService.getDeviceCapability(deviceModel);
```

### 3. 发送设备指令

```typescript
const command: DeviceCommand = {
  action: "set",
  params: {
    frequency: 32.5,
    mode: "training",
    intensity: 80,
  },
};

const response = await adapter.sendCommand(command);
```

## 添加新设备

### 1. 创建设备能力配置文件

在 `profiles/` 目录创建 `{model}.profile.json`:

```json
{
  "model": "NEW-DEVICE-2025",
  "supports": {
    "frequencyRange": [10, 50],
    "modes": ["mode1", "mode2"],
    "intensityLevels": 10
  }
}
```

### 2. 创建设备适配器（可选）

如果需要特殊处理，在 `adapters/` 目录创建 `{model}.adapter.ts`:

```typescript
import { GenericAdapter } from './generic.adapter';

export class NewDeviceAdapter extends GenericAdapter {
  // 覆盖特定方法...
}
```

### 3. 更新 DeviceService

在 `device.service.ts` 中添加设备识别逻辑。

## 重要原则

- ✅ 只存在于后端
- ✅ 前端、PDF、AI 永远看不到协议细节
- ✅ 所有协议转换逻辑都在这个目录中

