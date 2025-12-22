/**
 * GET /api/session/[id]/device-data
 * 
 * 获取指定会话的 DeviceData 数据
 * 返回格式：前端只关心的 { t, hz, amp?, mode? }
 * Chart 只做一件事：画数值，不理解业务
 */

import { db } from '@/lib/db';
import { corsHeaders } from '@/lib/cors';

// 处理 CORS 预检请求
export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[DeviceData API] 收到请求，sessionId:', id);
    
    // 验证 Session 是否存在
    const session = await db.session.findUnique({
      where: { id },
      select: {
        id: true,
        startedAt: true,
      },
    });

    if (!session) {
      console.log('[DeviceData API] Session 未找到:', id);
      return Response.json(
        { error: 'Session not found', message: `No session found with ID: ${id}` },
        { 
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // 从 DeviceData 表读取真实数据（原子数据）
    // 兼容旧 schema：如果 timestamp 字段不存在，使用 createdAt
    let deviceDataRecords;
    try {
      deviceDataRecords = await db.deviceData.findMany({
        where: { sessionId: id },
        orderBy: { timestamp: 'asc' }, // 优先使用 timestamp 排序
      });
    } catch (error) {
      // 如果 timestamp 字段不存在，使用 createdAt 排序
      console.log('[DeviceData API] timestamp 字段不存在，使用 createdAt 排序');
      deviceDataRecords = await db.deviceData.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'asc' },
      });
    }

    console.log(`[DeviceData API] 从 DeviceData 表读取到 ${deviceDataRecords.length} 条记录`);

    // 准备图表数据点（前端只关心: t, hz, amp?, mode?）
    // Chart 只做一件事：画数值，不理解业务
    const sessionStartTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    
    const deviceDataPoints = deviceDataRecords.map(record => {
      // 兼容旧数据：优先使用 timestamp，否则使用 createdAt
      const recordTimestamp = (record as any).timestamp ?? (record as any).createdAt;
      const recordTime = new Date(recordTimestamp).getTime();
      const timeOffset = (recordTime - sessionStartTime) / 1000; // 转换为秒（时间）
      
      const freq = (record as any).frequencyHz ?? (record as any).frequency ?? 0;
      const amp = (record as any).amplitude ?? null;
      const mode = (record as any).mode ?? null;
      
      // 前端只关心的数据结构：{ t, hz, amp?, mode? }
      return {
        t: timeOffset, // 时间（秒）
        hz: freq, // 频率
        ...(amp !== null && amp !== undefined && { amp }), // 振幅（可选）
        ...(mode && { mode }), // 模式（可选，动态）
      };
    });

    return Response.json(
      {
        sessionId: id,
        data: deviceDataPoints, // 曲线来源 → DeviceData
        count: deviceDataPoints.length,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('[DeviceData API] 获取 DeviceData 错误:', error);
    
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return Response.json(
      { 
        error: '获取 DeviceData 失败', 
        message: errorMessage,
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

