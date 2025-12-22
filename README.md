# AI Trainer Backend

生产级震动训练系统后端API，使用 Next.js 和 Prisma。

## 技术栈

- **Next.js 16** - React框架
- **Prisma** - ORM数据库工具
- **PostgreSQL** - 数据库
- **TypeScript** - 类型安全
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **Zod** - 数据验证

## 项目结构

```
ai-trainer-backend/
├─ app/
│  ├─ api/              # API路由
│  │  ├─ auth/          # 认证API
│  │  ├─ device/        # 设备API
│  │  ├─ session/       # 会话API
│  │  └─ report/        # 报告API
│  └─ layout.tsx        # 根布局
├─ prisma/
│  └─ schema.prisma     # 数据库模式
├─ lib/
│  ├─ db.ts            # 数据库连接
│  └─ auth.ts          # 认证工具
└─ package.json
```

## 安装

```bash
# 安装依赖
npm install

# 生成Prisma客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 或直接推送schema（开发环境）
npm run db:push
```

## 配置

1. 复制 `.env.example` 为 `.env`
2. 配置数据库连接字符串
3. 设置JWT密钥
4. 配置OpenAI API密钥（如需要）

## 运行

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

## API端点

### 认证
- `POST /api/auth` - 登录
- `PUT /api/auth` - 注册

### 设备
- `GET /api/device` - 获取设备列表
- `POST /api/device` - 注册设备

### 会话
- `GET /api/session` - 获取会话列表
- `POST /api/session/start` - 开始会话
- `PATCH /api/session/:id/stop` - 停止会话

### 报告
- `GET /api/report/:sessionId` - 获取报告（JSON或PDF）

## 数据库管理

```bash
# 打开Prisma Studio（数据库GUI）
npm run db:studio

# 创建迁移
npm run db:migrate

# 重置数据库（开发环境）
npx prisma migrate reset
```

## 环境变量

### 数据库和认证
- `DATABASE_URL` - PostgreSQL连接字符串
- `JWT_SECRET` - JWT密钥
- `JWT_EXPIRES_IN` - Token过期时间

### LLM Provider 配置
- `LLM_PROVIDER` - LLM Provider 类型（默认: `mock`）
  - `mock` - Mock Provider（无需 API Key，当前使用）
  - `openrouter` - OpenRouter Provider（需要 API Key）
  - `openai` - OpenAI Provider（需要 API Key）

**当前配置（在 `.env` 文件中）：**
```env
LLM_PROVIDER=mock
```

✅ **现在完全不需要 OpenAI / OpenRouter Key**

详细配置说明请参考 [LLM_CONFIG.md](./LLM_CONFIG.md)

## 开发

### 添加新的API路由

1. 在 `app/api/` 下创建新目录
2. 创建 `route.ts` 文件
3. 导出 `GET`, `POST`, `PATCH`, `DELETE` 等函数

### 数据库变更

1. 修改 `prisma/schema.prisma`
2. 运行 `npm run db:migrate` 创建迁移
3. 运行 `npm run db:generate` 更新客户端

## 许可证

MIT

