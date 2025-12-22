/**
 * AI 推荐参数生成服务
 * 
 * 基于 Session 分析结果生成推荐参数
 * 
 * B3. Profile 在系统中的作用：AI 只在允许范围内推荐
 */

import { AIRecommendation } from '@/src/types/ble';
import { DeviceCapabilityProfile } from '@/src/types/deviceCapability';

interface SessionAnalysisResult {
  score: number; // 0-100
  stabilityLevel: string;
  metrics: {
    average: number; // avgHz
    variance: number;
    stdDev: number;
    min: number; // minHz
    max: number; // maxHz
  };
}

/**
 * 简单的推荐参数生成函数
 * 基于平均频率生成固定的频率范围和持续时间
 * 
 * @param avgHz 平均频率
 * @returns 推荐的频率范围和持续时间
 */
export function recommendParams(avgHz: number) {
  return {
    hzRange: [avgHz - 2, avgHz + 2] as [number, number],
    duration: 600, // 10 min
  };
}

/**
 * 生成 AI 推荐参数
 * 
 * 使用简单的 recommendParams 逻辑：保守 + 可解释 + 好卖
 * 
 * B3. Profile 在系统中的作用：AI 只在允许范围内推荐
 * 
 * @param analysis Session 分析结果
 * @param deviceProfile 设备能力描述（可选，如果提供则限制推荐范围）
 * @param locale 语言代码
 * @returns AI 推荐参数
 */
export function generateAIRecommendation(
  analysis: SessionAnalysisResult,
  deviceProfile?: DeviceCapabilityProfile,
  locale: 'zh' | 'en' = 'zh'
): AIRecommendation {
  const { score, metrics } = analysis;
  const avgHz = metrics.average;

  // 使用简单的 recommendParams 函数生成推荐参数
  // 保守策略：基于 avgHz ± 2，固定 10 分钟
  const params = recommendParams(avgHz);
  let recommendedHzRange = params.hzRange;
  const recommendedDuration = params.duration; // 600 秒 = 10 分钟

  // B3. Profile 在系统中的作用：限制推荐值在设备支持范围内
  if (deviceProfile) {
    // 限制频率范围在设备支持范围内
    recommendedHzRange = [
      Math.max(recommendedHzRange[0], deviceProfile.frequencyHz.min),  // 不低于最小值
      Math.min(recommendedHzRange[1], deviceProfile.frequencyHz.max),   // 不超过最大值
    ] as [number, number];
    
    // 如果推荐范围无效（最小值大于最大值），使用设备支持范围
    if (recommendedHzRange[0] > recommendedHzRange[1]) {
      recommendedHzRange = [
        deviceProfile.frequencyHz.min,
        deviceProfile.frequencyHz.max,
      ] as [number, number];
    }
  }

  // 生成可解释的 rationale
  const durationMinutes = Math.floor(recommendedDuration / 60);
  let rationale: string;

  if (locale === 'zh') {
    if (deviceProfile) {
      rationale = `基于本次训练的平均频率 ${avgHz.toFixed(1)} Hz，建议在 ${recommendedHzRange[0]}-${recommendedHzRange[1]} Hz 频率范围内继续训练（设备支持范围：${deviceProfile.frequencyHz.min}-${deviceProfile.frequencyHz.max} Hz），每次训练 ${durationMinutes} 分钟。此推荐基于当前训练表现和设备能力，采用保守且可解释的策略，有助于稳定提升训练效果。`;
    } else {
      rationale = `基于本次训练的平均频率 ${avgHz.toFixed(1)} Hz，建议在 ${recommendedHzRange[0]}-${recommendedHzRange[1]} Hz 频率范围内继续训练，每次训练 ${durationMinutes} 分钟。此推荐基于当前训练表现，采用保守且可解释的策略，有助于稳定提升训练效果。`;
    }
  } else {
    if (deviceProfile) {
      rationale = `Based on your average frequency of ${avgHz.toFixed(1)} Hz, we recommend training in the ${recommendedHzRange[0]}-${recommendedHzRange[1]} Hz frequency range (device supports: ${deviceProfile.frequencyHz.min}-${deviceProfile.frequencyHz.max} Hz) for ${durationMinutes} minutes per session. This recommendation is based on your current training performance and device capabilities, using a conservative and explainable strategy to help you steadily improve.`;
    } else {
      rationale = `Based on your average frequency of ${avgHz.toFixed(1)} Hz, we recommend training in the ${recommendedHzRange[0]}-${recommendedHzRange[1]} Hz frequency range for ${durationMinutes} minutes per session. This recommendation is based on your current training performance, using a conservative and explainable strategy to help you steadily improve.`;
    }
  }

  return {
    recommendedHzRange,
    recommendedDuration,
    rationale,
  };
}

