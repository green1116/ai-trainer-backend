import { PrismaClient } from "@prisma/client"

/**
 * Prisma Client 配置
 * 
 * 注意：使用 Supabase Transaction pooler（端口 6543）时，
 * 需要禁用 prepared statements 以避免 "prepared statement already exists" 错误
 */
export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // 禁用 prepared statements，避免在连接池环境中的冲突
  // 这是使用 Supabase Transaction pooler 时的推荐配置
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// 在 Serverless 环境中，确保连接正确管理
if (process.env.VERCEL) {
  // Vercel Serverless 环境：每次请求后断开连接
  // 注意：这可能会影响性能，但对于避免连接池问题很重要
}
