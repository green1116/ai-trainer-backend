/**
 * Device Adapter Types
 * 
 * 只存在于后端 - 前端、PDF、AI 永远看不到协议细节
 */

/**
 * 厂商协议类型
 */
export type VendorProtocol = {
  // 示例：厂商 A 的协议
  command?: string;
  frequency?: number;      // 频率（厂商协议可能使用 frequency）
  frequencyHz?: number;    // 或 frequencyHz
  mode?: string;
  intensity?: number;
  duration?: number;       // 时长（秒）
  durationSec?: number;     // 或 durationSec
  bleCommand?: number[];   // BLE 命令字节数组（用于 BLE 设备）
  // 或其他厂商特定的字段...
} | {
  // 示例：厂商 B 的协议
  action?: string;
  params?: Record<string, any>;
  bleCommand?: number[];   // BLE 命令字节数组（用于 BLE 设备）
} | string; // 某些厂商可能使用字符串协议

