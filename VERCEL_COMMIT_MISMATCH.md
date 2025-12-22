# Vercel 提交不匹配问题 - 详细排查

## 问题确认

- ✅ **GitHub 最新提交**: `bbbc496` (刚刚推送)
- ✅ **GitHub 远程分支**: `34c763030b28ede456ca9719bcdaeb8e978dbd89`
- ❌ **Vercel 部署的提交**: `67923ac` (旧代码，包含错误)

## 可能的原因

### 1. Vercel 项目设置中指定了固定提交

**检查方法**：
1. Vercel → 项目设置 → **Settings** → **Git**
2. 查看是否有 **"Deploy only this commit"** 或类似的设置
3. 如果有，清除它或更新为最新提交 SHA

### 2. Vercel Webhook 未正确触发

**检查方法**：
1. GitHub → 仓库 → **Settings** → **Webhooks**
2. 找到 Vercel webhook
3. 查看 **Recent Deliveries**
4. 检查最新的 push 事件是否成功

**修复方法**：
- 如果 webhook 失败，点击 **"Redeliver"**
- 或者删除并重新创建 webhook

### 3. 多个 Vercel 项目

**检查方法**：
1. Vercel Dashboard → 查看所有项目
2. 确认只有一个 `ai-trainer-backend` 项目
3. 如果有多个，检查哪个是生产环境

### 4. Vercel 项目连接了错误的分支或仓库

**检查方法**：
1. Vercel → 项目设置 → **Settings** → **Git**
2. 确认：
   - **Repository**: `green1116/ai-trainer-backend`
   - **Production Branch**: `main`
   - **Root Directory**: (应该是空的或 `./`)

## 立即解决方案

### 方案 A：手动触发部署（推荐）

1. **Vercel Dashboard** → 项目 `ai-trainer-backend`
2. **Deployments** 页面
3. **点击 "Redeploy"**
4. **在弹出窗口中**：
   ```
   Git Branch: main
   Git Commit: bbbc496 (或手动输入完整 SHA)
   Use existing Build Cache: ❌ (取消勾选)
   ```
5. **点击 "Redeploy"**

### 方案 B：通过 Vercel API 触发

```bash
# 需要 Vercel API Token
curl -X POST \
  "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ai-trainer-backend",
    "gitSource": {
      "type": "github",
      "repo": "green1116/ai-trainer-backend",
      "ref": "bbbc496"
    }
  }'
```

### 方案 C：重新连接 GitHub 仓库

1. **Vercel** → 项目设置 → **Settings** → **Git**
2. **点击 "Disconnect"**
3. **重新连接** GitHub 仓库
4. **选择分支**: `main`
5. **保存设置**

## 验证步骤

部署成功后，检查构建日志：

**应该看到**：
```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: bbbc496)
```

**不应该看到**：
```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: 67923ac)
```

## 提交历史参考

| 提交 SHA | 状态 | 说明 |
|----------|------|------|
| `bbbc496` | ✅ 最新 | 刚刚推送，包含修复 |
| `34c7630` | ✅ 修复 | 包含所有修复 |
| `424fcaa` | ✅ 修复 | 包含所有修复 |
| `026e316` | ✅ 修复 | 文档更新 |
| `4192cc5` | ✅ 修复 | 修复 Prisma schema |
| `67923ac` | ❌ **旧代码** | **包含 passwordHash 错误** |

## 如果仍然失败

1. **检查 Vercel 项目 ID**：
   - 在 Vercel Dashboard 中查看项目 URL
   - 确认项目名称和 ID 正确

2. **联系 Vercel 支持**：
   - 提供项目名称：`ai-trainer-backend`
   - 提供问题：持续部署旧提交 `67923ac`
   - 提供最新提交：`bbbc496`
   - 提供 GitHub 仓库：`green1116/ai-trainer-backend`

3. **临时解决方案**：
   - 创建新分支 `production` 并推送最新代码
   - 在 Vercel 中将 Production Branch 改为 `production`
   - 部署成功后改回 `main`

## 当前状态

- ✅ 代码已修复并推送到 GitHub
- ✅ 最新提交：`bbbc496`
- ⏳ 等待 Vercel 检测新提交或手动触发部署

