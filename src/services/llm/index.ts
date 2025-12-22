/**
 * 对外统一接口
 * 
 * 提供统一的 LLM 服务接口，隐藏底层 Provider 实现细节
 */

import type { LLMProvider, ProviderType, LLMGenerateOptions } from './provider';
import { MockLLMProvider, generateNarrativeMock } from './mock';
import { OpenAIProvider } from './openai';
import { OpenRouterProvider } from './openrouter';
// import { generateNarrativeOpenRouter } from './openrouter';

class LLMService {
  private provider: LLMProvider;
  private providerType: ProviderType;

  constructor(providerType?: ProviderType) {
    // 从环境变量读取配置，默认使用 mock
    const type = providerType || (process.env.LLM_PROVIDER as ProviderType) || 'mock';
    this.providerType = type;
    this.provider = this.createProvider(type);
  }

  private createProvider(type: ProviderType): LLMProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider();
      case 'openrouter':
        return new OpenRouterProvider();
      case 'mock':
      default:
        return new MockLLMProvider();
    }
  }

  /**
   * 生成自然语言文本
   * @param prompt 提示词
   * @param options 可选参数
   * @returns 生成的文本
   */
  async generate(prompt: string, options?: LLMGenerateOptions): Promise<string> {
    return this.provider.generate(prompt, options);
  }

  /**
   * 获取当前使用的 Provider 类型
   */
  getProviderType(): ProviderType {
    return this.providerType;
  }

  /**
   * 切换 Provider
   */
  switchProvider(type: ProviderType): void {
    this.providerType = type;
    this.provider = this.createProvider(type);
  }
}

// 导出单例实例
export const llmService = new LLMService();

/**
 * 生成 AI 叙事文本的统一接口
 * 
 * 这是统一的入口点，所有 AI Narrative 生成都通过这里
 * 根据环境变量 LLM_PROVIDER 选择不同的实现
 * 
 * @param params 参数对象
 * @param params.score 稳定性评分 (0-100)
 * @param params.avgHz 平均频率
 * @param params.duration 训练时长（秒）
 * @param params.locale 语言代码 ('zh' | 'en')
 * @returns 生成的叙事文本
 */
export async function generateAINarrative(params: {
  score: number;
  avgHz: number;
  duration: number;
  locale: 'en' | 'zh';
}) {
  const provider = process.env.LLM_PROVIDER || 'mock';

  if (provider === 'mock') {
    return generateNarrativeMock(params);
  }

  // if (provider === 'openrouter') {
  //   return generateNarrativeOpenRouter(params);
  // }

  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

// 导出类型和类（用于需要自定义实例的场景）
export { LLMService };
export type { ProviderType, LLMGenerateOptions } from './provider';
export { MockLLMProvider, generateNarrativeMock } from './mock';
export { OpenAIProvider } from './openai';
export { OpenRouterProvider } from './openrouter';


