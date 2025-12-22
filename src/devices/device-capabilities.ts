/**
 * 四、先定义「你系统认可的设备能力」(核心)
 * 
 * 这是你唯一需要稳定的接口 👇
 * 
 * 这层和工厂协议完全无关
 */

/**
 * 设备模式类型
 * 
 * 这层和工厂协议完全无关
 */
export type DeviceMode =
  | 'rehab'
  | 'strength'
  | 'relax'
  | 'custom'

/**
 * 设备状态
 * 
 * 这层和工厂协议完全无关
 */
export interface DeviceStatus {
  frequency: number
  amplitude: number
  mode: DeviceMode
  running: boolean
  error?: string
}

/**
 * 震动设备接口
 * 
 * 这是你唯一需要稳定的接口
 * 这层和工厂协议完全无关
 * 
 * 所有设备实现都必须遵循这个接口
 */
export interface VibrationDevice {
  /**
   * 连接设备
   */
  connect(): Promise<void>

  /**
   * 断开设备连接
   */
  disconnect(): Promise<void>

  /**
   * 启动设备
   */
  start(): Promise<void>

  /**
   * 停止设备
   */
  stop(): Promise<void>

  /**
   * 设置频率
   * @param hz 频率值 (Hz)
   */
  setFrequency(hz: number): Promise<void>

  /**
   * 设置振幅
   * @param level 振幅级别
   */
  setAmplitude(level: number): Promise<void>

  /**
   * 设置模式
   * @param mode 设备模式
   */
  setMode(mode: DeviceMode): Promise<void>

  /**
   * 读取设备状态
   * @returns 设备当前状态
   */
  readStatus(): Promise<DeviceStatus>
}

