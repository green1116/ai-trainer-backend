/**
 * Session Samples 数据格式验证脚本
 * 
 * 验证 Session 数据是否符合 BLE v0.9 数据契约：
 * - deviceId: string (格式: VP-YYYY-NNNNNN)
 * - samples: VibrationSample[] (格式: [{ t: number, hz: number }])
 * 
 * 使用方法:
 *   npx tsx scripts/verify-session-samples.ts [sessionId]
 */

import { PrismaClient } from '@prisma/client';
import { VibrationSample } from '../src/types/ble';

const prisma = new PrismaClient();

/**
 * 验证 VibrationSample 格式
 */
function validateVibrationSample(sample: any): sample is VibrationSample {
  return (
    typeof sample === 'object' &&
    sample !== null &&
    typeof sample.t === 'number' &&
    typeof sample.hz === 'number' &&
    sample.t > 0 && // timestamp 应该是正数
    sample.hz >= 0 && // frequency 应该 >= 0
    sample.hz <= 200 // 合理的频率范围（Hz）
  );
}

/**
 * 验证 Session 数据格式
 */
function validateSessionData(session: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. 检查 deviceId 格式
  if (!session.deviceId) {
    errors.push('❌ deviceId 缺失');
  } else {
    const deviceIdPattern = /^VP-\d{4}-\d{6}$/;
    if (!deviceIdPattern.test(session.deviceId)) {
      errors.push(`❌ deviceId 格式不正确: ${session.deviceId} (期望格式: VP-YYYY-NNNNNN)`);
    }
  }

  // 2. 检查 samples 数据
  if (!session.samples) {
    warnings.push('⚠️ samples 数据缺失（可能为旧数据）');
  } else {
    if (!Array.isArray(session.samples)) {
      errors.push('❌ samples 必须是数组');
    } else {
      if (session.samples.length === 0) {
        warnings.push('⚠️ samples 数组为空');
      } else {
        // 验证每个 sample
        let validCount = 0;
        let invalidCount = 0;
        
        session.samples.forEach((sample: any, index: number) => {
          if (validateVibrationSample(sample)) {
            validCount++;
          } else {
            invalidCount++;
            errors.push(`❌ samples[${index}] 格式不正确: ${JSON.stringify(sample)}`);
          }
        });

        if (validCount > 0) {
          console.log(`✅ 有效 samples: ${validCount}/${session.samples.length}`);
        }
        if (invalidCount > 0) {
          console.log(`❌ 无效 samples: ${invalidCount}/${session.samples.length}`);
        }

        // 检查时间戳是否递增
        const timestamps = session.samples
          .filter((s: any) => validateVibrationSample(s))
          .map((s: VibrationSample) => s.t);
        
        if (timestamps.length > 1) {
          let isIncreasing = true;
          for (let i = 1; i < timestamps.length; i++) {
            if (timestamps[i] <= timestamps[i - 1]) {
              isIncreasing = false;
              warnings.push(`⚠️ samples 时间戳不是严格递增的（位置 ${i}）`);
              break;
            }
          }
          if (isIncreasing) {
            console.log('✅ samples 时间戳递增顺序正确');
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 主函数
 */
async function main() {
  const sessionId = process.argv[2];

  try {
    let session;

    if (sessionId) {
      // 查询指定的 Session
      console.log(`\n🔍 查询 Session: ${sessionId}\n`);
      session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          device: true,
          clinic: true,
        },
      });

      if (!session) {
        console.error(`❌ Session 未找到: ${sessionId}`);
        process.exit(1);
      }
    } else {
      // 查询最新的 Session
      console.log('\n🔍 查询最新的 Session\n');
      session = await prisma.session.findFirst({
        orderBy: { startedAt: 'desc' },
        include: {
          device: true,
          clinic: true,
        },
      });

      if (!session) {
        console.error('❌ 数据库中没有 Session 数据');
        process.exit(1);
      }

      console.log(`📋 找到 Session ID: ${session.id}\n`);
    }

    // 显示 Session 基本信息
    console.log('=== Session 基本信息 ===');
    console.log(`ID: ${session.id}`);
    console.log(`Device ID: ${session.deviceId}`);
    console.log(`Clinic ID: ${session.clinicId || '(未关联)'}`);
    console.log(`Started At: ${session.startedAt}`);
    console.log(`Ended At: ${session.endedAt || '(进行中)'}`);
    console.log('');

    // 验证数据格式
    console.log('=== 数据格式验证 ===');
    const validation = validateSessionData(session);

    // 显示 samples 数据示例
    if (session.samples && Array.isArray(session.samples) && session.samples.length > 0) {
      console.log('\n=== Samples 数据示例 ===');
      const sampleCount = Math.min(3, session.samples.length);
      for (let i = 0; i < sampleCount; i++) {
        console.log(`Sample[${i}]:`, JSON.stringify(session.samples[i], null, 2));
      }
      if (session.samples.length > sampleCount) {
        console.log(`... (共 ${session.samples.length} 个 samples)`);
      }
      console.log('');
    }

    // 显示验证结果
    if (validation.errors.length > 0) {
      console.log('\n❌ 验证失败:');
      validation.errors.forEach(error => console.log(`  ${error}`));
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️ 警告:');
      validation.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    if (validation.isValid && validation.warnings.length === 0) {
      console.log('\n✅ 数据格式验证通过！');
      console.log('✅ BLE / App / 后端已成功解耦');
      console.log('\n数据结构符合 BLE v0.9 规范:');
      console.log(JSON.stringify({
        deviceId: session.deviceId,
        samples: session.samples ? (Array.isArray(session.samples) ? session.samples.slice(0, 2) : session.samples) : null,
      }, null, 2));
    } else if (validation.isValid) {
      console.log('\n✅ 数据格式基本正确（有警告）');
    } else {
      console.log('\n❌ 数据格式验证失败');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 验证过程出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

