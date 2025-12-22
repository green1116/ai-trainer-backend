/**
 * Provider 抽象 (openai / openrouter / mock)
 * 
 * 定义 LLM Provider 的抽象接口，支持多种实现
 */

export interface LLMProvider {
  /**
   * 生成自然语言文本
   * @param prompt 提示词
   * @param options 可选参数
   * @returns 生成的文本
   */
  generate(prompt: string, options?: LLMGenerateOptions): Promise<string>;
}

export interface LLMGenerateOptions {
  maxTokens?: number;
  temperature?: number;
  locale?: string;
}

/**
 * Provider 类型
 */
export type ProviderType = 'openai' | 'openrouter' | 'mock';


