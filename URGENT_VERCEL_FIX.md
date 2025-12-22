# ⚠️ 紧急：Vercel 部署问题

## 问题

Vercel 持续部署旧提交 `67923ac`，而不是最新的修复提交 `34c7630`。

## 立即解决方案

### 方法 1：在 Vercel 中手动选择提交（最快）

1. **登录 Vercel** → 进入项目 `ai-trainer-backend`
2. **进入 Deployments 页面**
3. **查找提交 `34c7630` 或 `424fcaa` 的部署**（如果存在）
4. **点击该部署的 "..." 菜单**
5. **选择 "Promote to Production"**

### 方法 2：手动触发新部署

1. **在 Vercel Deployments 页面**
2. **点击 "Redeploy" 按钮**
3. **在弹出窗口中**：
   - **Git Branch**: 选择 `main`
   - **Git Commit**: 手动输入 `34c7630` 或选择最新提交
   - **取消勾选**: "Use existing Build Cache"
4. **点击 "Redeploy"**

### 方法 3：检查并修复 Vercel 项目设置

1. **Settings → Git**
   - 确认 **Production Branch** 是 `main`
   - 确认 **Auto-deploy** 已启用
   - 如果有 **Git Commit** 设置，清除它

2. **Settings → General**
   - 检查是否有 **Deployment Protection** 规则阻止了部署
   - 检查 **Build Command** 是否正确

### 方法 4：重新连接 GitHub 仓库

如果以上方法都不行：

1. **Settings → Git**
2. **点击 "Disconnect"** 断开连接
3. **重新连接 GitHub 仓库**
4. **选择正确的分支** (`main`)
5. **保存设置**

## 验证修复

部署成功后，构建日志应该显示：

```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: 34c7630)
```

**而不是**：

```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: 67923ac)
```

## 提交对比

| 提交 | 状态 | 说明 |
|------|------|------|
| `34c7630` | ✅ 最新 | 包含所有修复，无 `passwordHash` 错误 |
| `424fcaa` | ✅ 修复 | 包含所有修复，无 `passwordHash` 错误 |
| `026e316` | ✅ 修复 | 文档更新 |
| `4192cc5` | ✅ 修复 | 修复 Prisma schema 字段不匹配 |
| `67923ac` | ❌ 旧代码 | **包含 `passwordHash` 错误，不要部署** |

## 如果仍然失败

请联系 Vercel 支持，提供以下信息：

- 项目名称：`ai-trainer-backend`
- 问题：Vercel 持续部署旧提交 `67923ac` 而不是最新提交 `34c7630`
- GitHub 仓库：`green1116/ai-trainer-backend`
- 最新提交 SHA：`34c7630`

## 临时解决方案

如果急需部署，可以：

1. **创建新分支**：
   ```bash
   git checkout -b production-fix
   git push origin production-fix
   ```

2. **在 Vercel 中**：
   - Settings → Git
   - 将 Production Branch 临时改为 `production-fix`
   - 部署成功后改回 `main`

