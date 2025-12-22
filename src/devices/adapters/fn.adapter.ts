import { DeviceCommand } from "../types"
import { FunosCommands } from "./funos/commands"

/**
 * 将 DeviceMode 转换为 Funos 协议模式值
 * 
 * TODO: 从《律动机通信协议.pdf》中找到模式映射
 */
function modeToProtocolValue(mode: string): number {
  // TODO: 从 PDF 中找到模式值映射
  const modeMap: Record<string, number> = {
    'rehab': 0x01,
    'strength': 0x02,
    'relax': 0x03,
    'custom': 0x04,
  };
  return modeMap[mode] || 0x01;
}

/**
 * 将统一指令模型转换为 FN 设备的 BLE 协议
 * 
 * A-6 第六步: 把"工厂协议"接进来
 * 
 * 你手上那份: 《律动机通信协议.pdf》
 * 
 * 使用 FunosCommands 生成协议命令
 * 
 * A-5: 终端会看到输出
 * 返回格式: { ble: [...] }
 */
export function mapToFnProtocol(command: DeviceCommand) {
  const address = 0x01; // TODO: 从设备配置或参数中获取地址

  switch (command.action) {
    case "start":
      // 使用 FunosCommands 生成启动命令
      const startBytes = FunosCommands.start(address);
      return {
        ble: Array.from(startBytes)
      }

    case "stop":
      // 使用 FunosCommands 生成停止命令
      const stopBytes = FunosCommands.stop(address);
      return {
        ble: Array.from(stopBytes)
      }

    case "set":
      // 根据参数类型选择对应的命令
      if (command.params?.frequencyHz !== undefined) {
        // 设置频率
        const freqBytes = FunosCommands.setFrequency(command.params.frequencyHz, address);
        return {
          ble: Array.from(freqBytes)
        };
      }
      
      if (command.params?.intensity !== undefined) {
        // 设置振幅
        const ampBytes = FunosCommands.setAmplitude(command.params.intensity, address);
        return {
          ble: Array.from(ampBytes)
        };
      }
      
      if (command.params?.mode !== undefined) {
        // 设置模式
        const modeValue = modeToProtocolValue(command.params.mode);
        const modeBytes = FunosCommands.setMode(modeValue, address);
        return {
          ble: Array.from(modeBytes)
        };
      }

      // 如果没有参数，返回空命令
      return {
        ble: []
      }

    default:
      throw new Error("Unsupported command")
  }
}
