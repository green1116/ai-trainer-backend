import { db } from "@/lib/db"
import { SessionPayload } from "@/src/types/ble"
import { extractTokenFromHeader, getCurrentUser } from "@/lib/auth"

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// GET /api/session - 获取所有会话列表
export async function GET(req: Request) {
  try {
    // 解析查询参数
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // 最多 100 条
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    
    // 查询 sessions，处理可能的数据库错误
    let sessions, totalCount;
    try {
      // 先尝试简单的查询，不包含关联，避免关联查询导致的问题
      [sessions, totalCount] = await Promise.all([
        db.session.findMany({
          take: limit,
          skip: offset,
          orderBy: { startedAt: 'desc' },
          // 暂时移除 include，避免关联查询导致的问题
          // 如果需要设备信息，可以单独查询
        }),
        db.session.count(), // 获取总数
      ]);

      // 如果需要设备信息，可以单独查询（可选）
      // 这里先返回基本数据，避免复杂的关联查询导致错误
    } catch (dbError) {
      // 记录详细错误信息
      console.error('[Session API] 数据库查询错误:', dbError);
      const errorDetails = dbError instanceof Error ? {
        name: dbError.name,
        message: dbError.message,
        stack: dbError.stack,
      } : { error: String(dbError) };
      
      console.error('[Session API] 错误详情:', JSON.stringify(errorDetails, null, 2));

      // 检查是否是数据库连接问题
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      if (errorMessage.includes('Can\'t reach database') || 
          errorMessage.includes('P1001') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ENOTFOUND')) {
        return Response.json(
          { 
            error: '数据库连接失败', 
            message: '无法连接到数据库。请检查数据库配置或联系管理员。',
            sessions: [], // 返回空数组，避免前端崩溃
            pagination: {
              limit,
              offset,
              total: 0,
              hasMore: false,
            },
            // 在开发环境返回详细错误信息
            ...(process.env.NODE_ENV === 'development' && { details: errorDetails }),
          },
          { status: 503, headers: corsHeaders }
        );
      }

      // 其他数据库错误，返回 500 但包含错误信息
      return Response.json(
        { 
          error: '数据库查询失败', 
          message: errorMessage,
          sessions: [], // 返回空数组，避免前端崩溃
          pagination: {
            limit,
            offset,
            total: 0,
            hasMore: false,
          },
          // 在开发环境返回详细错误信息
          ...(process.env.NODE_ENV === 'development' && { details: errorDetails }),
        },
        { status: 500, headers: corsHeaders }
      );
    }

    return Response.json({ 
      sessions,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + sessions.length < totalCount,
      },
      message: sessions.length > 0 
        ? `找到 ${sessions.length} 个会话（共 ${totalCount} 个）。访问 PDF: /api/session/${sessions[0].id}/pdf`
        : '数据库中没有会话。请先创建一个会话。'
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('[Session API] 获取会话列表错误:', error);
    
    let errorMessage = '未知错误';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 检查是否是数据库连接错误
      if (errorMessage.includes('Can\'t reach database') || errorMessage.includes('P1001')) {
        errorMessage = '数据库连接失败，请检查数据库服务是否运行';
        statusCode = 503;
      }
    }
    
    return Response.json(
      { 
        error: '获取会话列表失败', 
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && error instanceof Error && { 
          details: { stack: error.stack } 
        }),
      },
      { status: statusCode, headers: corsHeaders }
    );
  }
}

// OPTIONS 处理 CORS 预检请求
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * POST /api/session - 上传 Session
 * 
 * Session 上传时的逻辑（必须）：
 * 1. 后端接收 SessionPayload
 * 2. 查 deviceId
 * 3. 绑定 clinicId（从 Device 获取）
 * 4. Session 自动归属场馆
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    // 尝试从认证信息获取用户
    const token = extractTokenFromHeader(req.headers.get("authorization"));
    const user = await getCurrentUser(token);
    
    // 解析请求体
    let payload: SessionPayload;
    try {
      payload = await req.json();
    } catch (parseError) {
      return Response.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // 验证必需字段
    if (!payload.deviceId || !payload.startedAt || !payload.endedAt) {
      return Response.json(
        { error: 'Missing required fields: deviceId, startedAt, endedAt' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 获取 userId（优先使用认证用户，否则使用 payload 中的 userId）
    const userId = user?.id || payload.userId;
    if (!userId) {
      return Response.json(
        { error: 'Missing userId: either authenticate or provide userId in payload' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 验证时间戳有效性
    if (payload.startedAt >= payload.endedAt) {
      return Response.json(
        { error: 'Invalid time range: startedAt must be before endedAt' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 验证 samples 数据格式（如果存在）
    if (payload.samples && !Array.isArray(payload.samples)) {
      return Response.json(
        { error: 'Invalid samples format: must be an array' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 验证 samples 数组中的每个元素
    if (payload.samples && payload.samples.length > 0) {
      // 限制 samples 数量，防止过大的请求
      const MAX_SAMPLES = 100000; // 最多 10 万条
      if (payload.samples.length > MAX_SAMPLES) {
        return Response.json(
          { error: `Too many samples: maximum ${MAX_SAMPLES} samples allowed, got ${payload.samples.length}` },
          { status: 400, headers: corsHeaders }
        );
      }

      const invalidSample = payload.samples.find(
        (sample) => 
          typeof sample.t !== 'number' || 
          typeof sample.hz !== 'number' || 
          isNaN(sample.t) ||
          isNaN(sample.hz) ||
          sample.hz < 0 || 
          sample.hz > 1000 // 合理的频率范围
      );
      if (invalidSample) {
        return Response.json(
          { error: 'Invalid sample data: each sample must have valid t (timestamp) and hz (0-1000)' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // 1. 查 deviceId
    const device = await db.device.findUnique({
      where: { id: payload.deviceId },
      include: {
        clinic: true,
      },
    });

    if (!device) {
      return Response.json(
        { error: `Device not found: ${payload.deviceId}` },
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. 绑定 clinicId（从 Device 获取）
    const clinicId = device.clinicId;

    if (!clinicId) {
      return Response.json(
        { error: `Device ${payload.deviceId} is not associated with any clinic` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 计算平均频率（如果有 samples）
    let avgHz: number | null = null;
    if (payload.samples && payload.samples.length > 0) {
      const sum = payload.samples.reduce((acc, sample) => acc + sample.hz, 0);
      avgHz = sum / payload.samples.length;
    }

    // 3. Session 自动归属场馆
    // Session 模型现在需要 userId 字段（必填）
    const session = await db.session.create({
      data: {
        userId: userId, // 从认证信息或 payload 获取
        deviceId: payload.deviceId,
        clinicId: clinicId, // 自动绑定 clinicId
        startedAt: new Date(payload.startedAt),
        endedAt: new Date(payload.endedAt),
        samples: payload.samples || null, // 直接存储 samples 数据（已经是 JSON 格式）
      },
      include: {
        device: true,
        clinic: true,
      },
    });

    // 4. 将频率点数据存储到 DeviceData 表
    let deviceDataCount = 0;
    if (payload.samples && payload.samples.length > 0) {
      try {
        // 过滤和清理数据，确保时间戳有效
        const validSamples = payload.samples
          .filter(sample => {
            const timestamp = new Date(sample.t);
            return !isNaN(timestamp.getTime()) && sample.hz >= 0 && sample.hz <= 1000;
          })
          .map(sample => ({
            sessionId: session.id,
            frequencyHz: sample.hz, // 使用新字段名
            timestamp: new Date(sample.t), // 使用采样点的时间戳作为 timestamp
            // amplitude, mode, intensity 可以从 samples 扩展字段获取（如果存在）
            // 目前保持为 null，等待设备端提供
          }));

        if (validSamples.length > 0) {
          // 如果数据量很大，分批插入（每批最多 1000 条）
          const batchSize = 1000;
          for (let i = 0; i < validSamples.length; i += batchSize) {
            const batch = validSamples.slice(i, i + batchSize);
            await db.deviceData.createMany({
              data: batch,
              skipDuplicates: true, // 跳过重复记录
            });
          }
          deviceDataCount = validSamples.length;
        }
      } catch (deviceDataError) {
        // DeviceData 存储失败不影响 Session 创建，只记录错误
        console.error('存储 DeviceData 失败:', deviceDataError);
        if (deviceDataError instanceof Error) {
          console.error('错误详情:', deviceDataError.message);
          console.error('堆栈:', deviceDataError.stack);
        }
        // 继续执行，不抛出错误
      }
    }

    const processingTime = Date.now() - startTime;
    
    // 记录成功日志
    console.log(`[Session API] Session created: ${session.id}, Device: ${payload.deviceId}, Samples: ${payload.samples?.length || 0}, DeviceData: ${deviceDataCount}, Time: ${processingTime}ms`);

    return Response.json({
      ok: true,
      session: {
        id: session.id,
        deviceId: session.deviceId,
        clinicId: session.clinicId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        samples: session.samples, // 返回 samples 数据
        clinic: session.clinic,
        device: session.device,
      },
      // 返回统计信息
      stats: {
        sampleCount: payload.samples?.length || 0,
        avgHz: avgHz,
        duration: payload.endedAt - payload.startedAt, // ms
        deviceDataCount: deviceDataCount, // 实际存储到 DeviceData 表的记录数
        processingTime: processingTime, // 处理时间（毫秒）
      },
    }, { headers: corsHeaders });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[Session API] Error after ${processingTime}ms:`, error);
    
    // 提供更详细的错误信息
    let errorMessage = '未知错误';
    let errorDetails: Record<string, unknown> = {};
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      };
    }
    
    // 检查是否是数据库连接错误
    if (errorMessage.includes('Can\'t reach database') || errorMessage.includes('P1001')) {
      errorMessage = '数据库连接失败，请检查数据库服务是否运行';
      statusCode = 503; // Service Unavailable
    }
    
    // 检查是否是 Prisma 验证错误
    if (errorMessage.includes('Invalid') || errorMessage.includes('prisma')) {
      errorMessage = '数据验证失败: ' + errorMessage;
      statusCode = 400; // Bad Request
    }
    
    // 检查是否是唯一约束错误
    if (errorMessage.includes('Unique constraint') || errorMessage.includes('P2002')) {
      errorMessage = '数据已存在，可能存在重复提交';
      statusCode = 409; // Conflict
    }
    
    return Response.json(
      { 
        error: '上传 Session 失败', 
        message: errorMessage,
        processingTime: processingTime,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails }),
      },
      { status: statusCode, headers: corsHeaders }
    );
  }
}
