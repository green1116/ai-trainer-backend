/**
 * 创建测试数据脚本
 * 运行方式: npx tsx scripts/seed-test-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建测试数据...');

  // 创建测试用户
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
    },
  });
  console.log('✓ 用户已创建:', user.id);

  // 创建测试设备
  let device = await prisma.device.findFirst({
    where: { 
      userId: user.id,
      name: '测试设备'
    },
  });
  
  if (!device) {
    device = await prisma.device.create({
      data: {
        name: '测试设备',
        userId: user.id,
      },
    });
    console.log('✓ 设备已创建:', device.id);
  } else {
    console.log('✓ 设备已存在:', device.id);
  }

  // 创建测试会话
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      deviceId: device.id,
      avgHz: 45.5,
      startedAt: new Date(),
    },
  });
  console.log('✓ 会话已创建:', session.id);
  console.log('\n📄 测试 PDF URL:');
  console.log(`   http://localhost:6001/api/session/${session.id}/pdf`);
}

main()
  .catch((e) => {
    console.error('错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

