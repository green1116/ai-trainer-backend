import { db } from '@/lib/db';

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 获取 Clinic 详情
 * GET /api/clinic/{id}
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
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            plan: true,
            role: true,
          },
        },
        sessions: {
          select: {
            id: true,
            startedAt: true,
            endedAt: true,
            deviceId: true,
          },
          orderBy: {
            startedAt: 'desc',
          },
          take: 10, // 最近 10 个会话
        },
      },
    });

    if (!clinic) {
      return Response.json(
        { error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 分离 Coaches 和 Clients
    const coaches = clinic.users.filter(user => user.role === 'coach');
    const clients = clinic.users.filter(user => user.role === 'client');

    return Response.json({
      id: clinic.id,
      name: clinic.name,
      devices: clinic.devices,
      coaches,
      clients,
      sessions: clinic.sessions,
      stats: {
        deviceCount: clinic.devices.length,
        coachCount: coaches.length,
        clientCount: clients.length,
        sessionCount: clinic.sessions.length,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('获取 Clinic 详情错误:', error);
    return Response.json(
      {
        error: 'Failed to fetch clinic',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

