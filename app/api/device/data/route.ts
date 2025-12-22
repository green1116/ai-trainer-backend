/**
 * POST /api/device/data - 接收设备蓝牙数据（频率）
 * 
 * 注意：这个端点用于实时上传单个频率点数据
 * 对于批量数据，建议使用 POST /api/session 上传完整的 Session
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { corsHeaders } from "@/lib/cors"
import { z } from "zod"

const deviceDataSchema = z.object({
  sessionId: z.string().uuid("Invalid sessionId format"),
  frequencyHz: z.number().min(0).max(1000, "Frequency must be between 0 and 1000 Hz"),
  timestamp: z.union([z.string(), z.number(), z.date()]).optional(), // ISO 字符串、毫秒时间戳或 Date
  amplitude: z.number().min(0).max(100).optional(), // 振幅（0-100）
  mode: z.string().optional(), // 模式（不硬编码，由设备决定）
  intensity: z.number().min(0).max(100).optional(), // 强度（0-100）
})

// 处理 CORS 预检请求
export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, frequencyHz, timestamp, amplitude, mode, intensity } = deviceDataSchema.parse(body)

    // 验证 Session 是否存在
    const session = await db.session.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: "Session not found", message: `No session found with ID: ${sessionId}` },
        { status: 404, headers: corsHeaders }
      )
    }

    // 解析时间戳
    let timestampDate: Date;
    if (timestamp) {
      if (typeof timestamp === 'string') {
        timestampDate = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        timestampDate = new Date(timestamp);
      } else {
        timestampDate = timestamp;
      }
    } else {
      timestampDate = new Date();
    }

    // 创建 DeviceData 记录（原子数据）
    const record = await db.deviceData.create({
      data: {
        sessionId,
        frequencyHz: Number(frequencyHz),
        timestamp: timestampDate,
        amplitude: amplitude !== undefined ? Number(amplitude) : null,
        mode: mode || null,
        intensity: intensity !== undefined ? Number(intensity) : null,
      },
      include: {
        session: {
          select: {
            id: true,
            deviceId: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        record: {
          id: record.id,
          sessionId: record.sessionId,
          frequencyHz: record.frequencyHz,
          timestamp: record.timestamp,
          amplitude: record.amplitude,
          mode: record.mode,
          intensity: record.intensity,
          createdAt: record.createdAt,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400, headers: corsHeaders }
      )
    }

    console.error("[Device Data API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to save device data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

