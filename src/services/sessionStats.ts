/**
 * Session Statistics Service
 * 
 * 统计函数：从 DeviceData 计算 SessionStats
 * 重要：不要在 PDF 里计算这些，应该在这里计算
 */

import { analyzeSessionStability } from '@/lib/services/ai/sessionAnalysis';

export interface DeviceDataRecord {
  frequencyHz?: number;
  frequency?: number; // 兼容旧字段
  timestamp?: Date;
  createdAt?: Date;
  amplitude?: number | null;
  mode?: string | null;
  intensity?: number | null;
}

export interface SessionStats {
  avgHz: number;
  maxHz: number;
  minHz: number;
  duration: number; // 分钟
  modeDistribution: Record<string, number>; // 模式分布
  stabilityScore: number;
  dataPointCount: number;
  frequencySamples: number[];
  frequencyData: Array<{ time: string; hz: number }>;
}

/**
 * 从 DeviceData 构建 SessionStats
 * 
 * @param deviceData DeviceData 记录数组
 * @param sessionStartTime 会话开始时间（用于计算 duration 和时间偏移）
 * @param sessionEndTime 会话结束时间（可选）
 * @returns SessionStats 统计信息
 */
export function buildSessionStats(
  deviceData: DeviceDataRecord[],
  sessionStartTime: Date,
  sessionEndTime?: Date | null
): SessionStats {
  // 如果没有数据，返回默认值
  if (!deviceData || deviceData.length === 0) {
    const duration = sessionEndTime
      ? Math.round((new Date(sessionEndTime).getTime() - sessionStartTime.getTime()) / 60000)
      : 0;
    
    return {
      avgHz: 0,
      maxHz: 0,
      minHz: 0,
      duration,
      modeDistribution: {},
      stabilityScore: 0,
      dataPointCount: 0,
      frequencySamples: [],
      frequencyData: [],
    };
  }

  // 提取频率值（兼容新旧字段）
  const frequencies = deviceData.map(record => {
    return (record.frequencyHz ?? record.frequency ?? 0);
  });

  // 计算基本统计
  const avgHz = frequencies.reduce((sum, hz) => sum + hz, 0) / frequencies.length;
  const maxHz = Math.max(...frequencies);
  const minHz = Math.min(...frequencies);

  // 计算时长（分钟）
  const duration = sessionEndTime
    ? Math.round((new Date(sessionEndTime).getTime() - sessionStartTime.getTime()) / 60000)
    : Math.round((Date.now() - sessionStartTime.getTime()) / 60000);

  // 计算模式分布
  const modeDistribution: Record<string, number> = {};
  deviceData.forEach(record => {
    if (record.mode) {
      modeDistribution[record.mode] = (modeDistribution[record.mode] || 0) + 1;
    }
  });

  // 计算稳定性评分（使用 AI 分析）
  const stabilityAnalysis = analyzeSessionStability(frequencies);
  const stabilityScore = stabilityAnalysis.score;

  // 准备频率曲线数据
  const sessionStartTimeMs = sessionStartTime.getTime();
  const frequencyData = deviceData.map((record, index) => {
    // 兼容新旧字段：优先使用 timestamp，否则使用 createdAt
    const recordTimestamp = record.timestamp ?? record.createdAt;
    const recordTime = recordTimestamp ? new Date(recordTimestamp).getTime() : sessionStartTimeMs + (index * 1000);
    const timeOffset = (recordTime - sessionStartTimeMs) / 1000; // 转换为秒
    
    const freq = record.frequencyHz ?? record.frequency ?? 0;
    return {
      time: `${Math.round(timeOffset)}s`,
      hz: Math.round(freq * 10) / 10,
    };
  });

  return {
    avgHz,
    maxHz,
    minHz,
    duration,
    modeDistribution,
    stabilityScore,
    dataPointCount: deviceData.length,
    frequencySamples: frequencies,
    frequencyData,
  };
}

