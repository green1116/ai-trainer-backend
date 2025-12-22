import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { corsHeaders } from "@/lib/cors"
import { z } from "zod"

const registerDeviceSchema = z.object({
  deviceId: z.string().min(1), // 格式: VP-YYYY-NNNNNN
  name: z.string().optional(),
  clinicId: z.string().optional(), // 可选：如果提供，将设备绑定到指定 Clinic
})

// 处理 CORS 预检请求
export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

// GET /api/device - 获取设备列表
// 支持查询参数: ?clinicId=xxx 来获取特定 Clinic 的设备
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    const devices = await db.device.findMany({
      where: clinicId ? { clinicId } : undefined,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ devices }, { headers: corsHeaders })
  } catch (error) {
    console.error("获取设备列表错误:", error)
    return NextResponse.json(
      {
        error: "获取设备列表失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/device - 注册/创建设备
// 设备现在属于 Clinic，而不是 User
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, name, clinicId } = registerDeviceSchema.parse(body)

    // 验证 deviceId 格式 (VP-YYYY-NNNNNN)
    const deviceIdPattern = /^VP-\d{4}-\d{6}$/;
    if (!deviceIdPattern.test(deviceId)) {
      return NextResponse.json(
        { error: "设备ID格式错误", message: "设备ID格式应为: VP-YYYY-NNNNNN" },
        { status: 400, headers: corsHeaders }
      )
    }

    // 检查设备是否已存在
    const existingDevice = await db.device.findUnique({
      where: { id: deviceId },
    })

    if (existingDevice) {
      // 如果设备已存在，更新信息（如果需要）
      if (name && name !== existingDevice.name) {
        const updated = await db.device.update({
          where: { id: deviceId },
          data: { name },
          include: { clinic: true },
        })
        return NextResponse.json(updated, { headers: corsHeaders })
      }
      return NextResponse.json(existingDevice, { headers: corsHeaders })
    }

    // 如果提供了 clinicId，验证 Clinic 是否存在
    if (clinicId) {
      const clinic = await db.clinic.findUnique({
        where: { id: clinicId },
      })
      if (!clinic) {
        return NextResponse.json(
          { error: "Clinic 不存在", message: `找不到 ID 为 ${clinicId} 的 Clinic` },
          { status: 404, headers: corsHeaders }
        )
      }
    }

    // 创建设备
    const device = await db.device.create({
      data: {
        id: deviceId, // deviceId 就是主键
        name: name || deviceId,
        clinicId: clinicId || null,
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(device, { status: 201, headers: corsHeaders })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "请求格式错误", details: error.errors },
        { status: 400, headers: corsHeaders }
      )
    }

    console.error("注册设备错误:", error)
    return NextResponse.json(
      {
        error: "注册设备失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

