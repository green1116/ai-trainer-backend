# AI 推荐参数 API 设计（未来）

## 概述

本文档描述阶段 6（人类确认）和阶段 7（设备执行）的 API 设计。

## API 端点

### 1. 获取 AI 推荐参数

**端点**: `GET /api/session/{id}/recommendations`

**描述**: 获取 Session 的 AI 推荐参数

**响应**:
```typescript
{
  sessionId: string;
  aiAnalysis: {
    score: number;
    stabilityLevel: string;
    metrics: object;
  };
  recommendation: AIRecommendation; // AI 推荐参数
  aiNarrative: string;
}
```

**AIRecommendation 类型**:
```typescript
type AIRecommendation = {
  recommendedHzRange: [number, number]; // [minHz, maxHz]
  recommendedDuration: number; // seconds
  rationale: string; // 给人的解释
};
```

### 2. 确认/调整推荐参数

**端点**: `POST /api/session/{id}/recommendations/confirm`

**描述**: 确认或调整 AI 推荐参数

**请求体**:
```typescript
{
  targetHzRange: [number, number];
  duration: number;
  mode: 'training' | 'rehab' | 'balance';
  confirmedBy: string; // userId
  notes?: string; // 备注
}
```

**响应**:
```typescript
{
  ok: true;
  recommendationId: string;
  confirmedAt: string;
}
```

### 3. 发送控制指令到设备（未来）

**端点**: `POST /api/device/{deviceId}/control`

**描述**: 发送控制指令到设备执行

**请求体**:
```typescript
{
  command: AIControlCommand;
  sessionId?: string; // 关联的 Session ID
}
```

**响应**:
```typescript
{
  ok: true;
  commandId: string;
  sentAt: string;
}
```

## 数据模型

### Recommendation 模型（未来）

```prisma
model Recommendation {
  id          String   @id @default(uuid())
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id])
  
  // AI 推荐参数
  targetHzRange Json   // [minHz, maxHz]
  duration      Int    // seconds
  mode          String // 'training' | 'rehab' | 'balance'
  
  // 确认信息
  confirmedBy   String? // userId
  confirmedAt   DateTime?
  notes         String?
  
  // 执行状态（未来）
  executed      Boolean @default(false)
  executedAt    DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## 实现优先级

### Phase 1: 推荐参数展示（当前）

- ✅ 获取 Session 详情（包含 AI 分析）
- ✅ 展示 AI Narrative
- 🔜 展示推荐参数（需要扩展 API）

### Phase 2: 人类确认（下一步）

- 🔜 推荐参数展示组件
- 🔜 参数调整表单
- 🔜 确认 API

### Phase 3: 设备执行（未来）

- 🔜 控制指令编码
- 🔜 BLE 写入实现
- 🔜 设备响应处理

## 相关文档

- **闭环流程**: `docs/AI_CONTROL_FLOW.md`
- **控制指令类型**: `src/types/ble.ts` (AIControlCommand)
- **AI 分析**: `lib/services/ai/sessionAnalysis.ts`

