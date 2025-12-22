import { db } from '@/lib/db';
import { analyzeSessionStability } from '@/lib/services/ai/sessionAnalysis';
import { generateAINarrative } from '@/src/services/llm';
import { generateAIRecommendation } from '@/src/services/ai/recommendation';
import { VibrationSample } from '@/src/types/ble';
import { corsHeaders } from '@/lib/cors';
import { DeviceService } from '@/src/devices/device.service';

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
    console.log('[Session API] 收到请求，sessionId:', id);
    
    // 从 URL 参数获取语言设置
    const url = new URL(req.url);
    const locale = (url.searchParams.get('lang') || url.searchParams.get('locale') || 'zh') as 'zh' | 'en';
    
    const session = await db.session.findUnique({
      where: { id },
      include: {
        device: {
          select: {
            id: true,
            name: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            users: {
              select: {
                id: true,
                plan: true,
              },
              take: 1, // 只取第一个用户作为示例（实际应该根据当前登录用户）
            },
          },
        },
      },
    });

    if (!session) {
      console.log('[Session API] Session 未找到:', id);
      return Response.json(
        { error: 'Session not found', message: `No session found with ID: ${id}` },
        { 
          status: 404,
          headers: corsHeaders,
        }
      );
    }
    
    console.log('[Session API] 找到 Session:', session.id);

    // 计算训练时长（秒）
    const duration = session.startedAt && session.endedAt
      ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
      : session.startedAt
      ? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000)
      : 0;

    // 优先从 DeviceData 表读取真实数据（原子数据）
    // 兼容旧 schema：如果 timestamp 字段不存在，使用 createdAt
    let deviceDataRecords;
    try {
      deviceDataRecords = await db.deviceData.findMany({
        where: { sessionId: id },
        orderBy: { timestamp: 'asc' }, // 优先使用 timestamp 排序
      });
    } catch (error) {
      // 如果 timestamp 字段不存在，使用 createdAt 排序
      console.log('[Session API] timestamp 字段不存在，使用 createdAt 排序');
      deviceDataRecords = await db.deviceData.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'asc' },
      });
    }

    let avgHz = 0;
    let frequencySamples: number[] = [];
    let deviceDataPoints: Array<{ 
      time: number; 
      hz: number; 
      timestamp: string;
      amplitude?: number | null;
      mode?: string | null;
      intensity?: number | null;
    }> = [];

    if (deviceDataRecords && deviceDataRecords.length > 0) {
      // 从 DeviceData 表读取真实数据
      console.log(`[Session API] 从 DeviceData 表读取到 ${deviceDataRecords.length} 条原子数据记录`);
      
      // 计算平均频率（使用新字段名 frequencyHz，兼容旧数据）
      const sum = deviceDataRecords.reduce((acc, record) => {
        // 兼容旧数据：如果 frequencyHz 不存在，使用 frequency（如果存在）
        const freq = (record as any).frequencyHz ?? (record as any).frequency ?? 0;
        return acc + freq;
      }, 0);
      avgHz = sum / deviceDataRecords.length;
      
      // 提取频率数组用于 AI 分析
      frequencySamples = deviceDataRecords.map(record => {
        return (record as any).frequencyHz ?? (record as any).frequency ?? 0;
      });
      
      // 准备图表数据点（前端只关心: t, hz, amp?, mode?）
      // Chart 只做一件事：画数值，不理解业务
      const sessionStartTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
      deviceDataPoints = deviceDataRecords.map(record => {
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
          amp: amp !== null && amp !== undefined ? amp : undefined, // 振幅（可选）
          mode: mode || undefined, // 模式（可选）
        };
      });
    } else {
      // 如果没有 DeviceData，回退到 samples 数据
      console.log('[Session API] DeviceData 表无数据，使用 samples 数据');
      const samples = session.samples as VibrationSample[] | null;
      
      if (samples && Array.isArray(samples) && samples.length > 0) {
        // 验证 samples 格式：每个元素应该有 t 和 hz 字段
        const validSamples = samples.filter((s: any) => 
          typeof s === 'object' && 
          s !== null && 
          typeof s.t === 'number' && 
          typeof s.hz === 'number'
        );
        
        if (validSamples.length > 0) {
          // 计算平均频率
          const sum = validSamples.reduce((acc, sample) => acc + sample.hz, 0);
          avgHz = sum / validSamples.length;
          
          // 提取频率数组用于 AI 分析
          frequencySamples = validSamples.map(sample => sample.hz);
          
          // 准备图表数据点（前端只关心: t, hz, amp?, mode?）
          // Chart 只做一件事：画数值，不理解业务
          const sessionStartTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
          deviceDataPoints = validSamples.map(sample => {
            const timeOffset = (sample.t - sessionStartTime) / 1000; // 转换为秒（时间）
            // 前端只关心的数据结构：{ t, hz, amp?, mode? }
            return {
              t: timeOffset, // 时间（秒）
              hz: sample.hz, // 频率
              // amp 和 mode 在 samples 中可能不存在，保持 undefined
            };
          });
        }
      }
    }
    
    // 如果仍然没有数据，使用默认值
    if (frequencySamples.length === 0) {
      console.log('[Session API] 无任何数据，使用默认值');
      frequencySamples = Array.from({ length: 30 }, () => 0);
    }

    // AI 分析：计算稳定性评分
    const aiAnalysis = analyzeSessionStability(frequencySamples);

    // AI Narrative：根据 Clinic 判断权限（关键逻辑）
    // 注意：如果 Session 关联到 Clinic，则生成 AI Narrative
    // 未来可以根据 Clinic 的订阅计划来决定是否生成
    let aiNarrative: string | null = null;
    
    // 如果 Session 关联到 Clinic，生成 AI Narrative
    // 未来可以根据 Clinic 的订阅计划（pro/clinic）来决定
    if (session.clinic) {
      aiNarrative = await generateAINarrative({
        score: aiAnalysis.score,
        avgHz,
        duration,
        locale,
      });
    }

    // B3. Profile 在系统中的作用：AI 只在允许范围内推荐
    // 获取设备能力描述
    let deviceProfile = undefined;
    if (session.device) {
      try {
        const deviceModel = session.device.name || session.device.id;
        deviceProfile = DeviceService.getDeviceCapability(deviceModel);
      } catch (error) {
        console.log('[Session API] 无法获取设备能力描述:', error);
      }
    }

    // 生成 AI 推荐参数（传入 deviceProfile 以限制推荐范围）
    const recommendation = generateAIRecommendation(
      {
        score: aiAnalysis.score,
        stabilityLevel: aiAnalysis.stabilityLevel,
        metrics: {
          average: avgHz,
          variance: aiAnalysis.metrics.variance || 0,
          stdDev: aiAnalysis.metrics.stdDev || 0,
          min: aiAnalysis.metrics.min || 0,
          max: aiAnalysis.metrics.max || 0,
        },
      },
      deviceProfile,  // 传入设备 Profile
      locale
    );

    // 确定用户计划（用于前端显示权限控制）
    // 如果 Session 关联到 Clinic，使用 Clinic 用户的 plan
    // 否则默认为 'free'
    let userPlan: 'free' | 'pro' | 'clinic' = 'free';
    if (session.clinic && session.clinic.users && session.clinic.users.length > 0) {
      const userPlanFromDb = session.clinic.users[0].plan;
      if (userPlanFromDb === 'pro' || userPlanFromDb === 'clinic') {
        userPlan = userPlanFromDb;
      }
    }

    const responseData = {
      id: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration,
      avgHz,
      score: aiAnalysis.score,
      deviceId: session.deviceId,
      clinicId: session.clinicId,
      samples: session.samples, // 返回 samples 数据（BLE v0.9 格式）
      device: session.device,
      clinic: session.clinic,
      pdfUrl: `/api/session/${session.id}/pdf`,
      // DeviceData 图表数据点（从 DeviceData 表或 samples 读取）
      deviceData: deviceDataPoints,
      // AI 分析结果
      ai: {
        score: aiAnalysis.score,
        stabilityLevel: aiAnalysis.stabilityLevel,
        metrics: aiAnalysis.metrics,
      },
      // AI Narrative 文本（如果 Session 关联到 Clinic）
      aiNarrative,
      // AI 推荐参数
      recommendation,
      // 用户计划（用于前端权限控制）
      userPlan,
    };
    
    console.log('[Session API] 返回数据，包含 recommendation:', !!recommendation);
    
    return Response.json(responseData, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('[Session API] 获取会话详情错误:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '未知错误';
    let errorStack = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || '';
      console.error('[Session API] 错误堆栈:', errorStack);
    }
    
    return Response.json(
      { 
        error: '获取会话详情失败', 
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

