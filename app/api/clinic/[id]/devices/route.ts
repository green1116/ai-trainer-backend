import { db } from '@/lib/db';

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 获取 Clinic 的设备列表
 * GET /api/clinic/{id}/devices
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clinic = await db.clinic.findUnique({
      where: { id },
      include: {
        devices: {
          include: {
            sessions: {
              select: {
                id: true,
                startedAt: true,
                endedAt: true,
              },
              orderBy: {
                startedAt: 'desc',
              },
              take: 5, // 每个设备最近 5 个会话
            },
          },
        },
      },
    });

    if (!clinic) {
      return Response.json(
        { error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return Response.json({
      clinicId: id,
      clinicName: clinic.name,
      devices: clinic.devices.map(device => ({
        id: device.id,
        name: device.name,
        createdAt: device.createdAt,
        sessionCount: device.sessions.length,
        recentSessions: device.sessions,
      })),
      count: clinic.devices.length,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('获取设备列表错误:', error);
    return Response.json(
      {
        error: 'Failed to fetch devices',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

