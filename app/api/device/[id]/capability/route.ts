/**
 * GET /api/device/[id]/capability
 * 
 * 获取设备能力描述
 * 前端/AI 永远先读它
 * 这是未来扩展所有型号的关键
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DeviceService } from "@/src/devices/device.service";
import { DeviceCapabilityProfile } from "@/src/types/deviceCapability";
import { corsHeaders } from "@/lib/cors";

// 处理 CORS 预检请求
export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[Device Capability API] 收到请求，deviceId:', id);

    // 从数据库获取设备信息
    const device = await db.device.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        // 如果 Device 模型有 capability 字段，也可以从这里读取
        // capability: true,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found', message: `No device found with ID: ${id}` },
        { 
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // 获取设备能力描述
    // 从 profiles 目录读取配置文件
    // 前端/AI 永远先读它
    // 注意：协议细节只存在于后端，前端看不到
    const deviceModel = device.name || device.id;
    const capability = DeviceService.getDeviceCapability(deviceModel);

    // 返回设备能力描述
    // 前端/AI 永远先读它
    return NextResponse.json(
      {
        deviceId: id,
        deviceName: device.name,
        capability: capability as DeviceCapabilityProfile,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('[Device Capability API] 获取设备能力错误:', error);
    
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: '获取设备能力失败', 
        message: errorMessage,
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

