/**
 * BLE Characteristic 常量定义
 * 
 * BLE v0.9 - 最小可用版本
 * 
 * BLE 接口规范（对外）:
 * - Service UUID: VIBRATION_SERVICE
 * - Notify Char: FREQUENCY_NOTIFY
 * - Payload: uint16 (Hz x 10)
 */

// Service UUID
// 注意：这是占位符名称，实际使用时需要替换为真实的 UUID
// 例如：'0000180f-0000-1000-8000-00805f9b34fb'
export const VIBRATION_SERVICE = 'VIBRATION_SERVICE';

// Notify Characteristic UUID
// 注意：这是占位符名称，实际使用时需要替换为真实的 UUID
// 例如：'00002a19-0000-1000-8000-00805f9b34fb'
export const FREQUENCY_NOTIFY = 'FREQUENCY_NOTIFY';

// Payload 格式说明
// uint16 (Hz x 10) - 频率值乘以10，用于保留一位小数精度
// 例如：50.5 Hz 会编码为 505 (uint16)
// 解码：rawValue / 10 = 实际频率（Hz）

