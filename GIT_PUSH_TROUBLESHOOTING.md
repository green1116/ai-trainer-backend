# Git Push 问题排查指南

## 问题描述

推送代码到 GitHub 时遇到连接错误：
```
fatal: unable to access 'https://github.com/...': Failed to connect to github.com port 443
```

## 解决方案

### 方案 1：增加 Git 超时时间（推荐先试这个）

```powershell
cd ai-trainer-backend
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
git push origin main
```

### 方案 2：使用 SSH 连接（推荐）

如果 HTTPS 连接不稳定，可以切换到 SSH：

1. **检查是否已有 SSH 密钥**：
```powershell
ls ~/.ssh
```

2. **如果没有，生成 SSH 密钥**：
```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

3. **添加 SSH 密钥到 GitHub**：
   - 复制公钥内容：`cat ~/.ssh/id_ed25519.pub`
   - 登录 GitHub → Settings → SSH and GPG keys → New SSH key
   - 粘贴公钥并保存

4. **更改远程 URL 为 SSH**：
```powershell
cd ai-trainer-backend
git remote set-url origin git@github.com:green1116/ai-trainer-backend.git
git push origin main
```

### 方案 3：配置 Git 代理（如果使用代理）

如果您的网络需要通过代理访问 GitHub：

```powershell
# 设置 HTTP 代理
git config --global http.proxy http://proxy.example.com:8080
git config --global https.proxy https://proxy.example.com:8080

# 或者只对 GitHub 设置代理
git config --global http.https://github.com.proxy http://proxy.example.com:8080

# 取消代理设置（如果需要）
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 方案 4：使用 GitHub CLI（gh）

如果常规 Git 推送失败，可以尝试使用 GitHub CLI：

```powershell
# 安装 GitHub CLI（如果未安装）
winget install GitHub.cli

# 登录
gh auth login

# 推送代码
cd ai-trainer-backend
git push origin main
```

### 方案 5：检查防火墙和 VPN

1. **检查防火墙设置**：确保允许 Git 和 PowerShell 访问网络
2. **检查 VPN**：如果使用 VPN，确保连接稳定
3. **尝试切换网络**：使用手机热点测试

### 方案 6：分步推送

如果文件较大，可以尝试分步推送：

```powershell
cd ai-trainer-backend

# 先推送最近的提交
git push origin main --verbose

# 如果还是失败，尝试强制推送（谨慎使用）
# git push origin main --force
```

## 快速诊断命令

```powershell
# 1. 检查网络连接
Test-NetConnection github.com -Port 443

# 2. 检查 Git 配置
cd ai-trainer-backend
git config --list | Select-String proxy
git remote -v

# 3. 检查 Git 版本
git --version

# 4. 测试 SSH 连接（如果使用 SSH）
ssh -T git@github.com
```

## 临时解决方案

如果急需部署，可以：

1. **直接在 Vercel 中连接 GitHub**：
   - 在 Vercel 项目设置中，可以手动触发部署
   - 或者直接在 Vercel 中编辑代码（不推荐）

2. **使用 GitHub Web 界面**：
   - 在 GitHub 网页上直接编辑文件并提交

3. **压缩文件上传**：
   - 将更改的文件打包，通过其他方式传输

## 推荐操作顺序

1. ✅ 先尝试增加超时时间（方案 1）
2. ✅ 如果还是失败，切换到 SSH（方案 2）
3. ✅ 检查代理设置（方案 3）
4. ✅ 最后考虑使用 GitHub CLI（方案 4）

## 验证推送成功

推送成功后，应该看到：
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Writing objects: 100% (X/X), done.
To https://github.com/green1116/ai-trainer-backend.git
   abc1234..def5678  main -> main
```

然后在 Vercel 中应该会自动触发新的部署。

