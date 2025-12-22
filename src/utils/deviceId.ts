/**
 * DeviceId 工具函数
 * 
 * 用于生成和验证 DeviceId
 */

import { DEVICE_ID_PATTERN, DEVICE_ID_PREFIX, DEVICE_ID_FORMAT } from '../constants/deviceId';

/**
 * 验证 DeviceId 格式
 * 
 * @param deviceId 设备 ID
 * @returns 是否为有效格式
 */
export function isValidDeviceId(deviceId: string): boolean {
  return DEVICE_ID_PATTERN.test(deviceId);
}

/**
 * 生成 DeviceId
 * 
 * @param year 年份（默认当前年份）
 * @param serialNumber 序列号（1-999999）
 * @returns 格式化的 DeviceId
 */
export function generateDeviceId(year?: number, serialNumber: number = 1): string {
  const currentYear = year ?? new Date().getFullYear();
  const paddedSerial = serialNumber.toString().padStart(6, '0');
  
  return `${DEVICE_ID_PREFIX}-${currentYear}-${paddedSerial}`;
}

/**
 * 解析 DeviceId
 * 
 * @param deviceId 设备 ID
 * @returns 解析结果，如果格式无效返回 null
 */
export function parseDeviceId(deviceId: string): {
  prefix: string;
  year: number;
  serialNumber: number;
} | null {
  if (!isValidDeviceId(deviceId)) {
    return null;
  }
  
  const parts = deviceId.split('-');
  return {
    prefix: parts[0],
    year: parseInt(parts[1], 10),
    serialNumber: parseInt(parts[2], 10),
  };
}

/**
 * 验证并规范化 DeviceId
 * 
 * @param deviceId 设备 ID
 * @returns 规范化后的 DeviceId，如果无效则抛出错误
 */
export function normalizeDeviceId(deviceId: string): string {
  const trimmed = deviceId.trim();
  
  if (!isValidDeviceId(trimmed)) {
    throw new Error(
      `Invalid DeviceId format: "${deviceId}". Expected format: ${DEVICE_ID_FORMAT}`
    );
  }
  
  return trimmed;
}

