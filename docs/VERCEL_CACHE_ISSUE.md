# Vercel 构建缓存问题

## 问题描述

即使代码已经修复并推送到 GitHub，Vercel 构建日志仍然显示旧的错误。这通常是由于：

1. **构建缓存**：Vercel 可能使用了缓存的构建结果
2. **部署了旧提交**：Vercel 可能部署了错误的提交
3. **增量构建**：Turbopack 的增量构建可能使用了旧的缓存

## 解决方案

### 方案 1：清除 Vercel 构建缓存（推荐）

1. 登录 Vercel 控制台
2. 进入项目设置：**Settings** → **General**
3. 滚动到底部，找到 **Clear Build Cache**
4. 点击 **Clear** 清除缓存
5. 重新部署项目

### 方案 2：手动触发重新部署

1. 在 Vercel 部署页面
2. 找到最新的部署
3. 点击 **...** → **Redeploy**
4. 选择 **Use existing Build Cache** 为 **No**（清除缓存）
5. 点击 **Redeploy**

### 方案 3：通过 Git 触发

创建一个空提交来强制触发新的部署：

```bash
git commit --allow-empty -m "chore: 触发 Vercel 重新部署"
git push origin main
```

### 方案 4：检查部署的提交

在 Vercel 部署页面，确认部署使用的是最新的提交（`18e1a63` 或更新）。

如果部署使用的是旧提交（如 `d4f6444`），需要：
1. 确认所有更改已推送到 GitHub
2. 手动触发重新部署
3. 或等待 Vercel 自动检测到新提交

## 验证修复

部署成功后，检查构建日志应该显示：

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

而不是之前的错误：
```
✗ Export prisma doesn't exist in target module
```

## 预防措施

### 1. 使用明确的提交信息

```bash
git commit -m "fix: 修复 lib/auth.ts 中的导入错误"
```

### 2. 验证本地构建

在推送前，确保本地构建成功：

```bash
npm run build
```

### 3. 检查 Git 历史

确保修复已正确提交：

```bash
git log --oneline -5
git show HEAD:lib/auth.ts | grep "import.*db"
```

## 当前状态

✅ **代码已修复**：
- `lib/auth.ts` 使用 `import { db } from "./db"`
- 所有 `prisma` 引用已改为 `db`
- 字段选择已更新为正确的 Prisma schema 字段

✅ **已推送到 GitHub**：
- 提交 `18e1a63`: "fix: 修复部署构建错误"

⏳ **等待 Vercel 重新部署**：
- 已创建空提交触发新部署
- 或需要在 Vercel 中手动清除缓存并重新部署

## 参考

- [Vercel 构建缓存文档](https://vercel.com/docs/concepts/builds/build-cache)
- [Vercel 重新部署指南](https://vercel.com/docs/concepts/deployments/redeploy)

