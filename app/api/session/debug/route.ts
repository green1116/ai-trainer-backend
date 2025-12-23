import { db } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * GET /api/session/debug - 调试端点，用于诊断 Session API 问题
 */
export async function GET() {
  try {
    // 测试 1: 数据库连接
    let dbConnected = false;
    try {
      await db.$connect();
      dbConnected = true;
    } catch (error) {
      return NextResponse.json({
        test: "database_connection",
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }

    // 测试 2: 查询 Session 总数
    let sessionCount = 0;
    try {
      sessionCount = await db.session.count();
    } catch (error) {
      return NextResponse.json({
        test: "session_count",
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { status: 500 });
    }

    // 测试 3: 查询单个 Session（不使用关联）
    let firstSession = null;
    try {
      firstSession = await db.session.findFirst({
        select: {
          id: true,
          userId: true,
          deviceId: true,
          clinicId: true,
          startedAt: true,
          endedAt: true,
          // 暂时不包含 createdAt 和 updatedAt，因为数据库可能还没有这些字段
          // createdAt: true,
          // updatedAt: true,
        },
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      return NextResponse.json({
        test: "session_find_first",
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sessionCount,
      }, { status: 500 });
    }

    // 测试 4: 验证 User 是否存在
    let userExists = false;
    if (firstSession?.userId) {
      try {
        const user = await db.user.findUnique({
          where: { id: firstSession.userId },
          select: { id: true },
        });
        userExists = !!user;
      } catch (error) {
        // 用户查询失败，但不影响整体测试
        console.error("User lookup error:", error);
      }
    }

    // 测试 5: 验证 Device 是否存在
    let deviceExists = false;
    if (firstSession?.deviceId) {
      try {
        const device = await db.device.findUnique({
          where: { id: firstSession.deviceId },
          select: { id: true },
        });
        deviceExists = !!device;
      } catch (error) {
        // 设备查询失败，但不影响整体测试
        console.error("Device lookup error:", error);
      }
    }

    return NextResponse.json({
      test: "all_tests",
      status: "success",
      results: {
        databaseConnected: dbConnected,
        sessionCount,
        firstSession: firstSession ? {
          id: firstSession.id,
          userId: firstSession.userId,
          deviceId: firstSession.deviceId,
          clinicId: firstSession.clinicId,
          startedAt: firstSession.startedAt,
          endedAt: firstSession.endedAt,
        } : null,
        foreignKeyValidation: {
          userId: firstSession?.userId || null,
          userExists,
          deviceId: firstSession?.deviceId || null,
          deviceExists,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({
      test: "unexpected_error",
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}

