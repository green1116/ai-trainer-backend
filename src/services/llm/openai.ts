/**
 * OpenAI Provider - 以后用
 * 
 * 集成 OpenAI API 的实现
 */

import { LLMProvider, LLMGenerateOptions } from './provider';

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.baseURL = baseURL || 'https://api.openai.com/v1';
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // 或使用环境变量配置
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
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }
}


