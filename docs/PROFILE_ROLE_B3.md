# B3. Profile 在系统中的作用

## 核心原则

**Profile 是系统的"能力描述中枢"**  
**前端、AI、PDF 都依赖它来正确工作**

## 三个关键作用域

### 1. Frontend (前端)

#### 动态渲染按钮 (Dynamically render buttons)

前端根据 Profile 动态显示或隐藏 UI 元素：

```typescript
// 示例：根据设备能力动态渲染模式选择器
const profile = await getDeviceCapability(deviceId);

// 只显示设备支持的模式
profile.modes.forEach(mode => {
  if (mode.key === 'rehab' && profile.supports?.presetPrograms) {
    // 显示康复模式按钮
    renderModeButton(mode.key, mode.label.zh);
  }
});

// 根据设备类型显示/隐藏功能
if (profile.supports?.realTimeStream) {
  // 显示实时数据流按钮
  renderRealTimeStreamButton();
}
```

#### 禁用非法参数 (Disable invalid parameters)

前端使用 Profile 验证和限制用户输入：

```typescript
// 频率范围验证
function validateFrequency(freq: number, profile: DeviceCapabilityProfile): boolean {
  return freq >= profile.frequencyHz.min && freq <= profile.frequencyHz.max;
}

// 模式验证
function validateMode(mode: string, profile: DeviceCapabilityProfile): boolean {
  return profile.modes.some(m => m.key === mode);
}

// 强度级别验证
function validateIntensity(intensity: number, profile: DeviceCapabilityProfile): boolean {
  return intensity >= 0 && intensity <= profile.intensityLevels;
}

// 在表单中使用
<Select
  value={frequency}
  onChange={(value) => {
    if (validateFrequency(value, profile)) {
      setFrequency(value);
    } else {
      // 显示错误提示
      showError(`频率必须在 ${profile.frequencyHz.min}-${profile.frequencyHz.max} Hz 范围内`);
    }
  }}
  disabled={!validateFrequency(frequency, profile)}
>
  {/* 只显示有效范围内的选项 */}
  {generateFrequencyOptions(profile.frequencyHz.min, profile.frequencyHz.max)}
</Select>
```

### 2. AI (Future) (AI (以后))

#### 只在允许范围内推荐 (Only recommend within the allowed range)

AI 推荐引擎必须检查 Profile 来确保推荐值在设备支持范围内：

```typescript
// AI 推荐函数
export function generateAIRecommendation(
  analysis: SessionAnalysisResult,
  deviceProfile: DeviceCapabilityProfile,  // 添加 Profile 参数
  locale: 'zh' | 'en' = 'zh'
): AIRecommendation {
  const { score, metrics } = analysis;
  const avgHz = metrics.average;

  // 使用 recommendParams 生成推荐
  const params = recommendParams(avgHz);
  
  // 关键：限制推荐值在设备支持范围内
  const recommendedHzRange: [number, number] = [
    Math.max(params.hzRange[0], deviceProfile.frequencyHz.min),  // 不低于最小值
    Math.min(params.hzRange[1], deviceProfile.frequencyHz.max),   // 不超过最大值
  ];
  
  // 验证推荐的模式是否支持
  const recommendedMode = params.mode || 'training';
  const isModeSupported = deviceProfile.modes.some(m => m.key === recommendedMode);
  
  if (!isModeSupported) {
    // 如果推荐的模式不支持，使用第一个支持的模式
    recommendedMode = deviceProfile.modes[0]?.key || 'training';
  }

  // 验证推荐的强度是否在范围内
  const recommendedIntensity = Math.min(
    params.intensity || 80,
    deviceProfile.intensityLevels
  );

  const durationMinutes = Math.floor(params.duration / 60);
  let rationale: string;

  if (locale === 'zh') {
    rationale = `基于本次训练的平均频率 ${avgHz.toFixed(1)} Hz，建议在 ${recommendedHzRange[0]}-${recommendedHzRange[1]} Hz 频率范围内继续训练（设备支持范围：${deviceProfile.frequencyHz.min}-${deviceProfile.frequencyHz.max} Hz），每次训练 ${durationMinutes} 分钟。`;
  } else {
    rationale = `Based on your average frequency of ${avgHz.toFixed(1)} Hz, we recommend training in the ${recommendedHzRange[0]}-${recommendedHzRange[1]} Hz frequency range (device supports: ${deviceProfile.frequencyHz.min}-${deviceProfile.frequencyHz.max} Hz) for ${durationMinutes} minutes per session.`;
  }

  return {
    recommendedHzRange,
    recommendedDuration: params.duration,
    recommendedMode,
    recommendedIntensity,
    rationale,
  };
}
```

### 3. PDF

#### 标注"设备支持能力" (Annotate 'Device Support Capabilities')

PDF 生成时包含设备能力信息：

```typescript
// PDF 生成函数
async function generatePDFReport(
  session: Session,
  deviceProfile: DeviceCapabilityProfile
): Promise<Buffer> {
  const html = `
    <html>
      <head>
        <title>训练报告</title>
      </head>
      <body>
        <h1>训练会话报告</h1>
        
        <!-- 设备信息 -->
        <section>
          <h2>设备信息</h2>
          <p><strong>设备型号：</strong>${deviceProfile.model}</p>
          <p><strong>设备类型：</strong>${deviceProfile.type || 'N/A'}</p>
        </section>
        
        <!-- 设备支持能力 -->
        <section>
          <h2>设备支持能力</h2>
          <p><strong>频率范围：</strong>${deviceProfile.frequencyHz.min} - ${deviceProfile.frequencyHz.max} Hz</p>
          <p><strong>强度级别：</strong>${deviceProfile.intensityLevels} 级</p>
          
          <h3>支持的模式：</h3>
          <ul>
            ${deviceProfile.modes.map(mode => `
              <li>
                <strong>${mode.label.zh} (${mode.label.en})</strong>
                - 频率范围: ${mode.frequencyRange[0]}-${mode.frequencyRange[1]} Hz
              </li>
            `).join('')}
          </ul>
          
          <h3>其他功能：</h3>
          <ul>
            ${deviceProfile.supports?.realTimeStream ? '<li>✓ 实时数据流</li>' : ''}
            ${deviceProfile.supports?.presetPrograms ? '<li>✓ 预设程序</li>' : ''}
          </ul>
        </section>
        
        <!-- 训练数据 -->
        <section>
          <h2>训练数据</h2>
          <p>平均频率: ${session.avgHz} Hz</p>
          <p>训练时长: ${session.duration} 秒</p>
          <!-- ... 其他训练数据 ... -->
        </section>
      </body>
    </html>
  `;
  
  // 生成 PDF
  return generatePDF(html);
}
```

## 实现检查清单

### Frontend
- [ ] 在设备控制页面获取并显示 Profile
- [ ] 根据 Profile 动态渲染模式选择器
- [ ] 根据 Profile 限制频率输入范围
- [ ] 根据 Profile 限制强度输入范围
- [ ] 根据 Profile 显示/隐藏功能按钮
- [ ] 在发送命令前验证参数是否符合 Profile

### AI (Future)
- [ ] AI 推荐函数接收 Profile 参数
- [ ] 限制推荐频率在设备支持范围内
- [ ] 验证推荐模式是否支持
- [ ] 限制推荐强度在设备支持范围内
- [ ] 在推荐理由中说明设备限制

### PDF
- [ ] PDF 生成时获取设备 Profile
- [ ] 在 PDF 中显示设备型号和类型
- [ ] 在 PDF 中标注频率范围
- [ ] 在 PDF 中列出支持的模式
- [ ] 在 PDF 中显示其他支持的功能

## 关键要点

1. ✅ **前端永远先读 Profile**
   - 在渲染 UI 前获取设备能力
   - 根据能力动态调整界面

2. ✅ **AI 推荐必须遵守 Profile**
   - 所有推荐值必须在设备支持范围内
   - 推荐理由中说明设备限制

3. ✅ **PDF 必须标注设备能力**
   - 让用户了解设备支持的功能
   - 帮助理解训练数据的上下文

4. ✅ **统一的数据源**
   - Profile 是唯一的能力描述来源
   - 所有组件都从同一个 Profile 读取

## 总结

**B3. Profile 在系统中的作用** 确保了：
- 前端根据设备能力动态调整界面
- AI 推荐遵守设备限制
- PDF 报告包含设备能力信息

这是系统正确工作的关键，所有组件都必须依赖 Profile。

