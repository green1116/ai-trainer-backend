# Device Adapter 目录结构

## 正确的 Device Adapter 位置（非常重要）

👉 **只存在于后端** - 前端、PDF、AI 永远看不到协议细节

## 目录结构

```
ai-trainer-backend/
└── src/
    └── devices/                    # 设备相关（只存在于后端）
        ├── adapters/              # 设备适配器
        │   ├── fn_vibration.adapter.ts  # FN Vibration 适配器
        │   ├── generic.adapter.ts       # 通用适配器
        │   └── adapter.types.ts         # 适配器类型定义
        ├── profiles/               # 设备能力配置文件
        │   ├── fn_vibration.profile.json
        │   └── generic.profile.json
        └── device.service.ts       # 设备服务（统一入口）
```

## 文件说明

### 1. `adapters/` 目录
- **fn_vibration.adapter.ts**: FN Vibration 设备专用适配器
- **generic.adapter.ts**: 通用设备适配器（默认）
- **adapter.types.ts**: 适配器类型定义（VendorProtocol 等）

### 2. `profiles/` 目录
- **fn_vibration.profile.json**: FN Vibration 设备能力配置
- **generic.profile.json**: 通用设备能力配置

### 3. `device.service.ts`
- 统一管理设备适配器和能力描述
- 提供 `getAdapter()` 和 `getDeviceCapability()` 方法

## 使用方式

### API 端点

```typescript
// 获取设备能力
GET /api/device/[id]/capability

// 发送设备指令
POST /api/device/command
{
  "deviceId": "VP-2025-000001",
  "command": {
    "action": "set",
    "params": {
      "frequency": 32.5,
      "mode": "training",
      "intensity": 80
    }
  }
}
```

## 关键原则

1. ✅ **只存在于后端**
   - Device Adapter 只存在于后端
   - 所有协议转换逻辑都在 `src/devices/` 目录中

2. ✅ **前端、PDF、AI 永远看不到协议细节**
   - 前端只看到统一指令模型 `DeviceCommand`
   - PDF 生成不涉及协议细节
   - AI 推荐不涉及协议细节

3. ✅ **可扩展性**
   - 新增设备只需添加适配器和配置文件
   - 不需要修改核心逻辑

## 添加新设备

1. 在 `profiles/` 创建 `{model}.profile.json`
2. 在 `adapters/` 创建 `{model}.adapter.ts`（可选）
3. 在 `device.service.ts` 添加设备识别逻辑

