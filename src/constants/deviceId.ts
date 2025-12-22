/**
 * DeviceId 规范 (强烈建议)
 * 
 * 格式: VP-YYYY-NNNNNN
 * - VP = Vibration Platform
 * - YYYY = 年份
 * - NNNNNN = 序列号（6位数字，前导零）
 * 
 * 示例: VP-2025-000001
 * 
 * ⚠️ 警告：不要用 MAC 地址作为对外 ID（隐私 + 更换风险）
 */

// DeviceId 前缀
export const DEVICE_ID_PREFIX = 'VP';

// DeviceId 格式正则表达式
export const DEVICE_ID_PATTERN = /^VP-\d{4}-\d{6}$/;

// DeviceId 格式说明
export const DEVICE_ID_FORMAT = 'VP-YYYY-NNNNNN';

// DeviceId 示例
export const DEVICE_ID_EXAMPLE = 'VP-2025-000001';

