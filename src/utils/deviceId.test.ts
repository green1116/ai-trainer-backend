/**
 * DeviceId 工具函数测试示例
 */

import { generateDeviceId, isValidDeviceId, parseDeviceId, normalizeDeviceId } from './deviceId';

// 测试用例示例
export const testCases = {
  valid: [
    'VP-2025-000001',
    'VP-2024-123456',
    'VP-2023-000001',
  ],
  invalid: [
    'VP-2025-1',           // 序列号位数不足
    'VP-25-000001',        // 年份位数不足
    'VP-2025-0000001',     // 序列号位数过多
    'MAC-AA:BB:CC:DD:EE:FF', // MAC 地址格式（不应使用）
    'device-123',          // 不符合格式
  ],
};

// 使用示例
if (require.main === module) {
  console.log('=== DeviceId 工具函数测试 ===\n');
  
  // 测试生成
  console.log('1. 生成 DeviceId:');
  console.log('   ', generateDeviceId(2025, 1));      // VP-2025-000001
  console.log('   ', generateDeviceId(2025, 123));    // VP-2025-000123
  console.log('   ', generateDeviceId());             // VP-2025-000001 (使用当前年份)
  
  // 测试验证
  console.log('\n2. 验证 DeviceId:');
  testCases.valid.forEach(id => {
    console.log(`   ${id}: ${isValidDeviceId(id) ? '✓' : '✗'}`);
  });
  testCases.invalid.forEach(id => {
    console.log(`   ${id}: ${isValidDeviceId(id) ? '✗' : '✓ (正确拒绝)'}`);
  });
  
  // 测试解析
  console.log('\n3. 解析 DeviceId:');
  const parsed = parseDeviceId('VP-2025-000001');
  console.log('   ', parsed);
  
  // 测试规范化
  console.log('\n4. 规范化 DeviceId:');
  try {
    console.log('   ', normalizeDeviceId('VP-2025-000001'));
    normalizeDeviceId('invalid-id');
  } catch (error) {
    console.log('   ', (error as Error).message);
  }
}

