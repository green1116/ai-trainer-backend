# A-6 第六步: 把"工厂协议"接进来

## 概述

将《律动机通信协议.pdf》中的实际协议命令集成到系统中。

## 核心原则

**永远不改别的地方，只改 `fn.adapter.ts` 里的 `ble` 数组**

## 你要做的事情只有三步

### 1. 找到协议命令

在《律动机通信协议.pdf》中找到：

- ✅ **设置频率的命令** - 如何发送频率值
- ✅ **设置模式的命令** - 如何发送模式值
- ✅ **启停命令** - 如何启动和停止设备

### 2. 一条一条，替换 `fn.adapter.ts` 里的 `ble` 数组

**文件位置**: `src/devices/adapters/fn.adapter.ts`

**当前代码结构**:

```typescript
export function mapToFnProtocol(command: DeviceCommand) {
  switch (command.action) {
    case "start":
      return {
        ble: [0xA0, 0x01]  // ← 替换这里的数组
      }

    case "stop":
      return {
        ble: [0xA0, 0x00]  // ← 替换这里的数组
      }

    case "set":
      return {
        ble: [
          0xB1,  // ← 替换这里的数组
          command.params?.frequencyHz ?? 0x00,
          command.params?.intensity ?? 0x00
        ]
      }

    default:
      throw new Error("Unsupported command")
  }
}
```

**替换步骤**:

1. **启停命令**:
   ```typescript
   case "start":
     return {
       ble: [/* 从 PDF 中找到的启动命令字节数组 */]
     }
   
   case "stop":
     return {
       ble: [/* 从 PDF 中找到的停止命令字节数组 */]
     }
   ```

2. **设置频率命令**:
   ```typescript
   case "set":
     return {
       ble: [
         /* 命令头（从 PDF 中找到）*/,
         /* 频率值（使用 command.params?.frequencyHz）*/,
         /* 其他参数（如强度、模式等）*/
       ]
     }
   ```

### 3. 永远不改别的地方

**✅ 只修改**: `src/devices/adapters/fn.adapter.ts`

**❌ 不要修改**:
- `src/devices/types.ts` - 统一指令模型
- `app/api/device/command/route.ts` - API 端点
- `src/services/deviceRuntime.ts` - 运行时映射
- `src/devices/device.service.ts` - 设备服务
- 其他任何文件

## 示例：如何替换

### 示例 1: 如果 PDF 中启动命令是 `[0xAA, 0x01, 0x00]`

```typescript
case "start":
  return {
    ble: [0xAA, 0x01, 0x00]  // 直接替换
  }
```

### 示例 2: 如果 PDF 中设置频率命令需要命令头 + 频率值

```typescript
case "set":
  return {
    ble: [
      0xBB,  // 命令头（从 PDF 中找到）
      command.params?.frequencyHz ?? 0x00,  // 频率值
      command.params?.intensity ?? 0x00,    // 强度值
      // 其他参数...
    ]
  }
```

### 示例 3: 如果 PDF 中频率需要特殊编码（如乘以 10）

```typescript
case "set":
  return {
    ble: [
      0xBB,  // 命令头
      Math.round((command.params?.frequencyHz ?? 0) * 10),  // 频率值编码
      command.params?.intensity ?? 0x00,
    ]
  }
```

## 验证步骤

1. **修改 `fn.adapter.ts`** - 替换 `ble` 数组
2. **运行测试脚本**:
   ```powershell
   .\scripts\test-device-adapter.ps1
   ```
3. **检查终端输出** - 应该看到新的协议格式：
   ```
   Send to device: { ble: [ ... ] }
   ```
4. **验证设备响应** - 确保设备正确响应命令

## 关键要点

1. ✅ **只改 `fn.adapter.ts`**
   - 这是唯一需要修改的文件
   - 其他所有代码保持不变

2. ✅ **保持接口不变**
   - `mapToFnProtocol` 函数签名不变
   - 输入仍然是 `DeviceCommand`
   - 输出仍然是 `{ ble: [...] }`

3. ✅ **使用统一指令模型**
   - `command.params?.frequencyHz` - 频率值
   - `command.params?.intensity` - 强度值
   - `command.params?.mode` - 模式值
   - `command.action` - 操作类型

4. ✅ **协议细节只在这里**
   - 所有协议细节都在 `fn.adapter.ts`
   - 前端、API、其他服务都看不到协议细节

## 常见问题

### Q: 如果 PDF 中的命令格式不同怎么办？

A: 只需要在 `fn.adapter.ts` 中调整 `ble` 数组的顺序和内容，确保：
- 输入仍然是 `DeviceCommand`
- 输出仍然是 `{ ble: [...] }` 格式

### Q: 如果命令需要校验和怎么办？

A: 在 `fn.adapter.ts` 中计算校验和并添加到数组末尾：
```typescript
case "set":
  const cmd = [0xBB, frequency, intensity];
  const checksum = cmd.reduce((a, b) => a + b) & 0xFF;
  return {
    ble: [...cmd, checksum]
  }
```

### Q: 如果命令需要长度字段怎么办？

A: 在 `fn.adapter.ts` 中添加长度字段：
```typescript
case "set":
  const data = [frequency, intensity];
  return {
    ble: [0xBB, data.length, ...data]
  }
```

## 总结

**A-6 第六步** 的核心是：

1. ✅ 找到协议命令（从 PDF）
2. ✅ 替换 `fn.adapter.ts` 里的 `ble` 数组
3. ✅ 永远不改别的地方

通过这三步，你就可以将实际的工厂协议集成到系统中，而不影响其他任何代码。

