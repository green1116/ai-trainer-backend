/**
 * BLE v0.9 数据契约 (最终建议版)
 * 
 * 设备 → App → 云端的统一结构
 */

// 单个采样点
export type VibrationSample = {
  t: number; // timestamp (ms)
  hz: number; // frequency in Hz
};

// 一次训练 Session
export type SessionPayload = {
  deviceId: string; // 设备唯一 ID
  startedAt: number; // ms
  endedAt: number; // ms
  samples: VibrationSample[]; // 采样点数组
  userId?: string; // 可选：用户ID（如果未提供，将从认证信息获取）
};

/**
 * AI 推荐参数
 * 
 * 用于 Dashboard 展示和人类确认
 */
export type AIRecommendation = {
  recommendedHzRange: [number, number]; // [minHz, maxHz]
  recommendedDuration: number; // seconds
  rationale: string; // 给人的解释
};

/**
 * 推荐的控制指令协议 (未来)
 * 
 * App → 设备的控制指令
 */
export type AIControlCommand = {
  mode: 'training' | 'rehab' | 'balance';
  targetHzRange: [number, number]; // [minHz, maxHz]
  duration: number; // seconds
};

