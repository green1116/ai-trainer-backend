/**
 * Mock Adapter
 * 
 * 五、Adapter 的真实样子 (重点)
 * 
 * 我们给工厂协议建一个 Adapter
 * 
 * ← 无设备调试
 * 
 * 这个 Adapter 实现 VibrationDevice 接口
 * 用于在没有真实设备时进行调试和测试
 */

import { VibrationDevice, DeviceMode, DeviceStatus } from '../../device-capabilities';

/**
 * Mock 设备适配器
 * 
 * 实现 VibrationDevice 接口
 * 用于无设备调试和测试
 */
export class MockAdapter implements VibrationDevice {
  private connected: boolean = false;
  private currentStatus: DeviceStatus = {
    frequency: 0,
    amplitude: 0,
    mode: 'rehab',
    running: false,
  };

  /**
   * 连接设备（模拟）
   */
  async connect(): Promise<void> {
    console.log('[MockAdapter] Mock device connected');
    this.connected = true;
    // 模拟连接延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 断开设备连接（模拟）
   */
  async disconnect(): Promise<void> {
    console.log('[MockAdapter] Mock device disconnected');
    this.connected = false;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * 启动设备（模拟）
   */
  async start(): Promise<void> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    console.log('[MockAdapter] Mock device started');
    this.currentStatus.running = true;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * 停止设备（模拟）
   */
  async stop(): Promise<void> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    console.log('[MockAdapter] Mock device stopped');
    this.currentStatus.running = false;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * 设置频率（模拟）
   */
  async setFrequency(hz: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    console.log(`[MockAdapter] Mock device frequency set to ${hz} Hz`);
    this.currentStatus.frequency = hz;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * 设置振幅（模拟）
   */
  async setAmplitude(level: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    console.log(`[MockAdapter] Mock device amplitude set to ${level}`);
    this.currentStatus.amplitude = level;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * 设置模式（模拟）
   */
  async setMode(mode: DeviceMode): Promise<void> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    console.log(`[MockAdapter] Mock device mode set to ${mode}`);
    this.currentStatus.mode = mode;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * 读取设备状态（模拟）
   */
  async readStatus(): Promise<DeviceStatus> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    // 模拟读取延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return { ...this.currentStatus };
  }

  /**
   * 获取当前状态（用于测试）
   */
  getCurrentStatus(): DeviceStatus {
    return { ...this.currentStatus };
  }

  /**
   * 设置状态（用于测试）
   */
  setStatus(status: Partial<DeviceStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...status };
  }
}

