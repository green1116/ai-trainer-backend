import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, generateToken } from "@/lib/auth"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    // 检查用户是否已存在
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "用户已存在" },
        { status: 409 }
      )
    }

    // 创建用户
    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    })

    // 创建默认偏好设置
    await db.userPreferences.create({
      data: {
        userId: user.id,
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
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

    console.error("注册错误:", error)
    return NextResponse.json(
      {
        error: "注册失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}

