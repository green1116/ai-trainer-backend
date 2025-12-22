/**
 * GET /api/device/[id]/profile
 * 
 * B4. 正确调用方式 (示意)
 * 
 * 获取设备能力描述（Profile）
 * 前端永远先拉 profile，再渲染页面
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
    console.log('[Device Profile API] 收到请求，deviceId:', id);

    // 从数据库获取设备信息
    const device = await db.device.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
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

    // B4. 正确调用方式：获取设备能力描述（Profile）
    // 从 profiles 目录读取配置文件
    // 前端永远先读它
    const deviceModel = device.name || device.id;
    const profile = DeviceService.getDeviceCapability(deviceModel);

    // 返回设备能力描述（Profile）
    // 前端永远先拉 profile，再渲染页面
    return NextResponse.json(
      {
        deviceId: id,
        deviceName: device.name,
        profile: profile as DeviceCapabilityProfile,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('[Device Profile API] 获取设备能力错误:', error);
    
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

