# A5. 你现在必须完成的 A 步骤清单

## ✅ 1. 建立 DeviceCommand 统一模型

**状态**: ✅ 已完成

**位置**: `src/devices/types.ts`

```typescript
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

**说明**: 
- 这是系统的"语言中枢"
- 所有设备控制都使用这个统一模型
- 位置：`src/devices/types.ts`

## ✅ 2. 写一个真实设备 Adapter

**状态**: ✅ 已完成

**位置**: `src/devices/adapters/fn_vibration.adapter.ts`

**核心函数**: `mapToFnProtocol`

```typescript
export function mapToFnProtocol(cmd: DeviceCommand) {
  if (cmd.action === "set") {
    return {
      bleCommand: [
        0xA1,
        cmd.params.frequencyHz ?? 0x00,
        cmd.params.intensity ?? 0x00,
      ]
    };
  }
  // ... 支持 start、stop 等其他操作
}
```

**说明**:
- FN Vibration 设备专用适配器
- 将统一指令模型转换为设备特定的 BLE 协议
- 你以后只改这里

## ✅ 3. 后端 API 只接受 DeviceCommand

**状态**: ✅ 已完成

**位置**: `app/api/device/command/route.ts`

**API 端点**: `POST /api/device/command`

**请求格式**:
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

**验证**: 使用 Zod schema 严格验证 `DeviceCommand` 格式

```typescript
const deviceCommandSchema = z.object({
  deviceId: z.string(),
  command: z.object({
    action: z.enum(["start", "stop", "set"]),
    params: z.object({
      frequencyHz: z.number().min(0).max(1000).optional(),
      mode: z.string().optional(),
      intensity: z.number().min(0).max(100).optional(),
      durationSec: z.number().min(0).optional(),
    }),
  }),
});
```

**说明**:
- ✅ 后端 API 只接受 `DeviceCommand` 格式
- ✅ 使用 Zod 进行严格验证
- ✅ 不接受任何其他格式的设备命令
- ✅ 所有协议转换都在后端完成

## 验证清单

### 1. DeviceCommand 统一模型
- [x] 定义在 `src/devices/types.ts`
- [x] 使用 `frequencyHz` 字段名
- [x] 包含 `durationSec` 字段
- [x] 支持 `action: "start" | "stop" | "set"`

### 2. 真实设备 Adapter
- [x] 创建 `fn_vibration.adapter.ts`
- [x] 实现 `mapToFnProtocol` 函数
- [x] 支持将 `DeviceCommand` 转换为 BLE 协议
- [x] 在 `FNVibrationAdapter` 类中使用

### 3. 后端 API 只接受 DeviceCommand
- [x] `POST /api/device/command` 只接受 `DeviceCommand` 格式
- [x] 使用 Zod schema 验证
- [x] 拒绝不符合格式的请求
- [x] 所有协议转换在后端完成

## 架构验证

### 三层抽象流程

1. **前端/AI** → 发送 `DeviceCommand` 到后端 API
2. **后端 API** → 验证 `DeviceCommand` 格式
3. **Device Adapter** → 将 `DeviceCommand` 转换为设备协议
4. **Device Runtime** → 将统一指令转换为 BLE/串口指令

### 关键原则

- ✅ **只存在于后端**: Device Adapter 只存在于后端
- ✅ **前端、PDF、AI 永远看不到协议细节**: 它们只看到 `DeviceCommand`
- ✅ **统一模型**: 所有设备控制都使用 `DeviceCommand`
- ✅ **可扩展性**: 新增设备只需添加适配器文件

## 总结

**所有 A5 步骤清单任务已完成！** ✅

1. ✅ 建立 DeviceCommand 统一模型
2. ✅ 写一个真实设备 Adapter
3. ✅ 后端 API 只接受 DeviceCommand

所有功能都已实现并验证通过。

