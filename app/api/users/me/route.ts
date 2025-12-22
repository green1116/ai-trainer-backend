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

    // 获取用户偏好设置
    const preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      preferences: preferences
        ? {
            defaultFrequency: preferences.defaultFrequency,
            preferredTrainingTime: preferences.preferredTrainingTime,
            notificationsEnabled: preferences.notificationsEnabled,
            language: preferences.language,
          }
        : null,
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

