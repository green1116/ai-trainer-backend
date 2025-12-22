/**
 * Device Capability Profile (设备能力描述)
 * 
 * 这是未来扩展所有型号的关键
 * 前端/AI 永远先读它
 * 
 * B2. 正确的 Profile 形式（JSON）
 */

/**
 * 模式定义
 */
export interface DeviceMode {
  key: string;  // 模式键（如 "rehab", "strength"）
  label: {
    zh: string;  // 中文标签
    en: string;  // 英文标签
  };
  frequencyRange: [number, number];  // 该模式的频率范围 [min, max]
}

/**
 * 设备能力描述
 * 
 * B2. 正确的 Profile 形式（JSON）
 */
export interface DeviceCapabilityProfile {
  model: string;  // 设备型号
  type?: string;  // 设备类型（如 "vibration_platform"）
  frequencyHz: {
    min: number;  // 最小频率 (Hz)
    max: number;  // 最大频率 (Hz)
  };
  intensityLevels: number;  // 强度级别数
  modes: DeviceMode[];  // 模式列表（包含标签和频率范围）
  supports?: {
    realTimeStream?: boolean;  // 是否支持实时数据流
    presetPrograms?: boolean;   // 是否支持预设程序
    // 向后兼容：保留旧的字段
    frequencyRange?: [number, number];  // 旧格式：频率范围 [min, max]
    modes?: string[];                  // 旧格式：模式列表（字符串数组）
    intensityLevels?: number;           // 旧格式：强度级别数
    [key: string]: any;                 // 其他支持的功能
  };
}

/**
 * 获取设备能力描述
 * 
 * 优先从 profiles 目录读取配置文件
 * 如果不存在，使用默认值
 * 
 * @param deviceModel 设备型号
 * @returns 设备能力描述
 */
export function getDeviceCapability(deviceModel: string): DeviceCapabilityProfile {
  // 尝试从 DeviceService 获取（会从 profiles 目录读取）
  try {
    const { DeviceService } = require('@/src/devices/device.service');
    return DeviceService.getDeviceCapability(deviceModel);
  } catch {
    // 如果失败，返回默认值（新格式）
    return {
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
}

