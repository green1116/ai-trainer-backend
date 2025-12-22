import { db } from '@/lib/db';

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 获取 Clinic 的会话列表
 * GET /api/clinic/{id}/sessions
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const clinic = await db.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      return Response.json(
        { error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 查询所有关联到该 Clinic 的会话
    const [sessions, total] = await Promise.all([
      db.session.findMany({
        where: {
          clinicId: id,
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
          startedAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      db.session.count({
        where: {
          clinicId: id,
        },
      }),
    ]);

    return Response.json({
      clinicId: id,
      clinicName: clinic.name,
      sessions: sessions.map(session => ({
        id: session.id,
        deviceId: session.deviceId,
        device: session.device,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.endedAt && session.startedAt
          ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
          : null,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('获取会话列表错误:', error);
    return Response.json(
      {
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

