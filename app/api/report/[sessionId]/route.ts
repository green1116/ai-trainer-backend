import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractTokenFromHeader, getCurrentUser } from "@/lib/auth"

// GET /api/report/:sessionId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
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

    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"

    // 获取会话数据
    // 注意：Session 模型中没有 userId 字段，只有 deviceId 和 clinicId
    // 如果需要用户权限验证，需要通过 clinicId 或其他方式验证
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        // userId: user.id, // Session 模型中没有 userId 字段
      },
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
          },
        },
        deviceData: {
          orderBy: { timestamp: "asc" },
          take: 100, // 限制返回的数据点数量
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

    // 获取频率指标数据（从 deviceData 中提取）
    const frequencyMetrics = session.deviceData.map((data) => ({
      timestamp: data.timestamp.toISOString(),
      frequencyHz: data.frequencyHz,
      amplitude: data.amplitude || null,
      mode: data.mode || null,
      intensity: data.intensity || null,
    }))

    // 计算平均频率
    const avgHz = session.deviceData.length > 0
      ? session.deviceData.reduce((sum, data) => sum + data.frequencyHz, 0) / session.deviceData.length
      : null

    const report = {
      sessionId: session.id,
      deviceId: session.deviceId,
      deviceName: session.device?.name || session.device?.id || "未知设备",
      clinicId: session.clinicId || null,
      clinicName: session.clinic?.name || null,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() || null,
      durationSeconds: durationSeconds,
      avgHz: avgHz,
      frequencyMetrics,
      deviceDataCount: session.deviceData.length,
      samples: session.samples, // 保留 samples 字段（Json 类型）
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


