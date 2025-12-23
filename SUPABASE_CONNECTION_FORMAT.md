# Supabase 连接字符串格式说明

## ✅ 正确的 Transaction Pooler 连接字符串格式

根据 Supabase 官方文档，Vercel Serverless 环境应该使用 **Transaction pooler**（端口 6543）。

### 正确格式

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres
```

### 格式说明

1. **用户名**: `postgres`（固定，不是 `postgres.[project-ref]`）
2. **密码**: `[YOUR-PASSWORD]`（你的数据库密码）
3. **主机名**: `db.[PROJECT-REF].supabase.co`（不是 `aws-1-sa-east-1.pooler.supabase.com`）
4. **端口**: `6543`（Transaction pooler 端口）
5. **数据库名**: `postgres`（固定）

### 你的项目信息

- **Project Ref**: `ekbvfceghenqnttosztr`
- **Password**: `9c1nx0QxT0Nx9fql`

### 正确的连接字符串

```
postgresql://postgres:9c1nx0QxT0Nx9fql@db.ekbvfceghenqnttosztr.supabase.co:6543/postgres
```

## ❌ 错误的格式

### 错误 1：使用 pooler 主机名
```
postgresql://postgres.ekbvfceghenqnttosztr:9c1nx0QxT0Nx9fql@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
```
**问题**: 
- 用户名应该是 `postgres`，不是 `postgres.ekbvfceghenqnttosztr`
- 主机名应该是 `db.ekbvfceghenqnttosztr.supabase.co`，不是 `aws-1-sa-east-1.pooler.supabase.com`

### 错误 2：使用直接连接（端口 5432）
```
postgresql://postgres:9c1nx0QxT0Nx9fql@db.ekbvfceghenqnttosztr.supabase.co:5432/postgres
```
**问题**: 
- Vercel Serverless 环境不应该使用直接连接（端口 5432）
- 应该使用 Transaction pooler（端口 6543）

## 📋 在 Supabase 控制台获取正确连接字符串

1. 登录 Supabase 控制台
2. 进入 **Settings** → **Database**
3. 在 **Connection string** 部分：
   - **Type**: 选择 `URI`
   - **Source**: 选择 `Primary Database`
   - **Method**: 选择 `Transaction pooler` ⚠️ **非常重要**
4. 复制连接字符串，格式应该是：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.ekbvfceghenqnttosztr.supabase.co:6543/postgres
   ```

## 🔧 更新配置

### 本地开发（.env）

迁移时可以使用直接连接（端口 5432）：
```
DATABASE_URL="postgresql://postgres:9c1nx0QxT0Nx9fql@db.ekbvfceghenqnttosztr.supabase.co:5432/postgres"
```

### Vercel 生产环境

必须使用 Transaction pooler（端口 6543）：
```
DATABASE_URL="postgresql://postgres:9c1nx0QxT0Nx9fql@db.ekbvfceghenqnttosztr.supabase.co:6543/postgres"
```

## ⚠️ 重要提示

1. **Vercel Serverless 必须使用 Transaction pooler（端口 6543）**
2. **不要使用 `aws-1-sa-east-1.pooler.supabase.com` 格式的主机名**
3. **用户名是 `postgres`，不是 `postgres.[project-ref]`**
4. **主机名格式：`db.[project-ref].supabase.co`**

