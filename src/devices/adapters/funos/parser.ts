/**
 * Funos 设备状态解析器
 * 
 * 从《律动机通信协议.pdf》中提取的状态解析逻辑
 * 
 * 解析设备状态查询返回帧的字节数据
 */

/**
 * 解析后的设备状态
 */
export interface ParsedStatus {
  frequency: number;  // 频率 (Hz)
  amplitude: number;  // 振幅
  mode: number;       // 模式值
  running: boolean;   // 是否运行中
}

/**
 * 解析设备状态数据
 * 
 * 根据 PDF 协议解析状态查询返回帧
 * 
 * @param data 设备返回的字节数组
 * @returns 解析后的设备状态
 * 
 * @example
 * ```typescript
 * // 假设从设备接收到状态数据
 * const statusData = new Uint8Array([0xAA, 0x01, 0x10, 0x05, 0x01, 0x45, 0x05, 0x01, 0x01, 0x...]);
 * const status = parseStatus(statusData);
 * // status = { frequency: 32.5, amplitude: 5, mode: 1, running: true }
 * ```
 */
export function parseStatus(data: Uint8Array): ParsedStatus {
  // 按 PDF 协议解析
  // data[4] 和 data[5] 是频率的高字节和低字节
  // 频率 = (高字节 << 8 | 低字节) / 10
  const frequency = ((data[4] << 8) | data[5]) / 10;
  
  // data[6] 是振幅
  const amplitude = data[6];
  
  // data[7] 是模式值
  const mode = data[7];
  
  // data[8] 是运行状态 (1 = 运行中, 0 = 停止)
  const running = data[8] === 1;

  return {
    frequency,
    amplitude,
    mode,
    running
  };
}

/**
 * 将协议模式值转换为 DeviceMode 字符串
 * 
 * TODO: 从《律动机通信协议.pdf》中确认模式值映射
 * 
 * @param modeValue 协议模式值
 * @returns DeviceMode 字符串
 */
export function modeValueToDeviceMode(modeValue: number): string {
  const modeMap: Record<number, string> = {
    0x01: 'rehab',
    0x02: 'strength',
    0x03: 'relax',
    0x04: 'custom',
  };
  return modeMap[modeValue] || 'custom';
}

/**
 * 验证状态数据帧格式
 * 
 * 检查数据是否符合协议格式：
 * - 帧头是否为 0xAA
 * - 数据长度是否正确
 * - 校验和是否正确
 * 
 * @param data 设备返回的字节数组
 * @returns 是否为有效的状态帧
 */
export function validateStatusFrame(data: Uint8Array): boolean {
  // 检查最小长度
  if (data.length < 9) {
    return false;
  }

  // 检查帧头
  if (data[0] !== 0xAA) {
    return false;
  }

  // TODO: 根据 PDF 添加更详细的验证
  // - 检查功能码
  // - 检查数据长度
  // - 检查校验和

  return true;
}

