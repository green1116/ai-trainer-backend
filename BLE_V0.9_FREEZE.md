# BLE v0.9 冻结声明

**BLE v0.9 frozen**

All upstream systems consume only `SessionPayload`.

Future BLE updates must remain backward compatible.

**这是避免返工的关键。**

## 冻结内容

### 数据契约
- `VibrationSample` - 单个采样点结构
- `SessionPayload` - Session 数据结构

### BLE Characteristic（最小可用）
- **Service UUID**: `VIBRATION_SERVICE`
- **Notify Char**: `FREQUENCY_NOTIFY`
- **Payload**: `uint16 (Hz * 10)`

## 职责划分

### BLE 固件层
- 提供 Service UUID 和 Notify Characteristic
- 发送频率数据（uint16, Hz * 10）
- **BLE 固件现在就可以停在这里**

### App 侧负责
- ✅ 解码 BLE 数据（uint16 → Hz）
- ✅ 添加 timestamp
- ✅ 组装成 `SessionPayload`

## 向后兼容性

所有未来的 BLE 更新必须保持向后兼容：
- 必须继续支持 `SessionPayload` 格式
- 可以添加新字段，但不能删除或修改现有字段
- 新版本应该通过版本号区分，但消费端统一使用 `SessionPayload`

## 使用示例

```typescript
import { SessionPayload } from '@/src/types/ble';
import { assembleSessionPayload } from '@/src/utils/ble';

// BLE 固件发送原始数据
const rawSamples = [505, 510, 508, ...]; // uint16 (Hz * 10)

// App 侧组装成 SessionPayload
const sessionPayload: SessionPayload = assembleSessionPayload(
  'device-uuid',
  Date.now() - 300000,
  Date.now(),
  rawSamples
);
```

## 版本历史

- **v0.9** (当前) - 冻结版本，最小可用实现
  - 定义 `VibrationSample` 和 `SessionPayload`
  - 确定 BLE Characteristic 规范
  - 明确职责划分

