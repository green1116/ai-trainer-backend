# AI 控制闭环流程 v1.0

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

## 详细说明

### 阶段 1: 设备采集 Hz
- BLE 设备通过 Notify 推送频率数据
- App 接收并转换为 `{t, hz}` 格式

### 阶段 2: Session 数据入库
- App 上传 `SessionPayload` 到后端
- 后端存储到数据库

### 阶段 3: 规则 AI
- 分析频率数据，计算稳定性评分
- 生成稳定性指标和洞察

### 阶段 4: LLM Narrative
- 生成自然语言解释和建议
- 支持多语言（中文/英文）

### 阶段 5: Dashboard 展示
- 展示 AI 分析结果
- 展示推荐参数

### 阶段 6: 人类确认
- 教练/用户查看推荐参数
- 确认或调整参数

### 阶段 7: 设备执行
- 发送控制指令到设备
- 设备执行参数设置

## 实现状态

| 阶段 | 状态 | 说明 |
|------|------|------|
| 1-2 | ✅ 已完成 | BLE 采集和数据入库 |
| 3-4 | ✅ 已完成 | AI 分析和 Narrative |
| 5 | ✅ 已完成 | Dashboard 展示 |
| 6 | 🔜 待实现 | 人类确认界面 |
| 7 | 🔜 待实现 | 设备控制指令 |

## 相关文档

- **完整流程**: `docs/AI_CONTROL_FLOW.md`
- **API 设计**: `docs/AI_RECOMMENDATIONS_API.md`
- **控制指令**: `src/types/ble.ts` (AIControlCommand)
