import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDeviceData() {
  try {
    console.log('=== Verifying DeviceData Table ===\n');
    
    // Check if table exists by counting records
    const count = await prisma.deviceData.count();
    console.log('[OK] DeviceData table exists');
    console.log(`[INFO] Current record count: ${count}\n`);
    
    if (count > 0) {
      // Get a sample record
      const sample = await prisma.deviceData.findFirst({
        include: {
          session: {
            select: {
              id: true,
              deviceId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      if (sample) {
        console.log('[INFO] Sample data:');
        console.log(`  - ID: ${sample.id}`);
        console.log(`  - Frequency: ${sample.frequency} Hz`);
        console.log(`  - Session ID: ${sample.sessionId}`);
        console.log(`  - Created At: ${sample.createdAt.toISOString()}`);
        if (sample.session) {
          console.log(`  - Device ID: ${sample.session.deviceId || 'N/A'}`);
        }
      }
    } else {
      console.log('[INFO] Table is empty, no data yet');
      console.log('[TIP] Run test-session-upload.ps1 to add test data');
    }
    
    // Check table structure by trying to query with specific fields
    const structure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'DeviceData'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n[INFO] Table structure:');
    console.log(JSON.stringify(structure, null, 2));
    
  } catch (error: any) {
    console.error('[ERROR]', error.message);
    if (error.code === 'P2021') {
      console.error('[ERROR] Table does not exist. Run: npx prisma db push');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDeviceData();

