# Vercel DATABASE_URL 环境变量配置指南

## 问题诊断

健康检查端点 `/api/health` 返回的错误：
```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Environment variable not found: DATABASE_URL"
}
```

**根本原因：** Vercel 环境中缺少 `DATABASE_URL` 环境变量。

## 解决方案

### 步骤 1：获取数据库连接字符串

根据你的数据库类型，获取连接字符串：

#### PostgreSQL（推荐）
```
postgresql://用户名:密码@主机:端口/数据库名?schema=public
```

示例：
```
postgresql://postgres:mypassword@db.example.com:5432/ai_trainer?schema=public
```

#### MySQL
```
mysql://用户名:密码@主机:端口/数据库名
```

#### SQLite（不推荐用于生产环境）
```
file:./dev.db
```

### 步骤 2：在 Vercel 中配置环境变量

1. **登录 Vercel 控制台**
   - 访问 https://vercel.com
   - 登录你的账户

2. **进入项目设置**
   - 点击项目 "ai-trainer-backend"
   - 点击顶部导航栏的 "Settings"
   - 在左侧菜单选择 "Environment Variables"

3. **添加环境变量**
   - 点击 "Add New" 按钮
   - **Key**: `DATABASE_URL`
   - **Value**: 你的数据库连接字符串（从步骤 1 获取）
   - **Environment**: 选择所有环境（Production, Preview, Development）
   - 点击 "Save"

4. **重新部署**
   - 配置环境变量后，Vercel 不会自动重新部署
   - 需要手动触发重新部署：
     - 方法 1：推送一个新的提交到 GitHub
     - 方法 2：在 Deployments 页面点击 "Redeploy"

### 步骤 3：验证配置

1. **等待部署完成**
   - 部署完成后，访问健康检查端点：
   ```
   https://ai-trainer-backend-smoky.vercel.app/api/health
   ```

2. **检查响应**
   - 如果配置正确，应该返回：
   ```json
   {
     "status": "ok",
     "database": "connected",
     "counts": {
       "users": 0,
       "sessions": 0
     },
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

## 常见数据库服务配置

### Vercel Postgres（推荐）

如果你使用 Vercel Postgres：

1. **在 Vercel 中创建 Postgres 数据库**
   - 项目设置 → Storage → Create Database → Postgres
   - 创建后会自动配置 `POSTGRES_URL` 环境变量

2. **使用 Vercel Postgres 的连接字符串**
   - Vercel 会自动创建 `POSTGRES_URL` 环境变量
   - 你需要将其复制并设置为 `DATABASE_URL`
   - 或者修改代码使用 `POSTGRES_URL`

### Supabase

如果你使用 Supabase：

1. **获取连接字符串**
   - 登录 Supabase 控制台
   - 进入项目 → Settings → Database
   - 复制 "Connection string" 中的 "URI" 格式

2. **在 Vercel 中配置**
   - 将连接字符串设置为 `DATABASE_URL`

### Railway / Render / 其他云数据库

1. **获取连接字符串**
   - 从你的数据库服务提供商获取连接字符串
   - 格式通常是：`postgresql://user:password@host:port/database`

2. **在 Vercel 中配置**
   - 将连接字符串设置为 `DATABASE_URL`

## 安全注意事项

⚠️ **重要：**
- 不要在代码中硬编码数据库连接字符串
- 不要在 GitHub 仓库中提交 `.env` 文件
- 确保 `.env` 文件在 `.gitignore` 中
- 使用 Vercel 的环境变量功能管理敏感信息

## 故障排查

### 问题 1：环境变量已配置但仍报错

**可能原因：**
- 环境变量配置在错误的项目或环境中
- 需要重新部署才能生效

**解决方案：**
1. 确认环境变量配置在正确的项目中
2. 确认选择了所有环境（Production, Preview, Development）
3. 触发重新部署

### 问题 2：数据库连接超时

**可能原因：**
- 数据库服务器不允许来自 Vercel IP 的连接
- 防火墙设置阻止了连接

**解决方案：**
1. 检查数据库服务器的防火墙设置
2. 允许来自 Vercel IP 范围的连接
3. 或使用云数据库服务（如 Vercel Postgres、Supabase）

### 问题 3：连接字符串格式错误

**可能原因：**
- 连接字符串格式不正确
- 特殊字符未正确编码

**解决方案：**
1. 检查连接字符串格式
2. 确保密码中的特殊字符已正确 URL 编码
3. 使用数据库服务提供商提供的标准连接字符串

## 验证清单

- [ ] `DATABASE_URL` 环境变量已在 Vercel 中配置
- [ ] 环境变量值格式正确
- [ ] 已选择所有环境（Production, Preview, Development）
- [ ] 已触发重新部署
- [ ] `/api/health` 端点返回 `"database": "connected"`
- [ ] `/api/session` 端点不再返回 500 错误

## 相关文件

- `prisma/schema.prisma` - Prisma schema 配置
- `lib/db.ts` - 数据库客户端初始化
- `app/api/health/route.ts` - 健康检查端点
- `app/api/session/route.ts` - Session API 端点

## 下一步

1. 在 Vercel 中配置 `DATABASE_URL` 环境变量
2. 触发重新部署
3. 访问 `/api/health` 验证数据库连接
4. 访问 `/dashboard` 验证应用正常工作

