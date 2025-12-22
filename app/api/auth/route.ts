import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateToken } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const registerSchema = z.object({
  email: z.string().email(),
  // password: z.string().min(6), // 暂时移除，需要更新 schema 支持密码
  // name: z.string().min(1), // 暂时移除，需要更新 schema 支持名称
})

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在或密码错误" },
        { status: 401 }
      )
    }

    // 注意：当前 User 模型不包含 passwordHash 字段
    // 如果需要密码认证，需要更新 Prisma schema 添加该字段
    // const isValid = await verifyPassword(password, user.passwordHash)
    // if (!isValid) {
    //   return NextResponse.json(
    //     { error: "用户不存在或密码错误" },
    //     { status: 401 }
    //   )
    // }
    
    // 临时：仅检查用户是否存在（不验证密码）
    // TODO: 添加 passwordHash 字段到 User 模型

    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "请求格式错误", details: error.errors },
        { status: 400 }
      )
    }

    console.error("登录错误:", error)
    return NextResponse.json(
      {
        error: "登录失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    )
  }
}

// POST /api/auth/register
export async function PUT(request: NextRequest) {
  // 注意：使用PUT方法注册，也可以创建单独的 /api/auth/register 路由使用POST
  try {
    const body = await request.json()
    const { email } = registerSchema.parse(body)
    // const { email, password, name } = registerSchema.parse(body) // 暂时移除

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
    // 注意：当前 User 模型不包含 passwordHash 和 name 字段
    const user = await db.user.create({
      data: {
        email,
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
          plan: user.plan,
          role: user.role,
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

