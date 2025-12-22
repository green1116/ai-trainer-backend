# Vercel 部署问题 - 部署了旧提交

## 问题描述

Vercel 正在部署提交 `67923ac`（旧的、有错误的代码），而不是最新的修复提交 `424fcaa`。

## 当前状态

- ✅ **GitHub 上的代码是最新的**：提交 `424fcaa` 包含所有修复
- ❌ **Vercel 部署了旧提交**：提交 `67923ac` 仍然包含 `passwordHash` 错误

## 解决方案

### 方案 1：在 Vercel 中手动触发部署（推荐）

1. **登录 Vercel 控制台**
2. **进入项目**：`ai-trainer-backend`
3. **进入 Deployments 页面**
4. **点击 "Redeploy"** 或 **"Deploy"**
5. **确保选择正确的分支**：`main`
6. **取消勾选 "Use existing Build Cache"**
7. **点击 "Redeploy"**

### 方案 2：检查 Vercel 项目设置

1. **进入项目设置**：Settings → Git
2. **检查 Production Branch**：确保设置为 `main`
3. **检查 Auto-deploy**：确保已启用
4. **检查 Webhook**：确保 GitHub webhook 正常工作

### 方案 3：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 部署到生产环境
vercel --prod
```

### 方案 4：检查 GitHub Webhook

1. **在 GitHub 仓库中**：Settings → Webhooks
2. **找到 Vercel webhook**
3. **检查最近的事件**：确保 push 事件已触发
4. **如果失败，重新创建 webhook**

## 验证部署

部署成功后，检查构建日志应该显示：

```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: 424fcaa)
```

而不是：

```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: 67923ac)
```

## 提交历史

- `424fcaa` ✅ - 最新提交（包含修复）
- `026e316` ✅ - 文档更新
- `4192cc5` ✅ - 修复 Prisma schema 字段不匹配
- `67923ac` ❌ - 旧提交（包含错误代码）

## 临时解决方案

如果无法立即修复 Vercel 配置，可以：

1. **在 Vercel 中手动选择提交**：
   - 进入 Deployments 页面
   - 找到提交 `424fcaa` 的部署（如果存在）
   - 点击 "Promote to Production"

2. **创建新的分支并部署**：
   ```bash
   git checkout -b deploy-fix
   git push origin deploy-fix
   ```
   然后在 Vercel 中配置该分支为生产分支

## 参考

- [Vercel 部署文档](https://vercel.com/docs/concepts/deployments/overview)
- [Vercel GitHub 集成](https://vercel.com/docs/concepts/git)

