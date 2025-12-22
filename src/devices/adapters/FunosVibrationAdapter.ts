import { FunosCommands } from "./funos/commands"
import { DeviceCommand } from "../types"

/**
 * Funos Vibration Adapter
 * 
 * 简化的适配器实现，使用依赖注入的方式
 * 专注于命令转换，不处理 BLE 连接逻辑
 * 
 * @example
 * ```typescript
 * const adapter = new FunosVibrationAdapter(async (data) => {
 *   await characteristic.writeValue(data);
 * });
 * 
 * await adapter.handle({ action: 'start' });
 * await adapter.handle({ 
 *   action: 'set', 
 *   params: { frequencyHz: 32.5 } 
 * });
 * ```
 */
export class FunosVibrationAdapter {
  /**
   * @param write 写入函数，接收 Uint8Array 并发送到设备
   */
  constructor(private write: (data: Uint8Array) => Promise<void>) {}

  /**
   * 处理设备命令
   * 
   * @param command 统一指令模型
   */
  async handle(command: DeviceCommand): Promise<void> {
    switch (command.action) {
      case "start":
        return this.write(FunosCommands.start())

      case "stop":
        return this.write(FunosCommands.stop())

      case "set":
        // 如果同时设置了多个参数，按顺序发送多个命令
        if (command.params?.frequencyHz !== undefined) {
          await this.write(
            FunosCommands.setFrequency(command.params.frequencyHz)
          )
        }

        if (command.params?.intensity !== undefined) {
          await this.write(
            FunosCommands.setAmplitude(command.params.intensity)
          )
        }

        if (command.params?.mode !== undefined) {
          // 将 mode 转换为协议值
          // mode 可能是字符串（如 'rehab'）或数字（如 0x01）
          const modeValue = typeof command.params.mode === 'string' 
            ? this.modeToProtocolValue(command.params.mode)
            : Number(command.params.mode);
          
          await this.write(
            FunosCommands.setMode(modeValue)
          )
        }
        return

      default:
        throw new Error(`Unsupported command action: ${command.action}`)
    }
  }

  /**
   * 将 DeviceMode 字符串转换为 Funos 协议模式值
   * 
   * TODO: 从《律动机通信协议.pdf》中找到模式映射
   */
  private modeToProtocolValue(mode: string): number {
    const modeMap: Record<string, number> = {
      'rehab': 0x01,
      'strength': 0x02,
      'relax': 0x03,
      'custom': 0x04,
    };
    return modeMap[mode] || 0x01;
  }
}

