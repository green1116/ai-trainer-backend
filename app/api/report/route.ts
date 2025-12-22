import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractTokenFromHeader, getCurrentUser } from "@/lib/auth"

// GET /api/report?sessionId=...
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"))
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const format = searchParams.get("format") || "json"

    if (!sessionId) {
      return NextResponse.json(
        { error: "请提供 sessionId 查询参数" },
        { status: 400 }
      )
    }

    // 获取会话数据
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      include: {
        device: {
          select: {
            name: true,
            model: true,
          },
        },
        plan: {
          select: {
            name: true,
            category: true,
          },
        },
        events: {
          orderBy: { eventTime: "asc" },
        },
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: "会话不存在或不属于当前用户" },
        { status: 404 }
      )
    }

    // 计算持续时间（如果未结束，则计算到当前时间）
    const startTime = session.startedAt
    const endTime = session.endedAt || new Date()
    const durationSeconds = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000
    )

    // 获取肌群激活数据（从姿势分析中提取）
    const muscleGroups = session.analyses[0]?.errors
      ? JSON.parse(JSON.stringify(session.analyses[0].errors))
      : []

    // 获取频率指标数据（从事件中提取）
    const frequencyMetrics = session.events
      .filter((event) => event.type === "frequency_metric")
      .map((event) => ({
        time: event.eventTime.toISOString(),
        hz: (event.detail as any)?.hz || null,
        timestamp: (event.detail as any)?.timestamp || null,
      }))

    const report = {
      sessionId: session.id,
      userId: session.userId,
      deviceId: session.deviceId,
      deviceName: session.device?.name || "未知设备",
      planId: session.planId,
      planName: session.plan?.name,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() || null,
      durationSeconds: durationSeconds,
      avgHz: session.avgHz,
      score: session.score,
      muscleGroups,
      frequencyMetrics,
      events: session.events.map((event) => ({
        time: event.eventTime.toISOString(),
        type: event.type,
        detail: event.detail,
      })),
    }

    if (format === "pdf") {
      // TODO: 生成PDF报告
      // const pdfBuffer = await generatePDFReport(report)
      // return new NextResponse(pdfBuffer, {
      //   headers: {
      //     "Content-Type": "application/pdf",
      //     "Content-Disposition": `attachment; filename="report-${sessionId}.pdf"`,
      //   },
      // })
      return NextResponse.json(
        { error: "PDF生成功能即将推出" },
        { status: 501 }
      )
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("获取报告错误:", error)
    return NextResponse.json(
      {
        error: "获取报告失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}

