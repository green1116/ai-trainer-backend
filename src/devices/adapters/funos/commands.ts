/**
 * Funos 设备协议命令
 * 
 * 从《律动机通信协议.pdf》中提取的协议实现
 * 
 * 协议格式：
 * [0xAA, address, func, length, ...data, checksum]
 */

/**
 * 计算校验和
 */
function checksum(bytes: number[]): number {
  return bytes.reduce((sum, b) => sum + b, 0) & 0xff;
}

/**
 * 构建协议帧
 * 
 * @param address 设备地址
 * @param func 功能码
 * @param data 数据字节数组
 * @returns 完整的协议帧（Uint8Array）
 */
function frame(address: number, func: number, data: number[]): Uint8Array {
  const length = data.length;
  const body = [address, func, length, ...data];
  const cs = checksum(body);
  return new Uint8Array([0xAA, ...body, cs]);
}

/**
 * Funos 设备命令
 * 
 * 所有命令都返回 Uint8Array，可以直接写入 BLE Characteristic
 */
export const FunosCommands = {
  /**
   * 启动设备
   * 
   * @param address 设备地址（默认 0x01）
   * @returns 启动命令的字节数组
   */
  start(address = 0x01): Uint8Array {
    return frame(address, 0x01, [0x01]);
  },

  /**
   * 停止设备
   * 
   * @param address 设备地址（默认 0x01）
   * @returns 停止命令的字节数组
   */
  stop(address = 0x01): Uint8Array {
    return frame(address, 0x01, [0x00]);
  },

  /**
   * 设置频率
   * 
   * PDF：频率 = 实际 Hz × 10
   * 
   * @param hz 频率值 (Hz)
   * @param address 设备地址（默认 0x01）
   * @returns 设置频率命令的字节数组
   */
  setFrequency(hz: number, address = 0x01): Uint8Array {
    // PDF：频率 = 实际 Hz × 10
    const value = Math.round(hz * 10);
    return frame(address, 0x02, [
      (value >> 8) & 0xff,  // 高字节
      value & 0xff          // 低字节
    ]);
  },

  /**
   * 设置振幅
   * 
   * @param level 振幅级别
   * @param address 设备地址（默认 0x01）
   * @returns 设置振幅命令的字节数组
   */
  setAmplitude(level: number, address = 0x01): Uint8Array {
    return frame(address, 0x03, [level]);
  },

  /**
   * 设置模式
   * 
   * @param mode 模式值（从 PDF 中找到模式映射）
   * @param address 设备地址（默认 0x01）
   * @returns 设置模式命令的字节数组
   */
  setMode(mode: number, address = 0x01): Uint8Array {
    return frame(address, 0x04, [mode]);
  },

  /**
   * 查询设备状态
   * 
   * @param address 设备地址（默认 0x01）
   * @returns 查询状态命令的字节数组
   */
  queryStatus(address = 0x01): Uint8Array {
    return frame(address, 0x10, []);
  }
};

