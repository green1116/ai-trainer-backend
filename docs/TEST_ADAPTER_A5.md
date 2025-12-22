# A-5 第五步: 用 API 验证 Adapter 是否工作

## 概述

使用 API 测试 Device Adapter 是否正常工作。

## API 端点

```
POST /api/device/command
```

## 请求格式

```json
{
  "deviceId": "VP-2025-000001",
  "command": {
    "action": "start" | "stop" | "set",
    "params": {
      "frequencyHz": 20,
      "intensity": 5,
      "mode": "training",
      "durationSec": 600
    }
  }
}
```

## 测试示例

### 示例 1: 启动设备

```typescript
// 使用 API
POST /api/device/command
{
  "deviceId": "VP-2025-000001",
  "command": {
    "action": "start"
  }
}
```

**PowerShell 测试**:
```powershell
$startCommand = @{
    deviceId = "VP-2025-000001"
    command = @{
        action = "start"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:6001/api/device/command" -Method POST -Body $startCommand -ContentType "application/json"
```

### 示例 2: 设置频率

```typescript
// 使用 API
POST /api/device/command
{
  "deviceId": "VP-2025-000001",
  "command": {
    "action": "set",
    "params": {
      "frequencyHz": 20,
      "intensity": 5
    }
  }
}
```

**PowerShell 测试**:
```powershell
$setCommand = @{
    deviceId = "VP-2025-000001"
    command = @{
        action = "set"
        params = @{
            frequencyHz = 20
            intensity = 5
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:6001/api/device/command" -Method POST -Body $setCommand -ContentType "application/json"
```

### 示例 3: 停止设备

```typescript
// 使用 API
POST /api/device/command
{
  "deviceId": "VP-2025-000001",
  "command": {
    "action": "stop"
  }
}
```

**PowerShell 测试**:
```powershell
$stopCommand = @{
    deviceId = "VP-2025-000001"
    command = @{
        action = "stop"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:6001/api/device/command" -Method POST -Body $stopCommand -ContentType "application/json"
```

## 使用测试脚本

运行测试脚本：

```powershell
cd ai-trainer-backend
.\scripts\test-device-adapter.ps1
```

## 预期响应

### 成功响应

```json
{
  "success": true,
  "deviceId": "VP-2025-000001",
  "command": {
    "action": "set",
    "params": {
      "frequencyHz": 20,
      "intensity": 5
    }
  },
  "response": "Command set sent successfully"
}
```

### 错误响应

```json
{
  "error": "Invalid frequency",
  "message": "Frequency 200 Hz is out of range [1, 60] Hz",
  "deviceCapability": {
    "frequencyRange": [1, 60]
  }
}
```

## 验证要点

1. ✅ **API 可访问** - 检查后端服务是否运行
2. ✅ **设备存在** - 检查设备 ID 是否有效
3. ✅ **参数验证** - 检查参数是否在设备支持范围内
4. ✅ **Adapter 工作** - 检查命令是否成功发送
5. ✅ **响应格式** - 检查响应是否符合预期

## 常见错误

### 1. 设备不存在

```json
{
  "error": "Device not found",
  "message": "No device found with ID: VP-2025-000001"
}
```

**解决方案**: 确保设备已注册，或使用正确的设备 ID。

### 2. 参数超出范围

```json
{
  "error": "Invalid frequency",
  "message": "Frequency 200 Hz is out of range [1, 60] Hz"
}
```

**解决方案**: 检查设备 Profile，使用支持范围内的参数。

### 3. 模式不支持

```json
{
  "error": "Invalid mode",
  "message": "Mode 'invalid_mode' is not supported. Available modes: rehab, strength"
}
```

**解决方案**: 使用设备 Profile 中支持的模式。

## 总结

通过 API 测试可以验证：
- ✅ Device Adapter 是否正确工作
- ✅ 参数验证是否生效
- ✅ 设备能力描述是否正确加载
- ✅ 错误处理是否完善

