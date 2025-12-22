const { execSync } = require('child_process');
const os = require('os');

const PORT = 6001;

function cleanPort() {
  try {
    if (os.platform() === 'win32') {
      // Windows
      const result = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, { encoding: 'utf-8' });
      const lines = result.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        console.log(`✓ 端口 ${PORT} 未被占用`);
        return;
      }

      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      });

      if (pids.size > 0) {
        console.log(`正在清理端口 ${PORT}...`);
        pids.forEach(pid => {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`✓ 已停止进程 PID ${pid}`);
          } catch (e) {
            // 进程可能已经不存在，忽略错误
          }
        });
        // 等待端口释放
        const start = Date.now();
        while (Date.now() - start < 1000) {
          // 等待 1 秒
        }
        console.log(`端口 ${PORT} 清理完成`);
      }
    } else {
      // Linux/Mac
      try {
        const result = execSync(`lsof -ti:${PORT}`, { encoding: 'utf-8' });
        const pids = result.trim().split('\n').filter(pid => pid.trim());
        if (pids.length > 0) {
          console.log(`正在清理端口 ${PORT}...`);
          pids.forEach(pid => {
            try {
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
              console.log(`✓ 已停止进程 PID ${pid}`);
            } catch (e) {
              // 忽略错误
            }
          });
          console.log(`端口 ${PORT} 清理完成`);
        }
      } catch (e) {
        // 端口未被占用
        console.log(`✓ 端口 ${PORT} 未被占用`);
      }
    }
  } catch (error) {
    // 如果清理失败，不影响后续启动
    console.log(`清理端口时出现警告（可忽略）: ${error.message}`);
  }
}

cleanPort();

