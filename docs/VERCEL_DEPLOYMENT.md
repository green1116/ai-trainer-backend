# Vercel 部署指南

## 概述

本文档说明如何将 `ai-trainer-backend` 部署到 Vercel，包括环境变量配置、构建设置和常见问题。

## 必需的环境变量

在 Vercel 项目设置中配置以下环境变量：

### 数据库配置

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

**重要**：Vercel 支持多种数据库服务：
- Vercel Postgres（推荐，与 Vercel 集成）
- Supabase
- Neon
- Railway
- 其他 PostgreSQL 服务

### 认证配置

```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d  # 可选，默认 7d
```

### LLM 配置（可选）

如果使用 AI 功能，需要配置以下之一：

**使用 OpenAI：**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

**使用 OpenRouter：**
```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_HTTP_REFERER=https://your-domain.com  # 可选
```

**使用 Mock（默认，无需配置）：**
```bash
# 不设置 LLM_PROVIDER 或设置为 'mock'
# 将使用模拟数据，不调用真实 API
```

## Vercel 项目设置

### 1. 构建配置

在 Vercel 项目设置中，确保：

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`（默认）
- **Output Directory**: `.next`（默认）
- **Install Command**: `npm install`（默认）

### 2. 环境变量设置

1. 进入 Vercel 项目设置
2. 导航到 **Settings** → **Environment Variables**
3. 添加上述所有必需的环境变量
4. 为每个环境（Production, Preview, Development）分别设置

### 3. 数据库迁移

部署前需要运行 Prisma 迁移：

**选项 A：在 Vercel Build Command 中自动运行**

修改 `package.json` 的 `build` 脚本：

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**选项 B：手动运行迁移**

在部署后，通过 Vercel CLI 或数据库管理界面运行：

```bash
npx prisma migrate deploy
```

### 4. Prisma 生成

确保在构建时生成 Prisma Client。在 `package.json` 中添加 `postinstall` 脚本：

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

## 构建配置优化

### next.config.js

当前配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname),
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:6001'],
    },
  },
}
```

**建议更新**：为生产环境添加域名：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname),
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:6001',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        process.env.NEXT_PUBLIC_APP_URL || '',
      ].filter(Boolean),
    },
  },
}
```

## 常见构建问题

### 1. Prisma Client 未生成

**错误**：`@prisma/client did not initialize yet`

**解决方案**：
- 确保 `package.json` 中有 `postinstall: "prisma generate"`
- 或在 `build` 脚本中添加 `prisma generate`

### 2. 数据库连接失败

**错误**：`Can't reach database server`

**解决方案**：
- 检查 `DATABASE_URL` 是否正确设置
- 确保数据库允许 Vercel IP 访问（如果使用外部数据库）
- 检查数据库服务是否运行

### 3. 环境变量未找到

**错误**：`process.env.XXX is undefined`

**解决方案**：
- 在 Vercel 项目设置中添加所有必需的环境变量
- 确保为正确的环境（Production/Preview/Development）设置
- 重新部署以应用新的环境变量

### 4. 构建超时

**错误**：Build timeout

**解决方案**：
- 优化依赖安装（使用 `npm ci` 而不是 `npm install`）
- 减少不必要的依赖
- 检查是否有大型文件被包含在构建中

### 5. TypeScript 错误

**错误**：TypeScript compilation errors

**解决方案**：
- 检查 `tsconfig.json` 配置
- 确保所有类型定义正确
- 如果暂时无法修复，可以在 `next.config.js` 中添加：

```javascript
typescript: {
  ignoreBuildErrors: true, // 仅用于临时修复
}
```

**注意**：不推荐在生产环境中忽略构建错误。

## 部署检查清单

- [ ] 所有环境变量已配置
- [ ] 数据库连接字符串正确
- [ ] Prisma 迁移已运行
- [ ] `package.json` 包含 `postinstall` 脚本
- [ ] `next.config.js` 配置正确
- [ ] 构建命令正确
- [ ] 测试部署到 Preview 环境
- [ ] 验证 API 端点正常工作
- [ ] 检查日志是否有错误

## 部署后验证

### 1. 检查健康状态

访问部署的根路径，应该看到 Next.js 应用。

### 2. 测试 API 端点

```bash
# 测试设备能力 API
curl https://your-domain.vercel.app/api/device/FN-VIB-2025/capability

# 测试设备命令 API（需要认证）
curl -X POST https://your-domain.vercel.app/api/device/command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "start", "params": {"frequencyHz": 30}}'
```

### 3. 检查数据库连接

查看 Vercel 函数日志，确认数据库连接正常。

### 4. 检查环境变量

在 Vercel 函数中，可以通过日志输出验证环境变量（仅用于调试）：

```typescript
console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
```

## 推荐配置

### package.json 脚本

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && prisma migrate deploy && next build",
    "dev": "next dev -p 6001",
    "start": "next start"
  }
}
```

### .vercelignore（可选）

如果某些文件不需要部署，可以创建 `.vercelignore`：

```
node_modules
.next
.env.local
.env*.local
*.log
.DS_Store
```

## 参考资源

- [Vercel Next.js 文档](https://vercel.com/docs/frameworks/nextjs)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)

