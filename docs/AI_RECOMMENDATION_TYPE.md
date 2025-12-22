# AIRecommendation 类型说明

## 类型定义

```typescript
type AIRecommendation = {
  recommendedHzRange: [number, number]; // [minHz, maxHz]
  recommendedDuration: number; // seconds
  rationale: string; // 给人的解释
};
```

## 字段说明

### recommendedHzRange

- **类型**: `[number, number]`
- **格式**: `[minHz, maxHz]`
- **单位**: 赫兹（Hz）
- **说明**: AI 推荐的频率范围，训练时应该保持在这个范围内

**示例**:
```typescript
recommendedHzRange: [30, 40] // 推荐在 30-40 Hz 范围内训练
```

### recommendedDuration

- **类型**: `number`
- **单位**: 秒（seconds）
- **说明**: AI 推荐的每次训练时长

**示例**:
```typescript
recommendedDuration: 300 // 推荐每次训练 300 秒（5 分钟）
```

### rationale

- **类型**: `string`
- **说明**: 给人看的解释，说明为什么推荐这些参数
- **语言**: 支持中文和英文，根据 `locale` 参数生成

**示例（中文）**:
```typescript
rationale: "本次训练稳定性评分为 85/100，表现优秀。建议在 30-40 Hz 频率范围内继续训练，每次训练 300 秒。当前频率区间表现稳定，可以保持或适当扩展训练范围。"
```

**示例（英文）**:
```typescript
rationale: "Your training stability score is 85/100, which is excellent. We recommend continuing training in the 30-40 Hz frequency range for 300 seconds per session. Your current frequency range is stable and can be maintained or slightly expanded."
```

## 生成逻辑

推荐参数基于以下因素生成：

1. **稳定性评分** (`score`): 0-100
   - ≥ 80: 优秀，可以扩展频率范围
   - 60-79: 良好，保持当前范围
   - 40-59: 一般，缩小频率范围
   - < 40: 较差，使用保守范围（25-35 Hz）

2. **平均频率** (`avgHz`): 当前训练的平均频率

3. **频率范围** (`minHz`, `maxHz`): 当前训练的频率范围

4. **稳定性等级** (`stabilityLevel`): excellent, good, fair, poor

## 使用示例

### 生成推荐参数

```typescript
import { generateAIRecommendation } from '@/lib/services/ai/recommendation';

const analysis = {
  score: 85,
  stabilityLevel: 'excellent',
  metrics: {
    average: 35.5,
    variance: 2.3,
    stdDev: 1.5,
    min: 32,
    max: 38,
  },
};

const recommendation = generateAIRecommendation(analysis, 'zh');
console.log(recommendation);
// {
//   recommendedHzRange: [30, 40],
//   recommendedDuration: 300,
//   rationale: "本次训练稳定性评分为 85/100..."
// }
```

### API 响应

```typescript
GET /api/session/{id}

Response: {
  // ... 其他字段
  recommendation: {
    recommendedHzRange: [30, 40],
    recommendedDuration: 300,
    rationale: "本次训练稳定性评分为 85/100..."
  }
}
```

## 相关文件

- **类型定义**: `src/types/ble.ts`
- **生成服务**: `src/services/ai/recommendation.ts`
- **API 端点**: `app/api/session/[id]/route.ts`

