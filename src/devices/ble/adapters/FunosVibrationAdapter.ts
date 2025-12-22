/**
 * Funos Vibration Adapter
 * 
 * 六、Adapter 骨架（你现在就可以建）
 * 
 * ← 你这份 PDF (《律动机通信协议.pdf》)
 * 
 * 这个 Adapter 实现 VibrationDevice 接口
 * 使用 Web Bluetooth API 直接连接设备
 */

/// <reference path="../types.d.ts" />

import { VibrationDevice, DeviceMode, DeviceStatus } from '../../device-capabilities';
import { FunosCommands } from '../../adapters/funos/commands';
import { parseStatus, modeValueToDeviceMode, validateStatusFrame } from '../../adapters/funos/parser';

/**
 * Funos Vibration 设备适配器
 * 
 * 实现 VibrationDevice 接口
 * 使用 Web Bluetooth API 连接设备
 */
/**
 * 将 DeviceMode 转换为 Funos 协议模式值
 * 
 * TODO: 从《律动机通信协议.pdf》中找到模式映射
 */
function modeToProtocolValue(mode: DeviceMode): number {
  const modeMap: Record<DeviceMode, number> = {
    'rehab': 0x01,
    'strength': 0x02,
    'relax': 0x03,
    'custom': 0x04,
  };
  return modeMap[mode] || 0x01;
}

export class FunosVibrationAdapter implements VibrationDevice {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private deviceAddress: number = 0x01; // TODO: 从设备配置中获取
  private currentStatus: DeviceStatus = {
    frequency: 0,
    amplitude: 0,
    mode: 'rehab',
    running: false,
  };

  /**
   * 连接设备
   */
  async connect(): Promise<void> {
    // 1️⃣ 扫描 BLE
    // 2️⃣ 连接 GATT
    // 3️⃣ 找到 PDF 中定义的 Service / Characteristic

    try {
      // 检查 Web Bluetooth API 是否可用
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available in this environment');
      }

      // 1️⃣ 扫描 BLE 设备
      // TODO: 从 PDF 中找到设备名称或 Service UUID
      const options: RequestDeviceOptions = {
        filters: [
          { namePrefix: 'Funos' },  // TODO: 从 PDF 中找到设备名称
          // 或者使用 Service UUID
          // { services: [0xFFE0] }  // TODO: 从 PDF 中找到 Service UUID
        ],
        optionalServices: [0xFFE0],  // TODO: 从 PDF 中找到 Service UUID
      };

      this.device = await navigator.bluetooth.requestDevice(options);

      // 2️⃣ 连接 GATT
      if (!this.device.gatt) {
        throw new Error('GATT server not available');
      }

      const server = await this.device.gatt.connect();

      // 3️⃣ 找到 PDF 中定义的 Service / Characteristic
      // TODO: 从 PDF 中找到 Service UUID 和 Characteristic UUID
      const service = await server.getPrimaryService(0xFFE0);  // TODO: 从 PDF 中找到 Service UUID
      this.characteristic = await service.getCharacteristic(0xFFE1);  // TODO: 从 PDF 中找到 Characteristic UUID

      // 订阅 notify（如果需要接收设备状态）
      if (this.characteristic.properties.notify) {
        await this.characteristic.startNotifications();
        this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
          this.handleNotification(event);
        });
      }

      console.log('[FunosVibrationAdapter] Connected to device');
    } catch (error) {
      console.error('[FunosVibrationAdapter] Connection error:', error);
      throw error;
    }
  }

  /**
   * 断开设备连接
   */
  async disconnect(): Promise<void> {
    if (this.characteristic) {
      try {
        await this.characteristic.stopNotifications();
      } catch (error) {
        console.error('[FunosVibrationAdapter] Error stopping notifications:', error);
      }
    }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }

    this.device = null;
    this.characteristic = null;
    this.currentStatus.running = false;
    console.log('[FunosVibrationAdapter] Disconnected from device');
  }

  /**
   * 启动设备
   */
  async start(): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Device not connected');
    }

    // 写入：启动指令（来自 PDF）
    // 使用 FunosCommands 生成协议命令
    const bytes = FunosCommands.start(this.deviceAddress);
    await this.characteristic.writeValue(bytes);
    
    this.currentStatus.running = true;
    console.log('[FunosVibrationAdapter] Device started');
  }

  /**
   * 停止设备
   */
  async stop(): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Device not connected');
    }

    // 写入：停止指令
    const bytes = FunosCommands.stop(this.deviceAddress);
    await this.characteristic.writeValue(bytes);
    
    this.currentStatus.running = false;
    console.log('[FunosVibrationAdapter] Device stopped');
  }

  /**
   * 设置频率
   */
  async setFrequency(hz: number): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Device not connected');
    }

    // 这里就是：PDF 指令 → bytes
    // 使用 FunosCommands 生成协议命令
    const bytes = FunosCommands.setFrequency(hz, this.deviceAddress);
    await this.characteristic.writeValue(bytes);
    
    this.currentStatus.frequency = hz;
    console.log(`[FunosVibrationAdapter] Frequency set to ${hz} Hz`);
  }

  /**
   * 设置振幅
   */
  async setAmplitude(level: number): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Device not connected');
    }

    // 同上：PDF 指令 → bytes
    const bytes = FunosCommands.setAmplitude(level, this.deviceAddress);
    await this.characteristic.writeValue(bytes);
    
    this.currentStatus.amplitude = level;
    console.log(`[FunosVibrationAdapter] Amplitude set to ${level}`);
  }

  /**
   * 设置模式
   */
  async setMode(mode: DeviceMode): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Device not connected');
    }

    // mode → 工厂协议值
    const modeValue = modeToProtocolValue(mode);
    const bytes = FunosCommands.setMode(modeValue, this.deviceAddress);
    await this.characteristic.writeValue(bytes);
    
    this.currentStatus.mode = mode;
    console.log(`[FunosVibrationAdapter] Mode set to ${mode} (protocol value: ${modeValue})`);
  }

  /**
   * 读取设备状态
   */
  async readStatus(): Promise<DeviceStatus> {
    if (!this.characteristic) {
      throw new Error('Device not connected');
    }

    // 如果需要主动查询，使用 FunosCommands.queryStatus()
    const queryBytes = FunosCommands.queryStatus(this.deviceAddress);
    await this.characteristic.writeValue(queryBytes);
    
    // 尝试读取响应（如果支持 read）
    if (this.characteristic.properties.read) {
      try {
        const value = await this.characteristic.readValue();
        return this.parseDeviceStatus(value);
      } catch (error) {
        console.warn('[FunosVibrationAdapter] Failed to read status, using cached status:', error);
      }
    }
    
    // 如果无法主动读取，返回缓存的状态（应该从 notify 事件中更新）
    return {
      frequency: this.currentStatus.frequency,
      amplitude: this.currentStatus.amplitude,
      mode: this.currentStatus.mode,
      running: this.currentStatus.running,
    };
  }

  /**
   * 处理设备通知（notify）
   * 解析 bytes → DeviceStatus
   */
  private handleNotification(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) {
      return;
    }

    const bytes = new Uint8Array(target.value.buffer);
    
    // 验证状态帧格式
    if (!validateStatusFrame(bytes)) {
      console.warn('[FunosVibrationAdapter] Invalid status frame:', bytes);
      return;
    }

    // 使用解析器解析状态数据
    try {
      const parsed = parseStatus(bytes);
      
      // 更新当前状态
      this.currentStatus.frequency = parsed.frequency;
      this.currentStatus.amplitude = parsed.amplitude;
      this.currentStatus.mode = modeValueToDeviceMode(parsed.mode) as DeviceMode;
      this.currentStatus.running = parsed.running;

      console.log('[FunosVibrationAdapter] Status updated from device:', this.currentStatus);
    } catch (error) {
      console.error('[FunosVibrationAdapter] Error parsing status:', error);
    }
  }

  /**
   * 解析设备状态（如果需要主动读取）
   */
  private parseDeviceStatus(value: DataView): DeviceStatus {
    const bytes = new Uint8Array(value.buffer);
    
    // 验证状态帧格式
    if (!validateStatusFrame(bytes)) {
      throw new Error('Invalid status frame format');
    }

    // 使用解析器解析状态数据
    const parsed = parseStatus(bytes);
    
    return {
      frequency: parsed.frequency,
      amplitude: parsed.amplitude,
      mode: modeValueToDeviceMode(parsed.mode) as DeviceMode,
      running: parsed.running,
    };
  }
}

