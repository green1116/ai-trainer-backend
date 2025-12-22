/**
 * Device Adapter (设备适配层)
 * 
 * 正确的三层抽象：
 * ① Device Adapter (设备适配层)
 *   只负责一件事：把厂商协议 → 转成"统一指令模型"
 */

import { DeviceCommand, DeviceCommandResponse } from '@/src/devices/types';
import { DeviceCapabilityProfile } from '@/src/types/deviceCapability';
import { mapToProtocol, ProtocolCommand, decodeProtocolResponse } from '@/src/services/deviceRuntime';

/**
 * 厂商协议类型（示例）
 * 不同的设备厂商可能有不同的协议格式
 */
export type VendorProtocol = {
  // 示例：厂商 A 的协议
  command?: string;
  frequency?: number;
  mode?: string;
  intensity?: number;
  // 或其他厂商特定的字段...
} | {
  // 示例：厂商 B 的协议
  action?: string;
  params?: Record<string, any>;
} | string; // 某些厂商可能使用字符串协议

/**
 * 设备适配器接口
 * 每个厂商需要实现自己的适配器
 */
export interface IDeviceAdapter {
  /**
   * 获取设备能力描述
   */
  getDeviceProfile(): DeviceCapabilityProfile;

  /**
   * 将统一指令模型转换为厂商协议
   * @param command 统一指令模型
   * @returns 厂商协议格式
   */
  toVendorProtocol(command: DeviceCommand): VendorProtocol;

  /**
   * 将厂商协议转换为统一指令模型
   * @param protocol 厂商协议
   * @returns 统一指令模型
   */
  fromVendorProtocol(protocol: VendorProtocol): DeviceCommand;

  /**
   * 发送指令到设备（实际实现会调用厂商 SDK）
   * @param command 统一指令模型
   * @returns 设备响应
   */
  sendCommand(command: DeviceCommand): Promise<DeviceCommandResponse>;
}

/**
 * 默认设备适配器（示例实现）
 * 
 * 实际使用时，应该为每个厂商创建专门的适配器：
 * - VendorAAdapter
 * - VendorBAdapter
 * - etc.
 */
export class DefaultDeviceAdapter implements IDeviceAdapter {
  private vendorName: string;
  private deviceProfile: DeviceCapabilityProfile;

  constructor(vendorName: string = 'default', deviceProfile?: DeviceCapabilityProfile) {
    this.vendorName = vendorName;
    // 如果没有提供 deviceProfile，使用默认值
    this.deviceProfile = deviceProfile || {
      model: vendorName,
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
   * 这里使用简单的 JSON 格式作为示例
   * 实际实现应该根据厂商协议规范转换
   */
  toVendorProtocol(command: DeviceCommand): VendorProtocol {
    // 示例：转换为厂商协议格式
    // 实际实现应该根据具体厂商协议规范
    return {
      command: command.action,
      frequency: command.params?.frequencyHz,
      mode: command.params?.mode,
      intensity: command.params?.intensity,
    };
  }

  /**
   * 将厂商协议转换为统一指令模型
   */
  fromVendorProtocol(protocol: VendorProtocol): DeviceCommand {
    // 示例：从厂商协议解析
    // 实际实现应该根据具体厂商协议规范
    if (typeof protocol === 'string') {
      // 如果是字符串协议，需要解析
      try {
        const parsed = JSON.parse(protocol);
        return this.fromVendorProtocol(parsed);
      } catch {
        throw new Error('Invalid vendor protocol format');
      }
    }

    if (typeof protocol === 'object' && protocol !== null) {
      // 示例：从对象协议解析
      const action = (protocol as any).command || (protocol as any).action || 'set';
      return {
        action: action as "start" | "stop" | "set",
        params: {
          frequencyHz: (protocol as any).frequency || (protocol as any).frequencyHz,
          mode: (protocol as any).mode,
          intensity: (protocol as any).intensity,
        },
      };
    }

    throw new Error('Invalid vendor protocol');
  }

  /**
   * 发送指令到设备
   * 实际实现应该调用厂商 SDK 或蓝牙 API
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
      // 5. 返回响应结果

      console.log(`[DeviceAdapter] Sending command to ${this.vendorName}:`, command);
      console.log(`[DeviceAdapter] Protocol command (BLE/Serial):`, protocolCommand);
      console.log(`[DeviceAdapter] Vendor protocol:`, vendorProtocol);

      // 模拟设备响应
      // 实际应该：const response = await sendBLECommand(protocolCommand);
      // const decoded = decodeProtocolResponse(response, this.deviceProfile);
      
      return {
        success: true,
        message: `Command ${command.action} sent successfully`,
      };
    } catch (error) {
      console.error('[DeviceAdapter] Error sending command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * 设备适配器工厂
 * 根据设备型号返回对应的适配器
 */
export class DeviceAdapterFactory {
  /**
   * 获取设备适配器
   * @param deviceModel 设备型号
   * @param deviceProfile 设备能力描述（可选，如果提供会使用）
   * @returns 对应的设备适配器
   */
  static getAdapter(deviceModel: string, deviceProfile?: DeviceCapabilityProfile): IDeviceAdapter {
    // 根据设备型号返回对应的适配器
    // 例如：
    // if (deviceModel.startsWith('VendorA-')) {
    //   return new VendorAAdapter(deviceProfile);
    // } else if (deviceModel.startsWith('VendorB-')) {
    //   return new VendorBAdapter(deviceProfile);
    // }
    
    // 默认返回通用适配器
    return new DefaultDeviceAdapter(deviceModel, deviceProfile);
  }
}

