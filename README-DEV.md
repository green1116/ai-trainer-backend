# 开发服务器启动指南

## 🎯 问题说明

如果遇到 `Error: listen EADDRINUSE: address already in use :::6001` 错误，说明端口 6001 被之前的进程占用了。

## ✅ 正确的启动方式（推荐）

现在 `npm run dev` 命令已经**自动清理端口**，直接运行即可：

```bash
npm run dev
```

这个命令会：
1. 自动检测并清理占用端口 6001 的进程
2. 启动开发服务器

## 🔧 其他可用命令

### 手动清理端口

如果需要单独清理端口：

```bash
# 使用批处理文件（Windows，推荐）
npm run clean:port

# 或直接运行
clean-port.bat

# 使用 PowerShell 脚本（备用）
npm run clean:port:ps
```

### 原始启动命令（不清理端口）

如果确定端口未被占用，可以使用：

```bash
npm run dev:raw
```

## 📝 工作流程建议

1. **正常启动**：直接运行 `npm run dev`
2. **如果启动失败**：
   - 检查是否有其他终端窗口正在运行服务器
   - 运行 `npm run clean:port` 手动清理
   - 再次运行 `npm run dev`

## 🛠️ 技术说明

- `predev` hook：在 `dev` 命令执行前自动运行清理脚本
- 跨平台支持：清理脚本支持 Windows、Linux、Mac
- 自动检测：只在端口被占用时才清理，避免不必要的操作

## ⚠️ 注意事项

- 如果服务器正在运行，清理端口会停止它
- 确保在正确的目录（`ai-trainer-backend`）下运行命令
- 如果清理失败，可以手动使用任务管理器（Windows）或 `kill` 命令（Linux/Mac）停止进程

