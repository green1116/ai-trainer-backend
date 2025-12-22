# ⚠️ Vercel 部署问题 - 必须手动操作

## 问题总结

Vercel **持续部署错误的旧提交 `bbbc496`**，导致构建失败。

## 根本原因

提交 `bbbc496` 包含错误的代码：
```typescript
samples: { not: null }  // ❌ 错误：Prisma Json 字段不能这样过滤
```

## 解决方案

### ✅ 正确的提交

以下提交包含所有修复，**必须部署这些提交之一**：

- `b69f3c7` - 最新（刚刚推送）
- `c27de75` - 包含所有修复
- `d859a25` - 包含所有修复
- `dfde7d4` - 包含所有修复

### ❌ 错误的提交

**不要部署**：
- `bbbc496` - 包含 `samples: { not: null }` 错误

## 立即操作步骤

### 在 Vercel 控制台中：

1. **登录 Vercel** → 项目 `ai-trainer-backend`
2. **Deployments 页面**
3. **点击 "Redeploy"**
4. **在弹出窗口中**：
   ```
   Git Branch: main
   Git Commit: b69f3c7  ← 手动输入这个！
   Use existing Build Cache: ❌ (取消勾选)
   ```
5. **点击 "Redeploy"**

## 验证

部署成功后，构建日志**第一行**应显示：

```
Cloning github.com/green1116/ai-trainer-backend (Branch: main, Commit: b69f3c7)
```

**如果看到 `bbbc496`，说明部署了错误的提交！**

## 为什么一直部署 `bbbc496`？

可能的原因：
1. 在 Vercel 中手动触发了该提交的部署
2. Vercel 项目设置中可能指定了该提交
3. Vercel webhook 配置问题

## 检查 Vercel 设置

1. **Settings → Git**
   - 检查是否有 "Deploy only this commit" 设置
   - 如果有，清除它
   - 确认 Production Branch 是 `main`

2. **检查最近的部署**
   - 查看是否有人手动触发了 `bbbc496` 的部署
   - 如果是，停止该部署并使用正确的提交重新部署

## 重要提示

**每次部署时，必须手动选择正确的提交 SHA！**

不要依赖自动部署，因为 Vercel 可能仍然会部署错误的提交。

