import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractTokenFromHeader, getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const metricSchema = z.object({
  hz: z.number().min(0).max(100),
  timestamp: z.number().int().positive(),
})

// POST /api/session/{id}/metric - 上传会话指标数据
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"))
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { hz, timestamp } = metricSchema.parse(body)

    // 验证会话是否属于用户
    const session = await db.session.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: "会话不存在或不属于当前用户" },
        { status: 404 }
      )
    }

    // 检查会话是否已结束
    if (session.endedAt) {
      return NextResponse.json(
        { error: "会话已结束，无法添加指标数据" },
        { status: 400 }
      )
    }

    // 将时间戳转换为 Date 对象
    const eventTime = new Date(timestamp)

    // 创建指标事件
    const event = await db.postureEvent.create({
      data: {
        sessionId: id,
        eventTime: eventTime,
        type: "frequency_metric",
        detail: {
          hz: hz,
          timestamp: timestamp,
        },
      },
    })

    return NextResponse.json(
      {
        ok: true,
        eventId: event.id,
        hz: hz,
        timestamp: timestamp,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "请求格式错误", details: error.errors },
        { status: 400 }
      )
    }

    console.error("上传指标数据错误:", error)
    return NextResponse.json(
      {
        error: "上传指标数据失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}

