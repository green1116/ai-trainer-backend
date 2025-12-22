# AI 控制闭环流程图

## 1️⃣ 整体闭环流程图（文字版）

```
设备采集 Hz
    ↓
Session 数据入库
    ↓
规则 AI（score / 稳定性）
    ↓
LLM Narrative（解释 & 建议）
    ↓
Dashboard 展示「AI 推荐参数」
    ↓
人类确认（教练 / 用户）
    ↓
设备执行（未来）
```

## 详细流程说明

### 阶段 1: 设备采集 Hz

**描述**: 设备通过 BLE 实时采集振动频率数据

**实现**:
- BLE 设备通过 `FREQUENCY_NOTIFY` Characteristic 推送频率数据
- App 监听 Notify，接收 uint16 (Hz x 10) 格式数据
- 转换为 `{t, hz}` 格式并存储到 `samples` 数组

**数据格式**:
```typescript
VibrationSample = {
  t: number;  // timestamp (ms)
  hz: number; // frequency (Hz)
}
```

**相关代码**:
- `ble-trainer-app/app/adapters/bleAdapter.ts`
- `ble-trainer-app/app/hooks/useFrequencyReader.ts`

---

### 阶段 2: Session 数据入库

**描述**: Session 结束后，将采集的数据上传到后端并存储到数据库

**实现**:
- App 组装 `SessionPayload` 格式数据
- 通过 `POST /api/session` 上传到后端
- 后端验证 `deviceId`，查找 Device 并获取 `clinicId`
- 创建 Session 记录，存储 `samples` 数据（JSON 格式）

**数据格式**:
```typescript
SessionPayload = {
  deviceId: string;
  startedAt: number;
  endedAt: number;
  samples: VibrationSample[];
}
```

**相关代码**:
- `ai-trainer-backend/app/api/session/route.ts` (POST)
- `ai-trainer-backend/prisma/schema.prisma` (Session 模型)

---

### 阶段 3: 规则 AI（score / 稳定性）

**描述**: 使用规则引擎分析 Session 数据，计算稳定性评分

**实现**:
- 从 `samples` 中提取频率数组
- 使用 `analyzeSessionStability` 函数分析：
  - 计算稳定性评分（0-100）
  - 计算稳定性指标（方差、标准差等）
  - 确定稳定性等级（excellent, good, fair, poor）
  - 生成洞察（insights）

**输出**:
```typescript
{
  score: number;           // 0-100
  stabilityLevel: string;  // 'excellent' | 'good' | 'fair' | 'poor'
  metrics: {
    variance: number;
    stdDev: number;
    minHz: number;
    maxHz: number;
    // ...
  },
  insights: string[];
}
```

**相关代码**:
- `ai-trainer-backend/lib/services/ai/sessionAnalysis.ts`

---

### 阶段 4: LLM Narrative（解释 & 建议）

**描述**: 使用 LLM 生成自然语言解释和建议

**实现**:
- 输入：规则 AI 的分析结果（score, avgHz, duration）
- 使用 `generateAINarrative` 函数生成叙事文本
- 支持多语言（中文/英文）
- 根据用户计划（pro/clinic）决定是否生成

**输出**:
```typescript
string // 自然语言文本，例如：
// "AI 分析结果：本次训练稳定性评分为 85/100，平均频率为 35.5Hz，
//  训练时长 300 秒。整体表现良好，建议在当前频率区间下继续保持训练..."
```

**相关代码**:
- `ai-trainer-backend/src/services/llm/index.ts`
- `ai-trainer-backend/src/services/llm/mock.ts`

---

### 阶段 5: Dashboard 展示「AI 推荐参数」

**描述**: 在 Dashboard 上展示 AI 分析结果和推荐参数

**实现**:
- 查询 Session 详情（包含 AI 分析结果）
- 展示：
  - 稳定性评分
  - AI Narrative 文本
  - 推荐频率范围
  - 推荐训练时长
  - 其他建议参数

**展示内容**:
```typescript
{
  score: 85,
  stabilityLevel: 'good',
  aiNarrative: '...',
  recommendations: {
    targetHzRange: [30, 40],
    duration: 300,
    // ...
  }
}
```

**相关代码**:
- `app/dashboard/session/[id]/page.tsx`
- `ai-trainer-backend/app/api/session/[id]/route.ts`

---

### 阶段 6: 人类确认（教练 / 用户）

**描述**: 教练或用户查看 AI 推荐参数，确认或调整

**实现**:
- Dashboard 显示 AI 推荐参数
- 提供确认/调整界面
- 用户可以：
  - 接受 AI 推荐
  - 手动调整参数
  - 添加备注或反馈

**交互流程**:
```
用户查看 Dashboard
    ↓
查看 AI 推荐参数
    ↓
确认或调整参数
    ↓
保存参数设置
```

**相关代码**:
- `app/dashboard/session/[id]/page.tsx` (前端展示)
- `app/api/session/[id]/recommendations/route.ts` (未来 API)

---

### 阶段 7: 设备执行（未来）

**描述**: 将确认的参数发送到设备执行

**实现**:
- 将确认的参数转换为设备控制指令
- 通过 BLE 发送控制命令到设备
- 设备接收并执行参数设置

**控制指令格式** (未来):
```typescript
AIControlCommand = {
  mode: 'training' | 'rehab' | 'balance';
  targetHzRange: [number, number]; // [minHz, maxHz]
  duration: number; // seconds
}
```

**相关代码**:
- `ai-trainer-backend/src/types/ble.ts` (AIControlCommand 类型)
- `ble-trainer-app/app/adapters/bleAdapter.ts` (未来扩展)

---

## 完整数据流

```
┌─────────────┐
│  设备采集   │ → Hz 数据 (uint16, Hz x 10)
└─────────────┘
      ↓
┌─────────────┐
│  App 采集   │ → {t, hz}[] samples
└─────────────┘
      ↓
┌─────────────┐
│ Session 入库 │ → SessionPayload → Database
└─────────────┘
      ↓
┌─────────────┐
│  规则 AI    │ → score, stabilityLevel, metrics
└─────────────┘
      ↓
┌─────────────┐
│ LLM Narrative│ → 自然语言解释和建议
└─────────────┘
      ↓
┌─────────────┐
│ Dashboard   │ → 展示 AI 推荐参数
└─────────────┘
      ↓
┌─────────────┐
│  人类确认   │ → 确认/调整参数
└─────────────┘
      ↓
┌─────────────┐
│  设备执行   │ → 执行参数设置（未来）
└─────────────┘
```

## 当前实现状态

| 阶段 | 状态 | 说明 |
|------|------|------|
| 1. 设备采集 Hz | ✅ 已完成 | BLE Adapter 已实现 |
| 2. Session 数据入库 | ✅ 已完成 | API 和数据库已实现 |
| 3. 规则 AI | ✅ 已完成 | `analyzeSessionStability` 已实现 |
| 4. LLM Narrative | ✅ 已完成 | `generateAINarrative` 已实现 |
| 5. Dashboard 展示 | ✅ 已完成 | 前端页面已实现 |
| 6. 人类确认 | 🔜 待实现 | 需要添加确认/调整界面 |
| 7. 设备执行 | 🔜 待实现 | 需要实现控制指令发送 |

## 下一步工作

### 阶段 6: 人类确认

**需要实现**:
1. 推荐参数展示组件
2. 参数调整界面
3. 确认/保存 API

**API 设计**:
```typescript
POST /api/session/{id}/recommendations
{
  targetHzRange: [number, number];
  duration: number;
  confirmedBy: string; // userId
}
```

### 阶段 7: 设备执行

**需要实现**:
1. 控制指令编码
2. BLE 写入 Characteristic
3. 设备响应处理

**实现示例**:
```typescript
async function sendControlCommand(
  device: Device,
  command: AIControlCommand
) {
  const service = await device.services().then(...);
  const char = await service.characteristics().then(...);
  const encoded = encodeControlCommand(command);
  await char.writeWithResponse(encoded);
}
```

## 相关文档

- **生命周期**: `docs/LIFECYCLE.md`
- **版本声明**: `VERSION_DECLARATION.md`
- **BLE 接口**: `ble-trainer-app/docs/BLE_INTERFACE_SPEC.md`
- **AI 分析**: `lib/services/ai/sessionAnalysis.ts`
- **LLM 服务**: `src/services/llm/index.ts`

