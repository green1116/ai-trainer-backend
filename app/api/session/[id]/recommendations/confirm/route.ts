import { db } from '@/lib/db';

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 确认/应用 AI 推荐参数
 * 
 * POST /api/session/{id}/recommendations/confirm
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { targetHzRange, duration, deviceId, confirmedBy, notes } = body;

    // 验证必需字段
    if (!targetHzRange || !Array.isArray(targetHzRange) || targetHzRange.length !== 2) {
      return Response.json(
        { error: 'Invalid targetHzRange. Expected [minHz, maxHz]' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!duration || typeof duration !== 'number') {
      return Response.json(
        { error: 'Invalid duration. Expected number (seconds)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 查找 Session
    const session = await db.session.findUnique({
      where: { id },
      include: {
        clinic: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // TODO: 验证用户权限（Pro/Clinic）
    // 当前简化实现，未来需要：
    // 1. 从请求头获取用户信息
    // 2. 验证用户是否有权限确认推荐参数
    // 3. Clinic 用户可以确认，Pro 用户只能自己确认

    // 保存确认记录（未来可以存储到 Recommendation 表）
    // 当前简化实现，只返回成功

    // TODO: 发送控制指令到设备（阶段 7）
    // 当前只保存确认记录，未来需要：
    // 1. 将推荐参数转换为 AIControlCommand
    // 2. 通过 BLE 发送到设备
    // 3. 处理设备响应

    return Response.json(
      {
        ok: true,
        message: 'Recommendation confirmed',
        recommendation: {
          sessionId: id,
          targetHzRange,
          duration,
          deviceId,
          confirmedBy,
          confirmedAt: new Date().toISOString(),
          notes,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('确认推荐参数错误:', error);
    return Response.json(
      {
        error: 'Failed to confirm recommendation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

