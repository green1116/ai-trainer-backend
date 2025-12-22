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
 * Clinic 报告数据
 * GET /api/clinic/{id}/reports?period=week|month
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const period = (url.searchParams.get('period') || 'week') as 'week' | 'month';

    const clinic = await db.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      return Response.json(
        { error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 计算时间范围
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    startDate.setHours(0, 0, 0, 0);

    // 查询当前期间的 Session
    const sessions = await db.session.findMany({
      where: {
        clinicId: id,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
        endedAt: { not: null },
        samples: { not: null },
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    // 计算统计数据
    let totalStability = 0;
    let scoredSessionCount = 0;

    for (const session of sessions) {
      const samples = session.samples as VibrationSample[] | null;
      if (samples && Array.isArray(samples) && samples.length > 0) {
        const frequencies = samples
          .filter(s => typeof s.hz === 'number')
          .map(s => s.hz);
        
        if (frequencies.length > 0) {
          const analysis = analyzeSessionStability(frequencies);
          totalStability += analysis.score;
          scoredSessionCount++;
        }
      }
    }

    const avgStability = scoredSessionCount > 0
      ? Math.round(totalStability / scoredSessionCount)
      : 0;

    // 按日期分组数据
    const dailyDataMap = new Map<string, { sessions: number; totalStability: number; count: number }>();
    
    sessions.forEach(session => {
      const date = new Date(session.startedAt).toISOString().split('T')[0];
      const existing = dailyDataMap.get(date) || { sessions: 0, totalStability: 0, count: 0 };
      
      existing.sessions++;
      
      const samples = session.samples as VibrationSample[] | null;
      if (samples && Array.isArray(samples) && samples.length > 0) {
        const frequencies = samples
          .filter(s => typeof s.hz === 'number')
          .map(s => s.hz);
        
        if (frequencies.length > 0) {
          const analysis = analyzeSessionStability(frequencies);
          existing.totalStability += analysis.score;
          existing.count++;
        }
      }
      
      dailyDataMap.set(date, existing);
    });

    const dailyData = Array.from(dailyDataMap.entries())
      .map(([date, data]) => ({
        date,
        sessions: data.sessions,
        avgStability: data.count > 0 ? Math.round(data.totalStability / data.count) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 计算对比数据（上期）
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    previousEndDate.setMilliseconds(previousEndDate.getMilliseconds() - 1);
    
    if (period === 'week') {
      previousStartDate.setDate(previousStartDate.getDate() - 7);
    } else {
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    }

    const previousSessions = await db.session.count({
      where: {
        clinicId: id,
        startedAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    });

    // 计算上期平均稳定性（简化实现）
    const previousSessionsWithData = await db.session.findMany({
      where: {
        clinicId: id,
        startedAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        endedAt: { not: null },
        samples: { not: null },
      },
      take: 100,
    });

    let previousTotalStability = 0;
    let previousScoredCount = 0;

    for (const session of previousSessionsWithData) {
      const samples = session.samples as VibrationSample[] | null;
      if (samples && Array.isArray(samples) && samples.length > 0) {
        const frequencies = samples
          .filter(s => typeof s.hz === 'number')
          .map(s => s.hz);
        
        if (frequencies.length > 0) {
          const analysis = analyzeSessionStability(frequencies);
          previousTotalStability += analysis.score;
          previousScoredCount++;
        }
      }
    }

    const previousAvgStability = previousScoredCount > 0
      ? Math.round(previousTotalStability / previousScoredCount)
      : 0;

    // 计算变化百分比
    const sessionsChange = previousSessions > 0
      ? ((sessions.length - previousSessions) / previousSessions) * 100
      : sessions.length > 0 ? 100 : 0;

    const stabilityChange = previousAvgStability > 0
      ? ((avgStability - previousAvgStability) / previousAvgStability) * 100
      : avgStability > 0 ? 100 : 0;

    // 获取其他统计
    const totalClients = await db.user.count({
      where: {
        clinicId: id,
        role: 'client',
      },
    });

    const totalDevices = await db.device.count({
      where: { clinicId: id },
    });

    return Response.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      stats: {
        totalSessions: sessions.length,
        avgStability,
        totalClients,
        totalDevices,
      },
      dailyData,
      comparison: {
        previousPeriod: {
          totalSessions: previousSessions,
          avgStability: previousAvgStability,
        },
        change: {
          sessions: sessionsChange,
          stability: stabilityChange,
        },
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('获取报告错误:', error);
    return Response.json(
      {
        error: 'Failed to fetch report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

