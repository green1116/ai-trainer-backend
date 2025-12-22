/**
 * 统一的"中间指令模型"
 * 
 * 这是系统的"语言中枢"
 * 你以后全靠它
 * 
 * 位置：src/devices/types.ts
 */

// src/devices/types.ts
export type DeviceAction = "start" | "stop" | "set";

export interface DeviceCommand {
  action: DeviceAction;
  params?: {
    frequencyHz?: number;
    intensity?: number;
    mode?: string;
    durationSec?: number;
  };
}

/**
 * 设备指令响应
 */
export interface DeviceCommandResponse {
  success: boolean;
  message?: string;
  error?: string;
}

