import { db } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * 健康检查端点
 * 用于测试数据库连接和基本功能
 */
export async function GET() {
  try {
    // 测试数据库连接
    await db.$connect()
    
    // 执行一个简单的查询
    const userCount = await db.user.count()
    const sessionCount = await db.session.count()
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      counts: {
        users: userCount,
        sessions: sessionCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    } : { error: String(error) }

    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails }),
      },
      { status: 503 }
    )
  } finally {
    // 断开连接（在 Vercel 等 serverless 环境中，连接会被自动管理）
    await db.$disconnect().catch(() => {
      // 忽略断开连接错误
    })
  }
}

