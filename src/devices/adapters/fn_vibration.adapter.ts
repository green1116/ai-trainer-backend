/**
 * FN Vibration Device Adapter
 * 
 * FN-VIB-2025 设备专用适配器
 * 只存在于后端 - 前端、PDF、AI 永远看不到协议细节
 * 
 * A4. 工厂协议 → Adapter 示例
 * 你以后只改这里。
 */

import { DeviceCommand, DeviceCommandResponse } from '../types';
import { DeviceCapabilityProfile } from '@/src/types/deviceCapability';
import { mapToProtocol, ProtocolCommand, decodeProtocolResponse } from '@/src/services/deviceRuntime';
import type { VendorProtocol } from './adapter.types';
import { GenericAdapter } from './generic.adapter';
import { FunosCommands } from './funos/commands';

/**
 * 将 DeviceMode 转换为 Funos 协议模式值
 */
function modeToProtocolValue(mode: string): number {
  const modeMap: Record<string, number> = {
    'rehab': 0x01,
    'strength': 0x02,
    'relax': 0x03,
    'custom': 0x04,
  };
  return modeMap[mode] || 0x01;
}

/**
 * 将统一指令模型转换为 FN Vibration 设备的 BLE 协议
 * 
 * A-6: 使用 FunosCommands 生成协议命令
 * 
 * @param cmd 统一指令模型
 * @returns FN Vibration 设备的 BLE 协议命令
 */
export function mapToFnProtocol(cmd: DeviceCommand) {
  const address = 0x01; // TODO: 从设备配置或参数中获取地址

  if (cmd.action === "start") {
    const bytes = FunosCommands.start(address);
    return {
      bleCommand: Array.from(bytes)
    };
  }
  
  if (cmd.action === "stop") {
    const bytes = FunosCommands.stop(address);
    return {
      bleCommand: Array.from(bytes)
    };
  }
  
  if (cmd.action === "set") {
    // 根据参数类型选择对应的命令
    if (cmd.params?.frequencyHz !== undefined) {
      const bytes = FunosCommands.setFrequency(cmd.params.frequencyHz, address);
      return {
        bleCommand: Array.from(bytes)
      };
    }
    
    if (cmd.params?.intensity !== undefined) {
      const bytes = FunosCommands.setAmplitude(cmd.params.intensity, address);
      return {
        bleCommand: Array.from(bytes)
      };
    }
    
    if (cmd.params?.mode !== undefined) {
      const modeValue = modeToProtocolValue(cmd.params.mode);
      const bytes = FunosCommands.setMode(modeValue, address);
      return {
        bleCommand: Array.from(bytes)
      };
    }
  }
  
  // 默认返回空命令
  return {
    bleCommand: [0x00]
  };
}

/**
 * FN Vibration 设备适配器
 * 继承自 GenericAdapter，可以覆盖特定方法
 */
export class FNVibrationAdapter extends GenericAdapter {
  constructor(deviceProfile?: DeviceCapabilityProfile) {
    super('FN-VIB-2025', deviceProfile);
  }

  /**
   * 覆盖厂商协议转换方法
   * 使用 mapToFnProtocol 将统一指令模型转换为 FN Vibration 协议
   */
  toVendorProtocol(command: DeviceCommand): VendorProtocol {
    // 使用 mapToFnProtocol 函数转换
    const fnProtocol = mapToFnProtocol(command);
    return fnProtocol;
  }

  /**
   * 覆盖发送方法（如果需要特殊处理）
   */
  async sendCommand(command: DeviceCommand): Promise<DeviceCommandResponse> {
    try {
      // 使用 mapToFnProtocol 转换为 FN Vibration 协议
      const fnProtocol = mapToFnProtocol(command);
      
      // 也可以使用 Device Runtime 进行运行时映射
      const protocolCommand = mapToProtocol(command, this.deviceProfile);
      
      // A-5: 终端会看到输出
      // 将 bleCommand 转换为 ble 格式以匹配预期输出
      const bleOutput = {
        ble: fnProtocol.bleCommand
      };
      console.log('Send to device:', bleOutput);
      
      console.log(`[FNVibrationAdapter] Sending command:`, command);
      console.log(`[FNVibrationAdapter] FN Protocol (BLE):`, fnProtocol);
      console.log(`[FNVibrationAdapter] Protocol command (Runtime):`, protocolCommand);
      
      // TODO: 实际实现应该：
      // 1. 使用 fnProtocol.bleCommand 发送到 FN Vibration 设备
      // 2. 调用 FN Vibration SDK 或蓝牙 API
      // 3. 等待设备响应
      // 4. 解析响应并返回
      
      // 模拟设备响应
      return {
        success: true,
        message: `FN Vibration command ${command.action} sent successfully`,
      };
    } catch (error) {
      console.error('[FNVibrationAdapter] Error sending command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

