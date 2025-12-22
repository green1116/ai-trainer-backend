import { db } from '@/lib/db';

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 获取 Clinic 的客户列表
 * GET /api/clinic/{id}/clients
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

    // 查询所有 role = 'client' 的用户
    const clients = await db.user.findMany({
      where: {
        clinicId: id,
        role: 'client',
      },
      select: {
        id: true,
        email: true,
        plan: true,
        role: true,
      },
    });

    return Response.json({
      clinicId: id,
      clinicName: clinic.name,
      clients,
      count: clients.length,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('获取客户列表错误:', error);
    return Response.json(
      {
        error: 'Failed to fetch clients',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

