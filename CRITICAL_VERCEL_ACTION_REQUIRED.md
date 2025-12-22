# 🚨 紧急：必须在 Vercel 中手动操作

## 问题

Vercel **持续部署错误的旧提交 `bbbc496`**，导致构建失败。

## 当前状态

- ✅ **GitHub 最新提交**: `c27de75` (包含所有修复)
- ✅ **代码已修复**: 所有 Prisma Json 字段过滤错误已修复
- ❌ **Vercel 部署**: 仍在部署旧提交 `bbbc496` (包含错误)

## ⚠️ 必须立即操作

### 步骤 1：在 Vercel 中手动选择正确提交

1. **登录 Vercel** → https://vercel.com
2. **进入项目**: `ai-trainer-backend`
3. **点击 "Deployments" 标签**
4. **点击 "Redeploy" 按钮**（右上角）
5. **在弹出窗口中**：
   - **Git Branch**: 选择 `main`
   - **Git Commit**: **手动输入** `c27de75` 或 `d859a25`
   - ⚠️ **不要使用默认的 `bbbc496`！**
   - **Use existing Build Cache**: ❌ **取消勾选**
6. **点击 "Redeploy"**

### 步骤 2：验证部署

部署成功后，构建日志**第一行**应显示：

```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: c27de75)
```

**或**

```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: d859a25)
```

**❌ 如果看到 `bbbc496`，说明部署了错误的提交！**

## 提交对比

| 提交 SHA | 状态 | 代码状态 |
|----------|------|----------|
| `c27de75` | ✅ **最新** | 所有错误已修复 |
| `d859a25` | ✅ 修复 | 所有错误已修复 |
| `dfde7d4` | ✅ 修复 | Prisma Json 过滤已修复 |
| `bbbc496` | ❌ **错误** | 包含 `samples: { not: null }` 错误 |

## 为什么会出现这个问题？

可能的原因：
1. Vercel 项目设置中可能指定了固定提交
2. Vercel webhook 没有正确触发
3. 手动触发了旧提交的部署

## 检查 Vercel 项目设置

1. **Settings** → **Git**
   - 检查是否有 "Deploy only this commit" 设置
   - 如果有，清除它
   - 确认 **Production Branch** 是 `main`

2. **Settings** → **General**
   - 检查是否有 Deployment Protection 规则

## 如果仍然失败

1. **断开并重新连接 GitHub 仓库**：
   - Settings → Git → Disconnect
   - 重新连接，选择 `main` 分支

2. **联系 Vercel 支持**：
   - 提供项目名称：`ai-trainer-backend`
   - 说明问题：持续部署旧提交 `bbbc496`
   - 提供最新提交：`c27de75`

## 重要提示

**不要依赖自动部署！** 必须手动在 Vercel 中选择正确的提交 `c27de75` 或 `d859a25`。

