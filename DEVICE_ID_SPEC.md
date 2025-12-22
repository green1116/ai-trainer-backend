# DeviceId 规范 (强烈建议)

## 格式规范

**格式**: `VP-YYYY-NNNNNN`

**示例**: `VP-2025-000001`

## 组成部分

- **VP** = Vibration Platform（产品前缀）
- **YYYY** = 年份（4位数字）
- **NNNNNN** = 序列号（6位数字，前导零）

## 含义

- `VP` = Vibration Platform
- `2025` = 年份
- `000001` = 序列号

## ⚠️ 重要警告

**不要用 MAC 地址作为对外 ID**

原因：
1. **隐私风险** - MAC 地址可能泄露设备硬件信息
2. **更换风险** - 如果设备硬件更换，MAC 地址会改变，导致 ID 不一致

## 使用方式

### 导入常量和工具函数

```typescript
import { DEVICE_ID_EXAMPLE, DEVICE_ID_FORMAT } from '@/src/constants/deviceId';
import { generateDeviceId, isValidDeviceId, parseDeviceId } from '@/src/utils/deviceId';
```

### 生成 DeviceId

```typescript
// 使用当前年份和序列号 1
const deviceId1 = generateDeviceId(); // VP-2025-000001

// 指定年份和序列号
const deviceId2 = generateDeviceId(2025, 123); // VP-2025-000123

// 指定年份，使用默认序列号
const deviceId3 = generateDeviceId(2024); // VP-2024-000001
```

### 验证 DeviceId

```typescript
// 验证格式
isValidDeviceId('VP-2025-000001'); // true
isValidDeviceId('VP-2025-1');      // false
isValidDeviceId('MAC-AA:BB:CC');   // false
```

### 解析 DeviceId

```typescript
const parsed = parseDeviceId('VP-2025-000001');
// {
//   prefix: 'VP',
//   year: 2025,
//   serialNumber: 1
// }
```

### 规范化 DeviceId

```typescript
try {
  const normalized = normalizeDeviceId('VP-2025-000001');
  // 返回: 'VP-2025-000001'
} catch (error) {
  // 如果格式无效，会抛出错误
  console.error(error.message);
}
```

## 有效示例

- ✅ `VP-2025-000001`
- ✅ `VP-2024-123456`
- ✅ `VP-2023-000001`

## 无效示例

- ❌ `VP-2025-1` (序列号位数不足)
- ❌ `VP-25-000001` (年份位数不足)
- ❌ `VP-2025-0000001` (序列号位数过多)
- ❌ `MAC-AA:BB:CC:DD:EE:FF` (MAC 地址格式，不应使用)
- ❌ `device-123` (不符合格式)

## 在 API 中使用

```typescript
import { normalizeDeviceId } from '@/src/utils/deviceId';

export async function POST(req: Request) {
  const { deviceId } = await req.json();
  
  // 验证和规范化 DeviceId
  try {
    const validDeviceId = normalizeDeviceId(deviceId);
    // 使用 validDeviceId...
  } catch (error) {
    return Response.json(
      { error: 'Invalid deviceId format' },
      { status: 400 }
    );
  }
}
```

## 数据库存储

DeviceId 应该作为设备的唯一标识符存储在数据库中。建议：

1. 在 Device 模型中添加 `deviceId` 字段（如果还没有）
2. 使用 `@unique` 约束确保唯一性
3. 在创建设备时验证格式

