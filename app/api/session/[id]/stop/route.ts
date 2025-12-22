import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractTokenFromHeader, getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const stopSessionSchema = z.object({
  endTime: z.string().datetime(),
  avgFrequency: z.number().int().min(0).max(100),
  postureScore: z.number().int().min(0).max(100),
  events: z
    .array(
      z.object({
        time: z.string().datetime(),
        type: z.string(),
        detail: z.string(),
      })
    )
    .optional(),
})

// PATCH /api/session/:id/stop
export async function PATCH(
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
    const { endTime, avgFrequency, postureScore, events } =
      stopSessionSchema.parse(body)

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

    if (session.endedAt) {
      return NextResponse.json(
        { error: "会话已结束" },
        { status: 400 }
      )
    }

    // 更新会话
    const endTimeDate = new Date(endTime)
    const updatedSession = await db.session.update({
      where: { id },
      data: {
        endedAt: endTimeDate,
        avgHz: avgFrequency,
        score: postureScore,
      },
    })

    // 保存事件
    if (events && events.length > 0) {
      await db.postureEvent.createMany({
        data: events.map((event) => ({
          sessionId: id,
          eventTime: new Date(event.time),
          type: event.type,
          detail: {
            detail: event.detail,
          },
        })),
      })
    }

    // TODO: 生成PDF报告
    // const reportUrl = await generatePDFReport(id)

    return NextResponse.json({
      ok: true,
      sessionId: id,
      reportUrl: `/api/report/${id}.pdf`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "请求格式错误", details: error.errors },
        { status: 400 }
      )
    }

    console.error("停止会话错误:", error)
    return NextResponse.json(
      {
        error: "停止会话失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}

