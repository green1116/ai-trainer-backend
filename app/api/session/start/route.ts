import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractTokenFromHeader, getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const startSessionSchema = z.object({
  deviceId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
})

// POST /api/session/start
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"))
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: "未授权，请先登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { deviceId, planId, startTime } = startSessionSchema.parse(body)

    // 验证设备是否属于用户
    if (deviceId) {
      const device = await db.device.findFirst({
        where: {
          id: deviceId,
          userId: user.id,
        },
      })

      if (!device) {
        return NextResponse.json(
          { error: "设备不存在或不属于当前用户" },
          { status: 404 }
        )
      }
    }

    // 验证计划是否属于用户（如果提供）
    if (planId) {
      const plan = await db.plan.findFirst({
        where: {
          id: planId,
          userId: user.id,
        },
      })

      if (!plan) {
        return NextResponse.json(
          { error: "训练计划不存在或不属于当前用户" },
          { status: 404 }
        )
      }
    }

    // 创建会话
    const session = await db.session.create({
      data: {
        userId: user.id,
        deviceId: deviceId || null,
        planId: planId || null,
        startedAt: startTime ? new Date(startTime) : new Date(),
      },
    })

    return NextResponse.json(
      {
        ok: true,
        sessionId: session.id,
        status: "started",
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

    console.error("开始会话错误:", error)
    return NextResponse.json(
      {
        error: "开始会话失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}

