/**
 * POST /api/device/command
 * 
 * 设备控制 API
 * 使用统一指令模型，通过 Device Adapter 转换为厂商协议
 */

import { NextRequest, NextResponse } from "next/server";
import { DeviceCommand } from "@/src/devices/types";
import { DeviceService } from "@/src/devices/device.service";
import { db } from "@/lib/db";
import { corsHeaders } from "@/lib/cors";
import { z } from "zod";

// 验证统一指令模型
const deviceCommandSchema = z.object({
  deviceId: z.string(),
  command: z.object({
    action: z.enum(["start", "stop", "set"]),
    params: z.object({
      frequencyHz: z.number().min(0).max(1000).optional(),  // 使用 frequencyHz
      mode: z.string().optional(),
      intensity: z.number().min(0).max(100).optional(),
      durationSec: z.number().min(0).optional(),            // 添加 durationSec
    }).optional(),  // params 是可选的
  }),
});

// 处理 CORS 预检请求
export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, command } = deviceCommandSchema.parse(body);

    // 验证设备是否存在
    const device = await db.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found", message: `No device found with ID: ${deviceId}` },
        { status: 404, headers: corsHeaders }
      );
    }

    // 正确的三层抽象流程：
    // 1. 前端/AI 先读取设备能力（应该在发送指令前完成）
    // 2. 使用 Device Adapter 发送指令（只存在于后端）
    // 3. Device Runtime 运行时映射：将统一指令转换为 BLE/串口指令
    // 前端、PDF、AI 永远看不到协议细节
    
    // B5. 后端校验参数是否超出 profile
    // 获取设备能力描述并验证参数
    const deviceModel = device.name || device.id;
    const deviceProfile = DeviceService.getDeviceCapability(deviceModel);
    
    // 验证频率是否在设备支持范围内
    if (command.params?.frequencyHz !== undefined) {
      const freq = command.params.frequencyHz;
      if (freq < deviceProfile.frequencyHz.min || freq > deviceProfile.frequencyHz.max) {
        return NextResponse.json(
          {
            error: "Invalid frequency",
            message: `Frequency ${freq} Hz is out of range [${deviceProfile.frequencyHz.min}, ${deviceProfile.frequencyHz.max}] Hz`,
            deviceCapability: {
              frequencyRange: [deviceProfile.frequencyHz.min, deviceProfile.frequencyHz.max],
            },
          },
          { status: 400, headers: corsHeaders }
        );
      }
    }
    
    // 验证模式是否支持
    if (command.params?.mode !== undefined) {
      const modeKeys = deviceProfile.modes.map(m => m.key);
      if (!modeKeys.includes(command.params.mode)) {
        return NextResponse.json(
          {
            error: "Invalid mode",
            message: `Mode "${command.params.mode}" is not supported. Available modes: ${modeKeys.join(', ')}`,
            deviceCapability: {
              supportedModes: modeKeys,
            },
          },
          { status: 400, headers: corsHeaders }
        );
      }
    }
    
    // 验证强度是否在范围内
    if (command.params?.intensity !== undefined) {
      const intensity = command.params.intensity;
      if (intensity < 0 || intensity > deviceProfile.intensityLevels) {
        return NextResponse.json(
          {
            error: "Invalid intensity",
            message: `Intensity ${intensity} is out of range [0, ${deviceProfile.intensityLevels}]`,
            deviceCapability: {
              intensityLevels: deviceProfile.intensityLevels,
            },
          },
          { status: 400, headers: corsHeaders }
        );
      }
    }
    
    // 使用 DeviceService 获取适配器
    // Device Adapter 只存在于后端
    const adapter = DeviceService.getAdapter(deviceModel);
    const response = await adapter.sendCommand(command as DeviceCommand);

    if (!response.success) {
      return NextResponse.json(
        { error: "Failed to send command", message: response.error },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        deviceId,
        command,
        response: response.message,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("[Device Command API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send device command",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

