import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractTokenFromHeader, getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const startSessionSchema = z.object({
  deviceId: z.string().optional(), // 不再限制为 UUID，因为 deviceId 格式是 VP-YYYY-NNNNNN
  // planId: z.string().uuid().optional(), // Session 模型中没有 planId 字段
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
    const { deviceId, startTime } = startSessionSchema.parse(body)
    // const { deviceId, planId, startTime } = startSessionSchema.parse(body) // planId 已移除

    // 验证设备是否存在
    // 注意：Device 模型中没有 userId 字段，设备通过 clinicId 关联到 Clinic
    // 如果需要验证设备是否属于用户，应该检查设备是否属于用户所在的 Clinic
    if (deviceId) {
      const device = await db.device.findFirst({
        where: {
          id: deviceId,
          // 如果用户有关联的 clinicId，可以验证设备是否属于该诊所
          ...(user.clinicId && {
            clinicId: user.clinicId,
          }),
        },
      })

      if (!device) {
        return NextResponse.json(
          { error: "设备不存在" + (user.clinicId ? "或不属于当前用户的诊所" : "") },
          { status: 404 }
        )
      }
    }

    // 注意：Session 模型中没有 planId 字段，已移除
    // 创建会话
    const session = await db.session.create({
      data: {
        userId: user.id, // ✅ Session 模型现在有 userId 字段（必填）
        deviceId: deviceId || 'unknown-device', // deviceId 是必填的
        startedAt: startTime ? new Date(startTime) : new Date(),
        // planId: planId || null, // ❌ Session 模型中没有 planId 字段
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

