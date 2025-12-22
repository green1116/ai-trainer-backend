/**
 * Device Runtime (运行时映射)
 * 
 * ③ Device Runtime (运行时映射)
 * 负责将统一指令模型转换为真实的 BLE / 串口指令
 */

import { DeviceCommand } from '@/src/devices/types';
import { DeviceCapabilityProfile } from '@/src/types/deviceCapability';

/**
 * BLE/串口协议类型
 * 实际实现应该根据具体协议规范定义
 */
export type ProtocolCommand = {
  // BLE Characteristic 写入格式
  characteristic?: string;
  value?: Uint8Array | Buffer | string;
  // 或串口协议格式
  command?: string;
  data?: Uint8Array | Buffer;
} | Uint8Array | Buffer | string;

/**
 * 获取设备频率范围（支持新旧格式）
 */
function getFrequencyRange(profile: DeviceCapabilityProfile): [number, number] {
  // 新格式：frequencyHz { min, max }
  if (profile.frequencyHz) {
    return [profile.frequencyHz.min, profile.frequencyHz.max];
  }
  // 旧格式：supports.frequencyRange
  if (profile.supports?.frequencyRange) {
    return profile.supports.frequencyRange;
  }
  // 默认值
  return [1, 100];
}

/**
 * 获取设备模式列表（支持新旧格式）
 */
function getModeKeys(profile: DeviceCapabilityProfile): string[] {
  // 新格式：modes 是对象数组，每个对象有 key
  if (profile.modes && Array.isArray(profile.modes) && profile.modes.length > 0) {
    if (typeof profile.modes[0] === 'object' && 'key' in profile.modes[0]) {
      return profile.modes.map((mode: any) => mode.key);
    }
  }
  // 旧格式：supports.modes 是字符串数组
  if (profile.supports?.modes && Array.isArray(profile.supports.modes)) {
    return profile.supports.modes;
  }
  // 默认值
  return ['training', 'rehab'];
}

/**
 * 获取强度级别数（支持新旧格式）
 */
function getIntensityLevels(profile: DeviceCapabilityProfile): number {
  // 新格式：intensityLevels 是顶层字段
  if (profile.intensityLevels !== undefined) {
    return profile.intensityLevels;
  }
  // 旧格式：supports.intensityLevels
  if (profile.supports?.intensityLevels !== undefined) {
    return profile.supports.intensityLevels;
  }
  // 默认值
  return 10;
}

/**
 * 运行时映射：将统一指令模型转换为真实的 BLE / 串口指令
 * 
 * @param command 统一指令模型
 * @param deviceProfile 设备能力描述
 * @returns 真实的 BLE / 串口指令
 */
export function mapToProtocol(
  command: DeviceCommand,
  deviceProfile: DeviceCapabilityProfile
): ProtocolCommand {
  const { action, params } = command;
  const frequencyRange = getFrequencyRange(deviceProfile);
  const modes = getModeKeys(deviceProfile);
  const intensityLevels = getIntensityLevels(deviceProfile);

  // 验证参数是否符合设备能力
  if (params?.frequencyHz !== undefined) {
    if (params.frequencyHz < frequencyRange[0] || params.frequencyHz > frequencyRange[1]) {
      throw new Error(
        `Frequency ${params.frequencyHz} Hz is out of range [${frequencyRange[0]}, ${frequencyRange[1]}]`
      );
    }
  }

  if (params?.mode !== undefined && !modes.includes(params.mode)) {
    throw new Error(
      `Mode "${params.mode}" is not supported. Available modes: ${modes.join(', ')}`
    );
  }

  if (params?.intensity !== undefined) {
    if (params.intensity < 0 || params.intensity > intensityLevels) {
      throw new Error(
        `Intensity ${params.intensity} is out of range [0, ${intensityLevels}]`
      );
    }
  }

  // 根据 action 转换为协议指令
  switch (action) {
    case 'start':
      return encodeStartCommand(params || {}, deviceProfile);
    
    case 'stop':
      return encodeStopCommand(deviceProfile);
    
    case 'set':
      return encodeSetCommand(params || {}, deviceProfile);
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * 编码启动指令
 */
function encodeStartCommand(
  params: NonNullable<DeviceCommand['params']>,
  deviceProfile: DeviceCapabilityProfile
): ProtocolCommand {
  // 示例：BLE 协议格式
  // 实际实现应该根据具体设备协议规范
  const buffer = new Uint8Array(20);
  buffer[0] = 0x01; // 命令类型：启动
  
  if (params.frequencyHz !== undefined) {
    // 频率值（Hz）转换为协议格式
    const freqValue = Math.round(params.frequencyHz * 10); // 保留一位小数
    buffer[1] = (freqValue >> 8) & 0xFF;
    buffer[2] = freqValue & 0xFF;
  }
  
  if (params.mode !== undefined) {
    // 模式索引
    const modes = getModeKeys(deviceProfile);
    const modeIndex = modes.indexOf(params.mode);
    if (modeIndex >= 0) {
      buffer[3] = modeIndex;
    }
  }
  
  if (params.intensity !== undefined) {
    // 强度值（0-100 映射到 0-intensityLevels）
    const intensityLevels = getIntensityLevels(deviceProfile);
    const intensityValue = Math.round(
      (params.intensity / 100) * intensityLevels
    );
    buffer[4] = intensityValue;
  }
  
  if (params.durationSec !== undefined) {
    // 时长（秒）转换为协议格式
    const durationValue = params.durationSec;
    buffer[5] = (durationValue >> 24) & 0xFF;
    buffer[6] = (durationValue >> 16) & 0xFF;
    buffer[7] = (durationValue >> 8) & 0xFF;
    buffer[8] = durationValue & 0xFF;
  }
  
  return buffer;
}

/**
 * 编码停止指令
 */
function encodeStopCommand(deviceProfile: DeviceCapabilityProfile): ProtocolCommand {
  // 示例：BLE 协议格式
  const buffer = new Uint8Array(1);
  buffer[0] = 0x02; // 命令类型：停止
  return buffer;
}

/**
 * 编码设置指令
 */
function encodeSetCommand(
  params: NonNullable<DeviceCommand['params']>,
  deviceProfile: DeviceCapabilityProfile
): ProtocolCommand {
  // 示例：BLE 协议格式
  const buffer = new Uint8Array(20);
  buffer[0] = 0x03; // 命令类型：设置
  
  if (params.frequencyHz !== undefined) {
    const freqValue = Math.round(params.frequencyHz * 10);
    buffer[1] = (freqValue >> 8) & 0xFF;
    buffer[2] = freqValue & 0xFF;
  }
  
  if (params.mode !== undefined) {
    const modes = getModeKeys(deviceProfile);
    const modeIndex = modes.indexOf(params.mode);
    if (modeIndex >= 0) {
      buffer[3] = modeIndex;
    }
  }
  
  if (params.intensity !== undefined) {
    const intensityLevels = getIntensityLevels(deviceProfile);
    const intensityValue = Math.round(
      (params.intensity / 100) * intensityLevels
    );
    buffer[4] = intensityValue;
  }
  
  if (params.durationSec !== undefined) {
    // 时长（秒）
    const durationValue = params.durationSec;
    buffer[5] = (durationValue >> 24) & 0xFF;
    buffer[6] = (durationValue >> 16) & 0xFF;
    buffer[7] = (durationValue >> 8) & 0xFF;
    buffer[8] = durationValue & 0xFF;
  }
  
  return buffer;
}

/**
 * 解码协议响应（从设备返回的数据）
 * 
 * @param protocolData BLE/串口返回的数据
 * @param deviceProfile 设备能力描述
 * @returns 解析后的响应数据
 */
export function decodeProtocolResponse(
  protocolData: Uint8Array | Buffer | string,
  deviceProfile: DeviceCapabilityProfile
): {
  success: boolean;
  status?: string;
  currentFrequency?: number;
  currentMode?: string;
  currentIntensity?: number;
} {
  // 示例：解析协议响应
  // 实际实现应该根据具体设备协议规范
  
  if (typeof protocolData === 'string') {
    try {
      const parsed = JSON.parse(protocolData);
      return {
        success: parsed.success || false,
        status: parsed.status,
        currentFrequency: parsed.frequency,
        currentMode: parsed.mode,
        currentIntensity: parsed.intensity,
      };
    } catch {
      // 如果不是 JSON，按二进制解析
    }
  }
  
  if (protocolData instanceof Uint8Array || Buffer.isBuffer(protocolData)) {
    const buffer = Buffer.from(protocolData);
    if (buffer.length < 1) {
      return { success: false };
    }
    
    const status = buffer[0];
    return {
      success: status === 0x00, // 0x00 表示成功
      status: status === 0x00 ? 'success' : 'error',
      // 可以继续解析其他字段...
    };
  }
  
  return { success: false };
}

