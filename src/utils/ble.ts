/**
 * BLE 数据处理工具函数
 * 
 * App 侧负责：
 * - 解码 BLE 数据
 * - 添加 timestamp
 * - 组装成 SessionPayload
 */

import { VibrationSample, SessionPayload } from '../types/ble';

/**
 * 解码 BLE 频率数据
 * BLE 固件发送的是 uint16 (Hz * 10)，需要除以 10 得到实际 Hz 值
 * 
 * @param rawValue BLE 原始值 (uint16, Hz * 10)
 * @returns 实际频率值 (Hz)
 */
export function decodeFrequency(rawValue: number): number {
  return rawValue / 10;
}

/**
 * 编码频率值为 BLE 格式
 * 将 Hz 值乘以 10 转换为 uint16
 * 
 * @param hz 频率值 (Hz)
 * @returns BLE 原始值 (uint16, Hz * 10)
 */
export function encodeFrequency(hz: number): number {
  return Math.round(hz * 10);
}

/**
 * 从 BLE 原始数据创建 VibrationSample
 * 
 * @param rawValue BLE 原始值 (uint16, Hz * 10)
 * @param timestamp 时间戳 (ms)，如果不提供则使用当前时间
 * @returns VibrationSample
 */
export function createVibrationSample(
  rawValue: number,
  timestamp?: number
): VibrationSample {
  return {
    t: timestamp ?? Date.now(),
    hz: decodeFrequency(rawValue),
  };
}

/**
 * 从 BLE 数据流组装 SessionPayload
 * 
 * @param deviceId 设备唯一 ID
 * @param startedAt 开始时间 (ms)
 * @param endedAt 结束时间 (ms)
 * @param rawSamples BLE 原始数据数组 (uint16[], Hz * 10)
 * @param timestamps 时间戳数组 (ms)，如果不提供则根据 startedAt 和采样间隔自动生成
 * @returns SessionPayload
 */
export function assembleSessionPayload(
  deviceId: string,
  startedAt: number,
  endedAt: number,
  rawSamples: number[],
  timestamps?: number[]
): SessionPayload {
  const samples: VibrationSample[] = rawSamples.map((rawValue, index) => {
    let timestamp: number;
    
    if (timestamps && timestamps[index] !== undefined) {
      timestamp = timestamps[index];
    } else {
      // 如果没有提供时间戳，根据采样间隔自动生成
      const interval = rawSamples.length > 1 
        ? (endedAt - startedAt) / (rawSamples.length - 1)
        : 0;
      timestamp = startedAt + index * interval;
    }
    
    return createVibrationSample(rawValue, timestamp);
  });

  return {
    deviceId,
    startedAt,
    endedAt,
    samples,
  };
}

