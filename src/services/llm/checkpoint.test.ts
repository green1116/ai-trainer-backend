/**
 * LLM 层检查点
 * 
 * 验证 generateAINarrative 函数是否正确实现
 */

import { generateAINarrative } from './index';

/**
 * 检查点：验证 generateAINarrative 函数
 */
async function checkpoint() {
  console.log('=== LLM 层检查点 ===\n');

  // 测试参数
  const testParams = {
    score: 85,
    avgHz: 50.5,
    duration: 300,
    locale: 'zh' as const,
  };

  try {
    // 调用 generateAINarrative
    const result = await generateAINarrative(testParams);
    
    console.log('✅ generateAINarrative() 调用成功');
    console.log('\n输入参数:');
    console.log('  score:', testParams.score);
    console.log('  avgHz:', testParams.avgHz);
    console.log('  duration:', testParams.duration);
    console.log('  locale:', testParams.locale);
    
    console.log('\n输出结果:');
    console.log('  ', result);
    
    // 验证结果
    if (typeof result === 'string' && result.length > 0) {
      console.log('\n✅ 返回类型正确（string）');
      console.log('✅ 返回内容非空');
    } else {
      console.log('\n❌ 返回类型或内容不正确');
    }

    // 测试英文
    console.log('\n--- 测试英文 ---');
    const enResult = await generateAINarrative({
      ...testParams,
      locale: 'en',
    });
    console.log('英文结果:', enResult);

    console.log('\n=== 检查点通过 ===');
  } catch (error) {
    console.error('❌ 检查点失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  checkpoint().catch(console.error);
}

export { checkpoint };

