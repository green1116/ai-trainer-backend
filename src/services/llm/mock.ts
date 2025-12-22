/**
 * Mock Provider - 当前使用 (无 API Key)
 * 
 * 使用基于规则的模板生成，不调用真实 LLM API
 */

import { LLMProvider, LLMGenerateOptions } from './provider';

export class MockLLMProvider implements LLMProvider {
  async generate(prompt: string, options?: LLMGenerateOptions): Promise<string> {
    // Mock 实现：基于 prompt 的关键词返回预设响应
    // 这是一个简化版本，实际应该解析 prompt 并返回更智能的响应
    
    const locale = options?.locale || 'zh';
    
    // 简单的关键词匹配逻辑（临时方案）
    if (prompt.includes('稳定性') || prompt.includes('stability')) {
      if (prompt.includes('非常稳定') || prompt.includes('very stable')) {
        return locale === 'zh'
          ? '训练频率非常稳定，波动极小。这表明训练执行质量很高，建议继续保持当前训练模式。'
          : 'Training frequency is very stable with minimal variation. This indicates high-quality execution. Continue maintaining the current training pattern.';
      } else if (prompt.includes('较为稳定') || prompt.includes('relatively stable')) {
        return locale === 'zh'
          ? '训练频率较为稳定，有轻微波动。整体表现良好，建议注意保持频率的一致性。'
          : 'Training frequency is relatively stable with minor fluctuations. Overall performance is good. Focus on maintaining frequency consistency.';
      } else if (prompt.includes('波动') || prompt.includes('variation')) {
        return locale === 'zh'
          ? '训练频率存在一定波动，稳定性有待提升。建议加强训练时的专注度，保持更稳定的频率输出。'
          : 'Training frequency shows some variation. Stability needs improvement. Focus on maintaining concentration during training for more consistent frequency output.';
      }
    }
    
    // 默认响应
    return locale === 'zh'
      ? '基于训练数据分析，建议继续关注频率稳定性，保持训练质量。'
      : 'Based on training data analysis, continue focusing on frequency stability to maintain training quality.';
  }
}

/**
 * 生成训练叙事文本的 Mock 函数
 * 
 * @param score 稳定性评分 (0-100)
 * @param avgHz 平均频率
 * @param duration 训练时长（秒）
 * @param locale 语言代码
 * @returns 生成的叙事文本
 */
export async function generateNarrativeMock({
  score,
  avgHz,
  duration,
  locale,
}: {
  score: number;
  avgHz: number;
  duration: number;
  locale: 'en' | 'zh';
}) {
  if (locale === 'zh') {
    return `AI 分析结果：本次训练稳定性评分为 ${score}/100，平均频率为 ${avgHz}Hz，训练时长 ${duration} 秒。整体表现良好，建议在当前频率区间下继续保持训练，并注意训练后的恢复情况。`;
  }

  return `AI analysis indicates a stability score of ${score}/100 with an average frequency of ${avgHz} Hz over a ${duration}-second session. Performance is stable and suitable for continued training within the current frequency range.`;
}


