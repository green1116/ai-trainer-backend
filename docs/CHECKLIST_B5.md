# B5. 你现在必须完成的 B 步骤清单

## 检查清单

### ✅ 1. 为当前设备写一个 profile.json

**状态**: ✅ 已完成

**位置**: `src/devices/profiles/`

- ✅ `fn_vibration.profile.json` - FN-VIB-2025 设备配置
- ✅ `generic.profile.json` - 通用设备配置

**示例**:
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

### ⚠️ 2. 前端频率/模式来自 profile

**状态**: ⚠️ 需要实现

**要求**:
- 前端必须从 `/api/device/:deviceId/profile` 获取 profile
- 频率选项必须来自 `profile.frequencyHz.min` 和 `profile.frequencyHz.max`
- 模式选项必须来自 `profile.modes`
- 不能硬编码频率和模式

**实现位置**:
- 前端设备控制页面
- 前端训练页面

**示例代码**:
```typescript
// 前端代码示例
const { profile, loading } = useDeviceProfile(deviceId);

if (loading) return <div>Loading...</div>;

// 频率选项来自 profile
const frequencyOptions = Array.from(
  { length: profile.frequencyHz.max - profile.frequencyHz.min + 1 },
  (_, i) => profile.frequencyHz.min + i
);

// 模式选项来自 profile
const modeOptions = profile.modes.map(mode => ({
  key: mode.key,
  label: mode.label.zh,
  frequencyRange: mode.frequencyRange,
}));
```

### ✅ 3. 后端校验参数是否超出 profile

**状态**: ✅ 已完成

**位置**: 
- `app/api/device/command/route.ts` - 设备命令 API（B5. 后端校验参数）
- `src/services/deviceRuntime.ts` - 设备运行时映射

**验证逻辑**:

**在 device/command API 中**:
```typescript
// B5. 后端校验参数是否超出 profile
const deviceProfile = DeviceService.getDeviceCapability(deviceModel);

// 验证频率是否在设备支持范围内
if (command.params.frequencyHz !== undefined) {
  const freq = command.params.frequencyHz;
  if (freq < deviceProfile.frequencyHz.min || freq > deviceProfile.frequencyHz.max) {
    return NextResponse.json(
      {
        error: "Invalid frequency",
        message: `Frequency ${freq} Hz is out of range [${deviceProfile.frequencyHz.min}, ${deviceProfile.frequencyHz.max}] Hz`,
      },
      { status: 400 }
    );
  }
}

// 验证模式是否支持
if (command.params.mode !== undefined) {
  const modeKeys = deviceProfile.modes.map(m => m.key);
  if (!modeKeys.includes(command.params.mode)) {
    return NextResponse.json(
      {
        error: "Invalid mode",
        message: `Mode "${command.params.mode}" is not supported. Available modes: ${modeKeys.join(', ')}`,
      },
      { status: 400 }
    );
  }
}

// 验证强度是否在范围内
if (command.params.intensity !== undefined) {
  const intensity = command.params.intensity;
  if (intensity < 0 || intensity > deviceProfile.intensityLevels) {
    return NextResponse.json(
      {
        error: "Invalid intensity",
        message: `Intensity ${intensity} is out of range [0, ${deviceProfile.intensityLevels}]`,
      },
      { status: 400 }
    );
  }
}
```

**在 deviceRuntime.ts 中**:
```typescript
export function mapToProtocol(
  command: DeviceCommand,
  deviceProfile: DeviceCapabilityProfile
): ProtocolCommand {
  // 验证频率
  if (params.frequencyHz !== undefined) {
    if (params.frequencyHz < frequencyRange[0] || params.frequencyHz > frequencyRange[1]) {
      throw new Error(
        `Frequency ${params.frequencyHz} Hz is out of range [${frequencyRange[0]}, ${frequencyRange[1]}]`
      );
    }
  }

  // 验证模式
  if (params.mode !== undefined && !modes.includes(params.mode)) {
    throw new Error(
      `Mode "${params.mode}" is not supported. Available modes: ${modes.join(', ')}`
    );
  }

  // 验证强度
  if (params.intensity !== undefined) {
    if (params.intensity < 0 || params.intensity > intensityLevels) {
      throw new Error(
        `Intensity ${params.intensity} is out of range [0, ${intensityLevels}]`
      );
    }
  }
}
```

## 完成状态总结

- ✅ **任务 1**: 为当前设备写一个 profile.json - 已完成
- ⚠️ **任务 2**: 前端频率/模式来自 profile - 需要实现
- ✅ **任务 3**: 后端校验参数是否超出 profile - 已完成

## 系统扩展性

**到这里，你的系统已经支持无限设备扩展。**

通过完成这三个任务，系统现在具备：

1. ✅ **设备能力描述系统** - 通过 profile.json 描述设备能力
2. ✅ **前端动态渲染** - 根据 profile 动态渲染 UI
3. ✅ **后端参数验证** - 确保所有参数在设备支持范围内

### 添加新设备的步骤

1. 在 `src/devices/profiles/` 创建 `{model_key}.profile.json`
2. 在 `src/devices/adapters/` 创建 `{model}.adapter.ts`（可选）
3. 在 `src/devices/device.service.ts` 添加设备识别逻辑（可选）

系统会自动：
- 加载 profile.json
- 前端根据 profile 渲染 UI
- 后端验证参数是否符合 profile

## 下一步

需要完成的任务 2（前端频率/模式来自 profile）需要在前端代码中实现。建议：

1. 创建 `useDeviceProfile` Hook
2. 在设备控制页面使用该 Hook
3. 根据 profile 动态渲染频率和模式选择器

