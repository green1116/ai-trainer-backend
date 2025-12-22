/**
 * Generic Device Adapter
 * 
 * 默认设备适配器实现
 * 只存在于后端 - 前端、PDF、AI 永远看不到协议细节
 */

import { DeviceCommand, DeviceCommandResponse } from '../types';
import { DeviceCapabilityProfile } from '@/src/types/deviceCapability';
import { mapToProtocol, ProtocolCommand, decodeProtocolResponse } from '@/src/services/deviceRuntime';
import type { VendorProtocol } from './adapter.types';

/**
 * 通用设备适配器
 */
export class GenericAdapter {
  private vendorName: string;
  protected deviceProfile: DeviceCapabilityProfile; // 改为 protected，允许子类访问

  constructor(vendorName: string = 'default', deviceProfile?: DeviceCapabilityProfile) {
    this.vendorName = vendorName;
    this.deviceProfile = deviceProfile || {
      model: vendorName,
      frequencyHz: { min: 1, max: 100 },
      intensityLevels: 10,
      modes: [
        { key: 'training', label: { zh: '训练', en: 'Training' }, frequencyRange: [20, 50] },
        { key: 'rehab', label: { zh: '康复', en: 'Rehab' }, frequencyRange: [5, 20] },
      ],
      supports: {
        frequencyRange: [1, 100],
        modes: ['training', 'rehab'],
        intensityLevels: 10,
      },
    };
  }

  getDeviceProfile(): DeviceCapabilityProfile {
    return this.deviceProfile;
  }

  /**
   * 将统一指令模型转换为厂商协议
   */
  toVendorProtocol(command: DeviceCommand): VendorProtocol {
    return {
      command: command.action,
      frequency: command.params?.frequencyHz,  // 使用 frequencyHz
      mode: command.params?.mode,
      intensity: command.params?.intensity,
      duration: command.params?.durationSec,    // 添加 durationSec
    };
  }

  /**
   * 将厂商协议转换为统一指令模型
   */
  fromVendorProtocol(protocol: VendorProtocol): DeviceCommand {
    if (typeof protocol === 'string') {
      try {
        const parsed = JSON.parse(protocol);
        return this.fromVendorProtocol(parsed);
      } catch {
        throw new Error('Invalid vendor protocol format');
      }
    }

    if (typeof protocol === 'object' && protocol !== null) {
      const action = (protocol as any).command || (protocol as any).action || 'set';
      return {
        action: action as "start" | "stop" | "set",
        params: {
          frequencyHz: (protocol as any).frequency || (protocol as any).frequencyHz,  // 支持两种字段名
          mode: (protocol as any).mode,
          intensity: (protocol as any).intensity,
          durationSec: (protocol as any).duration || (protocol as any).durationSec,    // 添加 durationSec
        },
      };
    }

    throw new Error('Invalid vendor protocol');
  }

  /**
   * 发送指令到设备
   * 使用 Device Runtime 进行运行时映射
   */
  async sendCommand(command: DeviceCommand): Promise<DeviceCommandResponse> {
    try {
      // ③ Device Runtime: 运行时映射
      // 将统一指令模型转换为真实的 BLE / 串口指令
      const protocolCommand = mapToProtocol(command, this.deviceProfile);

      // 转换为厂商协议（如果需要进一步转换）
      const vendorProtocol = this.toVendorProtocol(command);

      // TODO: 实际实现应该：
      // 1. 使用 protocolCommand (BLE/串口指令) 发送到设备
      // 2. 调用厂商 SDK 或蓝牙 API
      // 3. 等待设备响应
      // 4. 使用 decodeProtocolResponse 解析响应

      console.log(`[GenericAdapter] Sending command to ${this.vendorName}:`, command);
      console.log(`[GenericAdapter] Protocol command (BLE/Serial):`, protocolCommand);
      console.log(`[GenericAdapter] Vendor protocol:`, vendorProtocol);

      // 模拟设备响应
      return {
        success: true,
        message: `Command ${command.action} sent successfully`,
      };
    } catch (error) {
      console.error('[GenericAdapter] Error sending command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

