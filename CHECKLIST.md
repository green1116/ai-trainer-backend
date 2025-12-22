# 关键文件检查清单

## 必须存在的关键文件

### ✅ 1. `src/services/llm/index.ts`
**状态**: ✅ 存在  
**路径**: `ai-trainer-backend/src/services/llm/index.ts`  
**功能**: 统一 LLM 服务接口，导出 `generateAINarrative` 函数

### ✅ 2. `src/services/llm/mock.ts`
**状态**: ✅ 存在  
**路径**: `ai-trainer-backend/src/services/llm/mock.ts`  
**功能**: Mock LLM Provider，导出 `generateNarrativeMock` 函数

### ✅ 3. `app/api/session/[id]/pdf/route.ts`
**状态**: ✅ 存在  
**路径**: `ai-trainer-backend/app/api/session/[id]/pdf/route.ts`  
**说明**: Next.js App Router 架构，PDF 生成 API 路由  
**注意**: 路径为 `app/api/session/[id]/pdf/route.ts`（不是 `src/api/session/pdf.ts`）

## 文件结构

```
ai-trainer-backend/
├── src/
│   └── services/
│       └── llm/
│           ├── index.ts          ✅ 统一接口
│           ├── mock.ts            ✅ Mock Provider
│           ├── provider.ts        ✅ Provider 抽象
│           ├── openai.ts          ✅ OpenAI Provider
│           └── openrouter.ts      ✅ OpenRouter Provider
└── app/
    └── api/
        └── session/
            └── [id]/
                └── pdf/
                    └── route.ts   ✅ PDF 生成 API
```

## 验证方法

### 方法 1: 使用文件系统检查

```bash
# Windows PowerShell
cd ai-trainer-backend
Test-Path "src/services/llm/index.ts"
Test-Path "src/services/llm/mock.ts"
Test-Path "app/api/session/[id]/pdf/route.ts"
```

### 方法 2: 使用代码导入测试

```typescript
// 测试导入
import { generateAINarrative } from '@/src/services/llm';
import { generateNarrativeMock } from '@/src/services/llm/mock';
```

## 相关文件

- `src/types/ble.ts` - BLE 数据契约类型定义
- `src/constants/ble.ts` - BLE Characteristic 常量
- `src/utils/ble.ts` - BLE 数据处理工具
- `src/constants/deviceId.ts` - DeviceId 规范常量
- `src/utils/deviceId.ts` - DeviceId 工具函数

## 注意事项

1. **Next.js App Router**: API 路由在 `app/api/` 目录下，不是 `src/api/`
2. **路径别名**: 使用 `@/src/` 或 `@/app/` 来导入文件
3. **LLM 服务**: 统一通过 `src/services/llm/index.ts` 访问

