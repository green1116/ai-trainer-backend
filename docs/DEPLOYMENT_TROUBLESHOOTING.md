# Vercel 部署问题排查

## 根据构建日志排查问题

### 1. 检查构建日志中的错误

在 Vercel 部署页面，查看 **Build Logs** 部分：

#### 错误类型识别

**红色标记 (x 3)**：表示构建错误
- 通常是 TypeScript 编译错误
- 依赖安装失败
- 配置文件错误

**黄色标记 (Δ 1)**：表示警告
- 通常是弃用警告（如 `node-domexception@1.0.0`）
- 不影响构建，但建议更新依赖

### 2. 常见错误及解决方案

#### 错误：`@prisma/client did not initialize yet`

**原因**：Prisma Client 未在构建时生成

**解决方案**：
✅ 已更新 `package.json`，添加了 `postinstall: "prisma generate"`

如果仍有问题，检查：
- `prisma/schema.prisma` 文件是否存在
- `DATABASE_URL` 环境变量是否设置（Prisma 需要它来生成客户端）

#### 错误：`Cannot find module 'xxx'`

**原因**：依赖未安装或版本不匹配

**解决方案**：
1. 检查 `package.json` 中的依赖是否正确
2. 在本地运行 `npm install` 验证
3. 检查 `package-lock.json` 是否提交到 Git

#### 错误：`Type error: Property 'xxx' does not exist`

**原因**：TypeScript 类型错误

**解决方案**：
1. 检查类型定义文件
2. 运行 `npm run lint` 查看详细错误
3. 如果暂时无法修复，可以在 `next.config.js` 中临时忽略（不推荐）：

```javascript
typescript: {
  ignoreBuildErrors: true, // 仅用于临时修复
}
```

#### 错误：`Build timeout`

**原因**：构建时间超过 Vercel 限制（默认 45 分钟）

**解决方案**：
1. 优化依赖安装（使用 `npm ci`）
2. 减少不必要的依赖
3. 检查是否有大型文件被包含

#### 警告：`npm warn deprecated node-domexception@1.0.0`

**原因**：依赖使用了已弃用的包

**解决方案**：
- 这是警告，不影响构建
- 可以更新相关依赖到最新版本
- 通常可以忽略

### 3. 环境变量相关错误

#### 错误：`process.env.DATABASE_URL is undefined`

**解决方案**：
1. 在 Vercel 项目设置中添加 `DATABASE_URL`
2. 确保为正确的环境设置（Production/Preview）
3. 重新部署

#### 错误：`JWT_SECRET is not set`

**解决方案**：
1. 在 Vercel 项目设置中添加 `JWT_SECRET`
2. 使用至少 32 字符的随机字符串
3. 重新部署

### 4. 数据库相关错误

#### 错误：`Can't reach database server`

**解决方案**：
1. 检查 `DATABASE_URL` 格式是否正确
2. 如果使用外部数据库，确保允许 Vercel IP 访问
3. 推荐使用 Vercel Postgres（自动处理连接）

#### 错误：`Migration failed`

**解决方案**：
1. 确保 `prisma/migrations` 目录已提交到 Git
2. 在构建命令中包含迁移：

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**注意**：`prisma migrate deploy` 仅在生产环境运行，不会创建新的迁移。

### 5. 构建成功但运行时错误

#### API 返回 500 错误

**排查步骤**：
1. 查看 Vercel 函数日志（**Logs** 标签）
2. 检查环境变量是否设置
3. 验证数据库连接
4. 检查 API 路由代码

#### 页面无法加载

**排查步骤**：
1. 检查 `next.config.js` 配置
2. 查看浏览器控制台错误
3. 检查 Vercel 函数日志

## 调试技巧

### 1. 查看详细日志

在 Vercel 部署页面：
- **Build Logs**：查看构建过程
- **Function Logs**：查看运行时日志
- **Analytics**：查看性能指标

### 2. 本地验证

在部署前，本地验证构建：

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 构建项目
npm run build

# 启动生产服务器
npm start
```

### 3. 检查环境变量

在代码中临时添加日志（部署后删除）：

```typescript
// 仅在开发环境输出
if (process.env.NODE_ENV === 'development') {
  console.log('Environment check:', {
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET,
    llmProvider: process.env.LLM_PROVIDER || 'mock',
  });
}
```

### 4. 使用 Vercel CLI 本地调试

```bash
# 安装 Vercel CLI
npm i -g vercel

# 链接项目
vercel link

# 拉取环境变量
vercel env pull .env.local

# 本地运行（使用 Vercel 环境）
vercel dev
```

## 部署最佳实践

### 1. 分阶段部署

1. **Preview 环境**：先部署到 Preview，验证功能
2. **Production 环境**：确认无误后部署到 Production

### 2. 环境变量管理

- 为每个环境（Production, Preview, Development）分别设置
- 使用不同的密钥和数据库（如果可能）
- 定期轮换密钥

### 3. 监控和告警

- 设置 Vercel 告警
- 监控错误率
- 跟踪性能指标

### 4. 回滚策略

如果部署失败：
1. 在 Vercel 部署页面找到上一个成功的部署
2. 点击 **...** → **Promote to Production**

## 获取帮助

如果问题仍然存在：

1. **查看 Vercel 文档**：
   - [Next.js 部署](https://vercel.com/docs/frameworks/nextjs)
   - [环境变量](https://vercel.com/docs/concepts/projects/environment-variables)

2. **检查项目文档**：
   - `docs/VERCEL_DEPLOYMENT.md` - 完整部署指南
   - `VERCEL_ENV_SETUP.md` - 环境变量设置

3. **Vercel 支持**：
   - 在 Vercel 项目页面点击 **Support**
   - 提供构建日志和错误信息

## 快速检查清单

部署前检查：
- [ ] 本地 `npm run build` 成功
- [ ] 所有环境变量已设置
- [ ] `package.json` 包含 `postinstall` 脚本
- [ ] Prisma schema 已更新
- [ ] 数据库迁移已运行
- [ ] `next.config.js` 配置正确

部署后检查：
- [ ] 构建日志无错误
- [ ] 函数日志无运行时错误
- [ ] API 端点响应正常
- [ ] 数据库连接正常
- [ ] 环境变量已生效

