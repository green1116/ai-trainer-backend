# B4. 正确调用方式 (示意)

## 核心原则

**前端永远先拉 profile，再渲染页面。**

## API 端点

```
GET /api/device/:deviceId/profile
```

## 请求示例

```typescript
// 前端代码示例
async function loadDeviceProfile(deviceId: string) {
  const response = await fetch(`/api/device/${deviceId}/profile`);
  const data = await response.json();
  return data.profile;
}

// 使用示例
const deviceProfile = await loadDeviceProfile('VP-2025-000001');
// 现在可以使用 profile 来渲染页面
```

## 响应格式

```json
{
  "deviceId": "VP-2025-000001",
  "deviceName": "FN-VIB-2025",
  "profile": {
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
}
```

## 正确的调用流程

### 1. 前端页面加载流程

```typescript
// 错误的做法 ❌
function DeviceControlPage({ deviceId }: { deviceId: string }) {
  const [frequency, setFrequency] = useState(35);
  
  // 直接渲染，没有先获取 profile
  return (
    <div>
      <input 
        type="number" 
        value={frequency} 
        onChange={(e) => setFrequency(Number(e.target.value))}
      />
    </div>
  );
}

// 正确的做法 ✅
function DeviceControlPage({ deviceId }: { deviceId: string }) {
  const [profile, setProfile] = useState<DeviceCapabilityProfile | null>(null);
  const [frequency, setFrequency] = useState(35);
  const [loading, setLoading] = useState(true);

  // 1. 先拉 profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`/api/device/${deviceId}/profile`);
        const data = await response.json();
        setProfile(data.profile);
        
        // 2. 再渲染页面（基于 profile）
        // 设置默认频率在设备支持范围内
        const defaultFreq = Math.max(
          data.profile.frequencyHz.min,
          Math.min(35, data.profile.frequencyHz.max)
        );
        setFrequency(defaultFreq);
      } catch (error) {
        console.error('Failed to load device profile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [deviceId]);

  // 3. 根据 profile 渲染 UI
  if (loading) {
    return <div>Loading device profile...</div>;
  }

  if (!profile) {
    return <div>Failed to load device profile</div>;
  }

  return (
    <div>
      {/* 根据 profile 动态渲染模式选择器 */}
      <select>
        {profile.modes.map(mode => (
          <option key={mode.key} value={mode.key}>
            {mode.label.zh} ({mode.label.en})
          </option>
        ))}
      </select>

      {/* 根据 profile 限制频率输入范围 */}
      <input 
        type="number" 
        value={frequency} 
        min={profile.frequencyHz.min}
        max={profile.frequencyHz.max}
        onChange={(e) => {
          const value = Number(e.target.value);
          if (value >= profile.frequencyHz.min && value <= profile.frequencyHz.max) {
            setFrequency(value);
          }
        }}
      />

      {/* 根据 profile 显示/隐藏功能按钮 */}
      {profile.supports?.realTimeStream && (
        <button>实时数据流</button>
      )}
      
      {profile.supports?.presetPrograms && (
        <button>预设程序</button>
      )}
    </div>
  );
}
```

### 2. React Hook 封装

```typescript
// 自定义 Hook：useDeviceProfile
function useDeviceProfile(deviceId: string) {
  const [profile, setProfile] = useState<DeviceCapabilityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const response = await fetch(`/api/device/${deviceId}/profile`);
        if (!response.ok) {
          throw new Error(`Failed to load profile: ${response.statusText}`);
        }
        const data = await response.json();
        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    if (deviceId) {
      loadProfile();
    }
  }, [deviceId]);

  return { profile, loading, error };
}

// 使用 Hook
function DeviceControlPage({ deviceId }: { deviceId: string }) {
  const { profile, loading, error } = useDeviceProfile(deviceId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!profile) return <div>No profile found</div>;

  // 现在可以安全地使用 profile
  return (
    <div>
      <h1>{profile.model}</h1>
      {/* ... */}
    </div>
  );
}
```

### 3. 验证函数

```typescript
// 根据 profile 验证参数
function validateDeviceCommand(
  command: DeviceCommand,
  profile: DeviceCapabilityProfile
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证频率
  if (command.params.frequencyHz !== undefined) {
    if (command.params.frequencyHz < profile.frequencyHz.min) {
      errors.push(`Frequency ${command.params.frequencyHz} Hz is below minimum ${profile.frequencyHz.min} Hz`);
    }
    if (command.params.frequencyHz > profile.frequencyHz.max) {
      errors.push(`Frequency ${command.params.frequencyHz} Hz is above maximum ${profile.frequencyHz.max} Hz`);
    }
  }

  // 验证模式
  if (command.params.mode !== undefined) {
    const modeKeys = profile.modes.map(m => m.key);
    if (!modeKeys.includes(command.params.mode)) {
      errors.push(`Mode "${command.params.mode}" is not supported. Available modes: ${modeKeys.join(', ')}`);
    }
  }

  // 验证强度
  if (command.params.intensity !== undefined) {
    if (command.params.intensity < 0 || command.params.intensity > profile.intensityLevels) {
      errors.push(`Intensity ${command.params.intensity} is out of range [0, ${profile.intensityLevels}]`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## 关键要点

1. ✅ **前端永远先拉 profile**
   - 在渲染任何 UI 之前，先调用 `/api/device/:deviceId/profile`
   - 等待 profile 加载完成后再渲染页面

2. ✅ **基于 profile 渲染 UI**
   - 根据 `profile.modes` 动态渲染模式选择器
   - 根据 `profile.frequencyHz` 限制频率输入范围
   - 根据 `profile.supports` 显示/隐藏功能按钮

3. ✅ **验证用户输入**
   - 在发送命令前，使用 profile 验证所有参数
   - 禁用不符合 profile 的选项

4. ✅ **错误处理**
   - 如果 profile 加载失败，显示错误信息
   - 如果设备不存在，显示 404 错误

## 与 B3 的关系

- **B3. Profile 在系统中的作用**：说明了 Profile 在 Frontend、AI、PDF 中的作用
- **B4. 正确调用方式**：说明了前端如何正确获取和使用 Profile

两者结合，确保：
- 前端先拉 profile
- 基于 profile 渲染 UI
- 验证用户输入
- AI 推荐遵守 profile
- PDF 标注设备能力

## 总结

**B4. 正确调用方式** 的核心是：

```
前端永远先拉 profile，再渲染页面。
```

这确保了：
- UI 根据设备能力动态调整
- 用户输入始终在有效范围内
- 系统行为与设备能力一致

