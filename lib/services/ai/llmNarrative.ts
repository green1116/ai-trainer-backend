/**
 * LLM 叙事服务：将结构化的 AI 分析结果转换为自然语言解释
 * 
 * 架构流程：
 * 结构化 AI 结果 (JSON) → 大模型 → 自然语言解释
 */

import { StabilityAnalysisResult } from './sessionAnalysis';
import { llmService } from '@/src/services/llm';

export interface NarrativeResult {
  summary: string; // 自然语言摘要
  recommendations: string[]; // 训练建议
}

/**
 * 将结构化的分析结果转换为自然语言解释
 * 
 * 使用统一的 LLM 服务接口，支持多种 Provider (mock/openai/openrouter)
 * 
 * @param analysisResult 结构化的分析结果
 * @param locale 语言代码 ('zh' | 'en')
 * @returns 自然语言解释
 */
export async function generateNarrative(
  analysisResult: StabilityAnalysisResult,
  locale: string = 'zh'
): Promise<NarrativeResult> {
  try {
    // 构建 LLM Prompt
    const prompt = buildLLMPrompt(analysisResult, locale);
    
    // 调用 LLM 服务生成自然语言解释
    const llmResponse = await llmService.generate(prompt, {
      locale,
      maxTokens: 500,
      temperature: 0.7,
    });
    
    // 解析 LLM 响应（如果返回的是完整 JSON，需要解析；如果是纯文本，直接使用）
    return parseLLMResponse(llmResponse, analysisResult, locale);
  } catch (error) {
    console.warn('LLM generation failed, falling back to template:', error);
    // 如果 LLM 调用失败，回退到模板生成
    return generateNarrativeFromTemplate(analysisResult, locale);
  }
}

/**
 * 解析 LLM 响应
 * 如果 LLM 返回的是结构化 JSON，解析它；否则使用纯文本作为 summary
 */
function parseLLMResponse(
  llmResponse: string,
  analysisResult: StabilityAnalysisResult,
  locale: string
): NarrativeResult {
  try {
    // 尝试解析为 JSON
    const parsed = JSON.parse(llmResponse);
    if (parsed.summary && Array.isArray(parsed.recommendations)) {
      return {
        summary: parsed.summary,
        recommendations: parsed.recommendations,
      };
    }
  } catch {
    // 如果不是 JSON，将响应作为 summary，使用模板生成 recommendations
    const templateResult = generateNarrativeFromTemplate(analysisResult, locale);
    return {
      summary: llmResponse.trim(),
      recommendations: templateResult.recommendations,
    };
  }
  
  // 默认返回模板结果
  return generateNarrativeFromTemplate(analysisResult, locale);
}

/**
 * 基于模板生成自然语言解释（临时方案，待替换为真实 LLM）
 */
function generateNarrativeFromTemplate(
  analysisResult: StabilityAnalysisResult,
  locale: string
): NarrativeResult {
  const { score, stabilityLevel, insights, metrics } = analysisResult;
  
  let summary = '';
  const recommendations: string[] = [];

  if (stabilityLevel === 'excellent') {
    summary = locale === 'zh'
      ? `训练频率非常稳定，波动极小（变异系数 ${metrics.coefficientOfVariation.toFixed(1)}%）。这表明训练执行质量很高，频率控制精准。建议继续保持当前训练模式，这种稳定性有助于最大化训练效果。`
      : `Training frequency is very stable with minimal variation (coefficient of variation ${metrics.coefficientOfVariation.toFixed(1)}%). This indicates high-quality execution with precise frequency control. Continue maintaining the current training pattern, as this stability helps maximize training effectiveness.`;
    
    recommendations.push(
      locale === 'zh'
        ? '继续保持当前训练强度和频率'
        : 'Continue maintaining current training intensity and frequency'
    );
    recommendations.push(
      locale === 'zh'
        ? '可以适当增加训练时长以进一步提升效果'
        : 'Consider gradually increasing training duration for further improvement'
    );
  } else if (stabilityLevel === 'good') {
    summary = locale === 'zh'
      ? `训练频率较为稳定，有轻微波动（变异系数 ${metrics.coefficientOfVariation.toFixed(1)}%）。整体表现良好，频率控制基本到位。建议注意保持频率的一致性，减少不必要的波动可以进一步提升训练质量。`
      : `Training frequency is relatively stable with minor fluctuations (coefficient of variation ${metrics.coefficientOfVariation.toFixed(1)}%). Overall performance is good with adequate frequency control. Focus on maintaining frequency consistency, as reducing unnecessary fluctuations can further improve training quality.`;
    
    recommendations.push(
      locale === 'zh'
        ? '注意保持训练时的专注度，减少频率波动'
        : 'Maintain focus during training to reduce frequency fluctuations'
    );
    recommendations.push(
      locale === 'zh'
        ? '检查训练环境，确保设备稳定运行'
        : 'Check training environment to ensure stable device operation'
    );
  } else if (stabilityLevel === 'fair') {
    summary = locale === 'zh'
      ? `训练频率存在一定波动（变异系数 ${metrics.coefficientOfVariation.toFixed(1)}%），稳定性有待提升。频率范围从 ${metrics.min} Hz 到 ${metrics.max} Hz，波动幅度为 ${metrics.range.toFixed(1)} Hz。建议加强训练时的专注度，保持更稳定的频率输出。`
      : `Training frequency shows some variation (coefficient of variation ${metrics.coefficientOfVariation.toFixed(1)}%), with stability needing improvement. Frequency ranges from ${metrics.min} Hz to ${metrics.max} Hz, with a variation of ${metrics.range.toFixed(1)} Hz. Focus on maintaining concentration during training for more consistent frequency output.`;
    
    recommendations.push(
      locale === 'zh'
        ? '加强训练时的专注度，保持更稳定的频率输出'
        : 'Enhance focus during training to maintain more stable frequency output'
    );
    recommendations.push(
      locale === 'zh'
        ? '考虑调整训练姿势，确保身体稳定'
        : 'Consider adjusting training posture to ensure body stability'
    );
    recommendations.push(
      locale === 'zh'
        ? '适当降低训练强度，专注于频率控制'
        : 'Consider reducing training intensity and focus on frequency control'
    );
  } else {
    summary = locale === 'zh'
      ? `训练频率波动较大（变异系数 ${metrics.coefficientOfVariation.toFixed(1)}%），稳定性较低。频率范围从 ${metrics.min} Hz 到 ${metrics.max} Hz，波动幅度达到 ${metrics.range.toFixed(1)} Hz。建议检查设备状态和训练姿势，确保训练环境稳定，并考虑降低训练强度以改善频率控制。`
      : `Training frequency shows significant variation (coefficient of variation ${metrics.coefficientOfVariation.toFixed(1)}%), with low stability. Frequency ranges from ${metrics.min} Hz to ${metrics.max} Hz, with a variation of ${metrics.range.toFixed(1)} Hz. Check device status and training posture, ensure a stable training environment, and consider reducing training intensity to improve frequency control.`;
    
    recommendations.push(
      locale === 'zh'
        ? '检查设备状态，确保设备正常工作'
        : 'Check device status to ensure normal operation'
    );
    recommendations.push(
      locale === 'zh'
        ? '调整训练姿势，确保身体稳定'
        : 'Adjust training posture to ensure body stability'
    );
    recommendations.push(
      locale === 'zh'
        ? '降低训练强度，专注于基础频率控制'
        : 'Reduce training intensity and focus on basic frequency control'
    );
    recommendations.push(
      locale === 'zh'
        ? '确保训练环境安静、稳定，减少干扰'
        : 'Ensure a quiet and stable training environment with minimal distractions'
    );
  }

  return {
    summary,
    recommendations,
  };
}

/**
 * 构建 LLM Prompt（用于未来集成真实 LLM API）
 */
export function buildLLMPrompt(
  analysisResult: StabilityAnalysisResult,
  locale: string
): string {
  const prompt = locale === 'zh'
    ? `请基于以下训练数据分析结果，生成一段自然、专业的训练稳定性分析报告：

稳定性评分：${analysisResult.score}/100
稳定性等级：${analysisResult.stabilityLevel}
平均频率：${analysisResult.metrics.average} Hz
变异系数：${analysisResult.metrics.coefficientOfVariation}%
频率范围：${analysisResult.metrics.min} - ${analysisResult.metrics.max} Hz

请用中文生成一段200字左右的自然语言分析，包括：
1. 对训练稳定性的评价
2. 主要发现和原因分析
3. 针对性的训练建议

要求：语言自然流畅，专业但易懂，具有指导性。`
    : `Please generate a natural, professional training stability analysis report based on the following training data analysis results:

Stability Score: ${analysisResult.score}/100
Stability Level: ${analysisResult.stabilityLevel}
Average Frequency: ${analysisResult.metrics.average} Hz
Coefficient of Variation: ${analysisResult.metrics.coefficientOfVariation}%
Frequency Range: ${analysisResult.metrics.min} - ${analysisResult.metrics.max} Hz

Please generate a natural language analysis in English (approximately 200 words) including:
1. Evaluation of training stability
2. Key findings and cause analysis
3. Targeted training recommendations

Requirements: Natural and fluent language, professional but easy to understand, with guidance.`;

  return prompt;
}

