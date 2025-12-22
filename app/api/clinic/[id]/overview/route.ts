import { db } from '@/lib/db';
import { analyzeSessionStability } from '@/lib/services/ai/sessionAnalysis';
import { VibrationSample } from '@/src/types/ble';

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Clinic Overview 数据
 * GET /api/clinic/{id}/overview
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clinic = await db.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      return Response.json(
        { error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 1. 设备数量
    const deviceCount = await db.device.count({
      where: { clinicId: id },
    });

    // 2. 今日 Session 数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessionCount = await db.session.count({
      where: {
        clinicId: id,
        startedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 3. 平均稳定性（从最近的 Session 计算）
    // FIXED: Removed samples: { not: null } - Json fields cannot use Prisma filters
    // Commit: dfde7d4
    const recentSessions = await db.session.findMany({
      where: {
        clinicId: id,
        endedAt: { not: null },
        // 注意：对于 Json 类型字段，不能直接使用 { not: null }
        // 需要在查询后过滤
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 100, // 最近 100 个 Session
    });

    let totalScore = 0;
    let scoredSessionCount = 0;
   
    // 过滤掉 samples 为 null 的 session
    const validSessions = recentSessions.filter(session => session.samples !== null);
    const sessionsWithSamples = recentSessions.filter(session => session.samples != null);

    for (const session of sessionsWithSamples) {
      const samples = session.samples as VibrationSample[] | null;
      if (samples && Array.isArray(samples) && samples.length > 0) {
        const frequencies = samples
          .filter(s => typeof s.hz === 'number')
          .map(s => s.hz);
        
        if (frequencies.length > 0) {
          const analysis = analyzeSessionStability(frequencies);
          totalScore += analysis.score;
          scoredSessionCount++;
        }
      }
    }

    const avgStability = scoredSessionCount > 0
      ? Math.round(totalScore / scoredSessionCount)
      : 0;

    // 4. 其他统计信息
    const totalSessionCount = await db.session.count({
      where: { clinicId: id },
    });

    const coachCount = await db.user.count({
      where: {
        clinicId: id,
        role: 'coach',
      },
    });

    const clientCount = await db.user.count({
      where: {
        clinicId: id,
        role: 'client',
      },
    });

    return Response.json({
      clinicId: id,
      clinicName: clinic.name,
      stats: {
        deviceCount,
        todaySessionCount,
        totalSessionCount,
        avgStability,
        coachCount,
        clientCount,
      },
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('获取 Clinic Overview 错误:', error);
    return Response.json(
      {
        error: 'Failed to fetch clinic overview',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

