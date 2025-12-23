# Supabase 配置步骤

## 📋 快速配置指南

### 步骤 1：获取 Supabase 连接字符串

1. 访问 https://supabase.com 并登录
2. 选择你的项目（或创建新项目）
3. 进入 **Settings** → **Database**
4. 在 **Connection string** 部分，选择 **URI** 标签
5. 复制连接字符串（使用直接连接，端口 5432）

**连接字符串格式：**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### 步骤 2：更新 .env 文件

打开 `ai-trainer-backend/.env` 文件，将 `DATABASE_URL` 更新为你的 Supabase 连接字符串：

```bash
DATABASE_URL="你的 Supabase 连接字符串（端口 5432）"
```

**重要：**
- 使用直接连接（端口 5432）用于迁移
- 确保密码中的特殊字符已正确 URL 编码

### 步骤 3：运行迁移

更新 `.env` 后，运行以下命令：

```bash
cd ai-trainer-backend
npx prisma migrate deploy
```

### 步骤 4：验证连接

```bash
# 测试数据库连接
npx prisma db pull

# 查看数据库结构
npx prisma studio
```

## 🔄 配置完成后告诉我

更新 `.env` 文件并运行迁移后，告诉我结果，我会帮你：
1. 验证迁移是否成功
2. 配置 Vercel 环境变量
3. 测试生产环境连接

## 📝 示例

如果你的 Supabase 连接字符串是：
```
postgresql://postgres.abcdefghijklmnop:mypassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

那么在 `.env` 文件中应该是：
```bash
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:mypassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

## ⚠️ 注意事项

1. **不要提交 `.env` 文件到 Git**
2. **迁移时使用端口 5432**（直接连接）
3. **生产环境使用端口 6543**（连接池，带 `?pgbouncer=true`）

