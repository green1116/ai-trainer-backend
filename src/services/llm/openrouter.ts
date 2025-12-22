/**
 * OpenRouter Provider - 以后用
 * 
 * 集成 OpenRouter API 的实现（支持多种模型）
 */

import { LLMProvider, LLMGenerateOptions } from './provider';

/**
 * 生成训练叙事文本的 OpenRouter 函数
 * 
 * @param params 参数对象
 * @param params.score 稳定性评分 (0-100)
 * @param params.avgHz 平均频率
 * @param params.duration 训练时长（秒）
 * @param params.locale 语言代码 ('zh' | 'en')
 * @returns 生成的叙事文本
 */
export async function generateNarrativeOpenRouter(params: {
  score: number;
  avgHz: number;
  duration: number;
  locale: 'en' | 'zh';
}): Promise<string> {
  const provider = new OpenRouterProvider();
  
  // 构建 prompt
  const prompt = params.locale === 'zh'
    ? `请基于以下训练数据生成一段 AI 分析报告：
稳定性评分：${params.score}/100
平均频率：${params.avgHz} Hz
训练时长：${params.duration} 秒

请生成一段自然、专业的分析文本，包括对训练稳定性的评价和建议。`
    : `Please generate an AI analysis report based on the following training data:
Stability Score: ${params.score}/100
Average Frequency: ${params.avgHz} Hz
Training Duration: ${params.duration} seconds

Please generate a natural, professional analysis text including evaluation of training stability and recommendations.`;

  return provider.generate(prompt, {
    locale: params.locale,
    maxTokens: 500,
    temperature: 0.7,
  });
}

export class OpenRouterProvider implements LLMProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(apiKey?: string, model?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    this.model = model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';
    this.baseURL = baseURL || 'https://openrouter.ai/api/v1';
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:6001',
          'X-Title': 'AI Trainer Backend',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options?.maxTokens || 500,
          temperature: options?.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      throw error;
    }
  }
}


