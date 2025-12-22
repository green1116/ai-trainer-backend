/**
 * PowerPlate Adapter
 * 
 * 五、Adapter 的真实样子 (重点)
 * 
 * 我们给工厂协议建一个 Adapter
 * 
 * ← 未来可接
 * 
 * 这个 Adapter 实现 VibrationDevice 接口
 * 用于支持 PowerPlate 设备
 */

import { VibrationDevice, DeviceMode, DeviceStatus } from '../../device-capabilities';
import { DeviceCommand } from '../../types';
import { DeviceService, IDeviceAdapter } from '../../device.service';
import { db } from '@/lib/db';

/**
 * PowerPlate 设备适配器
 * 
 * 实现 VibrationDevice 接口
 * 内部使用 Device Adapter 层处理工厂协议
 */
export class PowerPlateAdapter implements VibrationDevice {
  private deviceId: string;
  private adapter: IDeviceAdapter | null = null;
  private connected: boolean = false;
  private currentStatus: DeviceStatus = {
    frequency: 0,
    amplitude: 0,
    mode: 'rehab',
    running: false,
  };

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  /**
   * 连接设备
   */
  async connect(): Promise<void> {
    // 从数据库获取设备信息
    const device = await db.device.findUnique({
      where: { id: this.deviceId },
    });

    if (!device) {
      throw new Error(`Device not found: ${this.deviceId}`);
    }

    // 获取设备适配器
    const deviceModel = device.name || device.id;
    this.adapter = DeviceService.getAdapter(deviceModel);

    // TODO: 实际实现应该：
    // 1. 建立 BLE/串口连接
    // 2. 初始化设备
    // 3. 读取初始状态

    this.connected = true;
    console.log(`[PowerPlateAdapter] Connected to device: ${this.deviceId}`);
  }

  /**
   * 断开设备连接
   */
  async disconnect(): Promise<void> {
    // TODO: 实际实现应该：
    // 1. 停止设备
    // 2. 关闭连接

    this.connected = false;
    console.log(`[PowerPlateAdapter] Disconnected from device: ${this.deviceId}`);
  }

  /**
   * 启动设备
   */
  async start(): Promise<void> {
    if (!this.connected || !this.adapter) {
      throw new Error('Device not connected');
    }

    const command: DeviceCommand = {
      action: 'start',
    };

    await this.adapter.sendCommand(command);
    this.currentStatus.running = true;
  }

  /**
   * 停止设备
   */
  async stop(): Promise<void> {
    if (!this.connected || !this.adapter) {
      throw new Error('Device not connected');
    }

    const command: DeviceCommand = {
      action: 'stop',
    };

    await this.adapter.sendCommand(command);
    this.currentStatus.running = false;
  }

  /**
   * 设置频率
   */
  async setFrequency(hz: number): Promise<void> {
    if (!this.connected || !this.adapter) {
      throw new Error('Device not connected');
    }

    const command: DeviceCommand = {
      action: 'set',
      params: {
        frequencyHz: hz,
      },
    };

    await this.adapter.sendCommand(command);
    this.currentStatus.frequency = hz;
  }

  /**
   * 设置振幅
   */
  async setAmplitude(level: number): Promise<void> {
    if (!this.connected || !this.adapter) {
      throw new Error('Device not connected');
    }

    const command: DeviceCommand = {
      action: 'set',
      params: {
        intensity: level,
      },
    };

    await this.adapter.sendCommand(command);
    this.currentStatus.amplitude = level;
  }

  /**
   * 设置模式
   */
  async setMode(mode: DeviceMode): Promise<void> {
    if (!this.connected || !this.adapter) {
      throw new Error('Device not connected');
    }

    const command: DeviceCommand = {
      action: 'set',
      params: {
        mode: mode,
      },
    };

    await this.adapter.sendCommand(command);
    this.currentStatus.mode = mode;
  }

  /**
   * 读取设备状态
   */
  async readStatus(): Promise<DeviceStatus> {
    if (!this.connected || !this.adapter) {
      throw new Error('Device not connected');
    }

    // TODO: 实际实现应该：
    // 1. 从设备读取当前状态
    // 2. 解析响应数据
    // 3. 返回 DeviceStatus

    // 目前返回缓存的状态
    return { ...this.currentStatus };
  }
}

