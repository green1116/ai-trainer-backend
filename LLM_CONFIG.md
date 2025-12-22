# LLM Provider 配置说明

## Step 2 | .env 配置（现在不用 Key）

在 `ai-trainer-backend/.env` 文件中添加以下配置：

```env
LLM_PROVIDER=mock
```

✅ **你现在完全不需要 OpenAI / OpenRouter Key**

当前使用 Mock Provider，无需任何 API Key，可以直接使用。

## Step 3 | 以后接 OpenRouter 时你只做 3 件事

### 1. 新建 openrouter.ts
✅ **已完成** - `src/services/llm/openrouter.ts` 已创建

### 2. 解开 import
在 `src/services/llm/index.ts` 中取消注释：

```typescript
// 取消注释这一行
import { generateNarrativeOpenRouter } from './openrouter';

// 取消注释这个 if 分支
if (provider === 'openrouter') {
  return generateNarrativeOpenRouter(params);
}
```

### 3. 改 .env
在 `.env` 文件中修改：

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_HTTP_REFERER=http://localhost:6001
```

## 重要提示

📌 **PDF / Dashboard / 商业逻辑全部不动**

切换 LLM Provider 不会影响：
- PDF 报告生成
- Dashboard 显示
- 业务逻辑

所有功能都会自动使用新的 Provider。

## 当前支持的 Provider

- ✅ `mock` - Mock Provider（默认，无需 API Key）
- 🔜 `openrouter` - OpenRouter Provider（已实现，待启用）
- 🔜 `openai` - OpenAI Provider（待实现）

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `LLM_PROVIDER` | LLM Provider 类型 | `mock` | 否 |
| `OPENROUTER_API_KEY` | OpenRouter API Key | - | 使用 openrouter 时必需 |
| `OPENROUTER_MODEL` | OpenRouter 模型 | `anthropic/claude-3-haiku` | 否 |
| `OPENROUTER_HTTP_REFERER` | HTTP Referer | `http://localhost:6001` | 否 |
| `OPENAI_API_KEY` | OpenAI API Key | - | 使用 openai 时必需 |

