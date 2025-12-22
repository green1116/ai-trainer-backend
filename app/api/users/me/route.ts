import { NextRequest, NextResponse } from "next/server"
import { extractTokenFromHeader, getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/users/me
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

    // 注意：当前 User 模型不包含 name 和 createdAt 字段
    // userPreferences 模型也不存在
    return NextResponse.json({
      id: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
      clinicId: user.clinicId,
    })
  } catch (error) {
    console.error("获取用户信息错误:", error)
    return NextResponse.json(
      {
        error: "获取用户信息失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}

