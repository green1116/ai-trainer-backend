# B2. 正确的 Profile 形式（JSON）

## 核心原则

**这是未来扩展所有型号的关键**  
**前端/AI 永远先读它**

## Profile JSON 格式

### 完整示例

```json
{
  "model": "FN-VIB-2025",
  "type": "vibration_platform",
  "frequencyHz": {
    "min": 1,
    "max": 60
  },
  "intensityLevels": 10,
  "modes": [
    {
      "key": "rehab",
      "label": {
        "zh": "康复",
        "en": "Rehab"
      },
      "frequencyRange": [5, 20]
    },
    {
      "key": "strength",
      "label": {
        "zh": "力量",
        "en": "Strength"
      },
      "frequencyRange": [25, 45]
    }
  ],
  "supports": {
    "realTimeStream": true,
    "presetPrograms": true
  }
}
```

## 字段说明

### 必需字段

#### `model` (string)
- **说明**: 设备型号
- **示例**: `"FN-VIB-2025"`

#### `frequencyHz` (object)
- **说明**: 设备频率范围
- **结构**:
  ```json
  {
    "min": 1,    // 最小频率 (Hz)
    "max": 60    // 最大频率 (Hz)
  }
  ```

#### `intensityLevels` (number)
- **说明**: 强度级别数
- **示例**: `10`

#### `modes` (array)
- **说明**: 设备模式列表
- **结构**: 每个模式对象包含：
  ```json
  {
    "key": "rehab",              // 模式键（用于 API）
    "label": {
      "zh": "康复",              // 中文标签
      "en": "Rehab"              // 英文标签
    },
    "frequencyRange": [5, 20]    // 该模式的频率范围 [min, max]
  }
  ```

### 可选字段

#### `type` (string)
- **说明**: 设备类型
- **示例**: `"vibration_platform"`, `"generic"`

#### `supports` (object)
- **说明**: 设备支持的功能
- **字段**:
  - `realTimeStream` (boolean): 是否支持实时数据流
  - `presetPrograms` (boolean): 是否支持预设程序
  - 其他自定义功能...

## 文件位置

```
src/devices/profiles/
├── fn_vibration.profile.json    # FN Vibration 设备配置
└── generic.profile.json          # 通用设备配置
```

## 使用方式

### 1. 创建 Profile 文件

在 `src/devices/profiles/` 目录创建 `{model_key}.profile.json`:

```json
{
  "model": "Your-Device-Model",
  "type": "your_device_type",
  "frequencyHz": {
    "min": 1,
    "max": 100
  },
  "intensityLevels": 10,
  "modes": [
    {
      "key": "mode1",
      "label": {
        "zh": "模式1",
        "en": "Mode 1"
      },
      "frequencyRange": [10, 50]
    }
  ],
  "supports": {
    "realTimeStream": true,
    "presetPrograms": false
  }
}
```

### 2. API 获取设备能力

```typescript
// GET /api/device/[id]/capability
const capability = await fetch(`/api/device/${deviceId}/capability`);
const profile = await capability.json();

// 使用设备能力
console.log(profile.model);                    // "FN-VIB-2025"
console.log(profile.frequencyHz.min);          // 1
console.log(profile.frequencyHz.max);          // 60
console.log(profile.modes[0].key);              // "rehab"
console.log(profile.modes[0].label.zh);        // "康复"
console.log(profile.modes[0].frequencyRange);  // [5, 20]
```

### 3. 前端使用示例

```typescript
// 获取设备能力
const profile = await getDeviceCapability(deviceId);

// 显示模式选择器
profile.modes.forEach(mode => {
  console.log(`${mode.label.zh} (${mode.label.en})`);
  console.log(`频率范围: ${mode.frequencyRange[0]}-${mode.frequencyRange[1]} Hz`);
});

// 验证频率是否在范围内
function validateFrequency(freq: number, profile: DeviceCapabilityProfile): boolean {
  return freq >= profile.frequencyHz.min && freq <= profile.frequencyHz.max;
}

// 验证模式是否支持
function validateMode(mode: string, profile: DeviceCapabilityProfile): boolean {
  return profile.modes.some(m => m.key === mode);
}
```

## 向后兼容

系统支持新旧两种格式：

### 新格式（推荐）
```json
{
  "model": "FN-VIB-2025",
  "frequencyHz": { "min": 1, "max": 60 },
  "intensityLevels": 10,
  "modes": [
    {
      "key": "rehab",
      "label": { "zh": "康复", "en": "Rehab" },
      "frequencyRange": [5, 20]
    }
  ]
}
```

### 旧格式（兼容）
```json
{
  "model": "FN-VIB-2025",
  "supports": {
    "frequencyRange": [1, 60],
    "modes": ["rehab", "strength"],
    "intensityLevels": 10
  }
}
```

系统会自动将旧格式转换为新格式。

## 关键要点

1. ✅ **多语言支持**: 每个模式都有中英文标签
2. ✅ **模式特定频率范围**: 每个模式可以有自己的频率范围
3. ✅ **可扩展性**: `supports` 对象可以添加任意自定义功能
4. ✅ **类型安全**: TypeScript 类型定义确保类型安全
5. ✅ **向后兼容**: 支持旧格式，平滑迁移

## 总结

**B2. 正确的 Profile 形式（JSON）** 提供了：
- 清晰的设备能力描述
- 多语言支持
- 模式特定的频率范围
- 可扩展的功能支持
- 向后兼容性

这是未来扩展所有型号的关键，前端/AI 永远先读它。

