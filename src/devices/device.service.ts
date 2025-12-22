/**
 * Device Service
 * 
 * 设备服务：统一管理设备适配器和能力描述
 * 只存在于后端 - 前端、PDF、AI 永远看不到协议细节
 * 
 * B2. 正确的 Profile 形式（JSON）
 */

import { DeviceCommand, DeviceCommandResponse } from './types';
import { DeviceCapabilityProfile } from '@/src/types/deviceCapability';
import { GenericAdapter } from './adapters/generic.adapter';
import { FNVibrationAdapter } from './adapters/fn_vibration.adapter';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 设备适配器接口
 */
export interface IDeviceAdapter {
  getDeviceProfile(): DeviceCapabilityProfile;
  toVendorProtocol(command: DeviceCommand): any;
  fromVendorProtocol(protocol: any): DeviceCommand;
  sendCommand(command: DeviceCommand): Promise<DeviceCommandResponse>;
}

/**
 * 设备能力配置（从 profiles 目录读取）
 * 实际应该从配置文件或数据库读取
 * 注意：这些是旧格式，会被 normalizeProfile 转换为新格式
 */
const DEVICE_PROFILES: Record<string, any> = {
  'fn_vib_2025': {
    model: "FN-VIB-2025",
    supports: {
      frequencyRange: [1, 60],
      modes: ["relax", "strength", "rehab"],
      intensityLevels: 10,
    },
  },
  'vp_2025_000001': {
    model: "VP-2025-000001",
    supports: {
      frequencyRange: [20, 50],
      modes: ["training", "rehab", "balance"],
      intensityLevels: 10,
    },
  },
  'test_device': {
    model: "Test Device",
    supports: {
      frequencyRange: [20, 50],
      modes: ["training", "rehab", "balance"],
      intensityLevels: 10,
    },
  },
};

/**
 * 加载设备能力配置文件
 * 从 profiles 目录或配置对象读取
 * 
 * B2. 正确的 Profile 形式（JSON）
 */
function loadDeviceProfile(model: string): DeviceCapabilityProfile | null {
  // 1. 优先从 profiles 目录读取 JSON 文件
  try {
    const profileKey = model.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const profilePath = join(process.cwd(), 'src', 'devices', 'profiles', `${profileKey}.profile.json`);
    
    try {
      const fileContent = readFileSync(profilePath, 'utf-8');
      const profile = JSON.parse(fileContent) as DeviceCapabilityProfile;
      
      // 验证并规范化 Profile 格式
      return normalizeProfile(profile);
    } catch (fileError) {
      // 文件不存在或读取失败，继续尝试其他方式
      console.log(`[DeviceService] Profile file not found: ${profilePath}`);
    }
  } catch (error) {
    // 忽略文件系统错误（可能在 Next.js 环境中）
    console.log(`[DeviceService] Cannot read profile files: ${error}`);
  }
  
  // 2. 尝试从配置对象读取（向后兼容）
  const profileKey = model.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (DEVICE_PROFILES[profileKey]) {
    return normalizeProfile(DEVICE_PROFILES[profileKey]);
  }
  
  // 3. 尝试直接匹配
  for (const [key, profile] of Object.entries(DEVICE_PROFILES)) {
    if (profile.model === model || key === profileKey) {
      return normalizeProfile(profile);
    }
  }
  
  return null;
}

/**
 * 规范化 Profile 格式
 * 将旧格式转换为新格式，确保向后兼容
 */
function normalizeProfile(profile: any): DeviceCapabilityProfile {
  // 如果已经是新格式，直接返回
  if (profile.frequencyHz && profile.modes && Array.isArray(profile.modes) && profile.modes[0]?.key) {
    return profile as DeviceCapabilityProfile;
  }
  
  // 转换旧格式到新格式
  const normalized: DeviceCapabilityProfile = {
    model: profile.model || 'unknown',
    type: profile.type,
    frequencyHz: profile.frequencyHz || {
      min: profile.supports?.frequencyRange?.[0] || 1,
      max: profile.supports?.frequencyRange?.[1] || 100,
    },
    intensityLevels: profile.intensityLevels || profile.supports?.intensityLevels || 10,
    modes: profile.modes || (profile.supports?.modes || []).map((mode: string) => ({
      key: mode,
      label: {
        zh: mode,
        en: mode,
      },
      frequencyRange: profile.frequencyHz 
        ? [profile.frequencyHz.min, profile.frequencyHz.max]
        : (profile.supports?.frequencyRange || [1, 100]),
    })),
    supports: {
      ...profile.supports,
      realTimeStream: profile.supports?.realTimeStream,
      presetPrograms: profile.supports?.presetPrograms,
    },
  };
  
  return normalized;
}

/**
 * 设备服务工厂
 * 根据设备型号返回对应的适配器
 */
export class DeviceService {
  /**
   * 获取设备适配器
   * @param deviceModel 设备型号
   * @returns 对应的设备适配器
   */
  static getAdapter(deviceModel: string): IDeviceAdapter {
    // 尝试加载设备能力配置文件
    let deviceProfile = loadDeviceProfile(deviceModel);
    
    // 如果没有找到配置文件，使用默认值（新格式）
    if (!deviceProfile) {
      deviceProfile = {
        model: deviceModel,
        type: 'generic',
        frequencyHz: {
          min: 1,
          max: 100,
        },
        intensityLevels: 10,
        modes: [
          {
            key: 'training',
            label: {
              zh: '训练',
              en: 'Training',
            },
            frequencyRange: [20, 50],
          },
          {
            key: 'rehab',
            label: {
              zh: '康复',
              en: 'Rehab',
            },
            frequencyRange: [5, 20],
          },
        ],
        supports: {
          realTimeStream: false,
          presetPrograms: false,
        },
      };
    }

    // 根据设备型号返回对应的适配器
    if (deviceModel.startsWith('FN-VIB-') || deviceModel.includes('FN-VIB')) {
      return new FNVibrationAdapter(deviceProfile);
    }
    
    // 默认返回通用适配器
    return new GenericAdapter(deviceModel, deviceProfile);
  }

  /**
   * 获取设备能力描述
   * @param deviceModel 设备型号
   * @returns 设备能力描述
   */
  static getDeviceCapability(deviceModel: string): DeviceCapabilityProfile {
    const adapter = this.getAdapter(deviceModel);
    return adapter.getDeviceProfile();
  }
}

