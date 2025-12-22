# Vercel 环境变量快速设置指南

## 必需的环境变量

在 Vercel 项目设置中（Settings → Environment Variables），添加以下变量：

### 1. 数据库（必需）

```
DATABASE_URL=postgresql://user:password@host:port/database
```

**推荐使用 Vercel Postgres**：
1. 在 Vercel 项目页面，点击 **Storage** 标签
2. 创建 **Postgres** 数据库
3. 会自动添加 `DATABASE_URL` 环境变量

### 2. 认证（必需）

```
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

**生成安全的 JWT Secret**：
```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. LLM 配置（可选）

**选项 A：使用 Mock（默认，无需配置）**
- 不设置任何 LLM 相关环境变量
- 将使用模拟数据

**选项 B：使用 OpenAI**
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

**选项 C：使用 OpenRouter**
```
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_HTTP_REFERER=https://your-domain.vercel.app
```

## 设置步骤

1. **登录 Vercel** → 选择项目 `ai-trainer-backend`

2. **进入设置** → **Settings** → **Environment Variables**

3. **添加变量**：
   - 点击 **Add New**
   - 输入变量名和值
   - 选择环境（Production, Preview, Development）
   - 点击 **Save**

4. **重新部署**：
   - 环境变量更改后，需要重新部署才能生效
   - 在 **Deployments** 页面，点击最新部署的 **...** → **Redeploy**

## 验证环境变量

部署后，可以通过 API 端点验证（仅用于调试）：

```bash
# 检查环境变量是否设置（不显示敏感值）
curl https://your-domain.vercel.app/api/health
```

或在代码中临时添加（部署后删除）：

```typescript
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER || 'mock');
```

## 常见问题

### Q: 数据库连接失败
**A**: 
- 检查 `DATABASE_URL` 格式是否正确
- 确保数据库允许 Vercel IP 访问（如果使用外部数据库）
- 使用 Vercel Postgres 可以自动处理连接

### Q: Prisma Client 未生成
**A**: 
- 已更新 `package.json`，包含 `postinstall: "prisma generate"`
- 如果仍有问题，检查构建日志

### Q: 环境变量未生效
**A**: 
- 环境变量更改后必须重新部署
- 确保为正确的环境（Production/Preview）设置
- 检查变量名拼写是否正确

## 部署检查清单

- [ ] `DATABASE_URL` 已设置
- [ ] `JWT_SECRET` 已设置（至少 32 字符）
- [ ] LLM 相关变量已设置（如果使用 AI 功能）
- [ ] 所有变量都选择了正确的环境
- [ ] 已重新部署以应用新变量
- [ ] 检查部署日志确认无错误

