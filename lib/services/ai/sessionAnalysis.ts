/**
 * 规则分析服务：基于频率数据生成结构化的 AI 分析结果 (JSON)
 * 
 * 架构流程：
 * Hz 数据 → 规则分析 → 结构化 AI 结果 (JSON)
 */

export interface StabilityAnalysisResult {
  score: number; // 稳定性评分 0-100
  metrics: {
    average: number;
    variance: number;
    stdDev: number;
    coefficientOfVariation: number; // 变异系数 (%)
    min: number;
    max: number;
    range: number;
  };
  stabilityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  insights: {
    primary: string; // 主要发现
    secondary: string[]; // 次要发现
  };
}

/**
 * 规则分析：基于频率数据计算稳定性指标
 * @param samples 频率数据数组
 * @returns 结构化的分析结果 (JSON)
 */
export function analyzeSessionStability(samples: number[]): StabilityAnalysisResult {
  if (samples.length === 0) {
    return {
      score: 0,
      metrics: {
        average: 0,
        variance: 0,
        stdDev: 0,
        coefficientOfVariation: 100,
        min: 0,
        max: 0,
        range: 0,
      },
      stabilityLevel: 'poor',
      insights: {
        primary: 'no_data',
        secondary: [],
      },
    };
  }

  // 计算统计指标
  const avg = samples.reduce((sum, val) => sum + val, 0) / samples.length;
  const variance = samples.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avg > 0 ? (stdDev / avg) * 100 : 100;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min;

  // 计算稳定性评分 (0-100)
  // 变异系数越小，稳定性越高
  let stabilityScore = 100;
  if (coefficientOfVariation > 20) {
    stabilityScore = Math.max(0, 100 - (coefficientOfVariation - 20) * 2);
  } else if (coefficientOfVariation > 10) {
    stabilityScore = 100 - (coefficientOfVariation - 10) * 3;
  } else {
    stabilityScore = 100 - coefficientOfVariation * 2;
  }
  stabilityScore = Math.round(Math.max(0, Math.min(100, stabilityScore)));

  // 确定稳定性等级
  let stabilityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  if (stabilityScore >= 90) {
    stabilityLevel = 'excellent';
  } else if (stabilityScore >= 75) {
    stabilityLevel = 'good';
  } else if (stabilityScore >= 60) {
    stabilityLevel = 'fair';
  } else {
    stabilityLevel = 'poor';
  }

  // 生成结构化洞察
  const insights = {
    primary: '',
    secondary: [] as string[],
  };

  if (stabilityLevel === 'excellent') {
    insights.primary = 'very_stable';
    insights.secondary = ['minimal_variation', 'high_quality_execution'];
  } else if (stabilityLevel === 'good') {
    insights.primary = 'relatively_stable';
    insights.secondary = ['minor_fluctuations', 'good_performance'];
  } else if (stabilityLevel === 'fair') {
    insights.primary = 'moderate_variation';
    insights.secondary = ['needs_improvement', 'focus_required'];
  } else {
    insights.primary = 'significant_variation';
    insights.secondary = ['low_stability', 'check_environment'];
  }

  return {
    score: stabilityScore,
    metrics: {
      average: Math.round(avg * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      coefficientOfVariation: Math.round(coefficientOfVariation * 10) / 10,
      min,
      max,
      range,
    },
    stabilityLevel,
    insights,
  };
}

