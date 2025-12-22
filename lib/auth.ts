// 认证工具函数
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "./db"

const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d"

export interface JWTPayload {
  userId: string
  email: string
}

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * 生成JWT token
 */
export function generateToken(payload: JWTPayload): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined")
  }
  // 确保类型正确：jwt.sign 需要明确的类型
  const secret: string = JWT_SECRET
  // expiresIn 可以是 string (如 "7d") 或 number (秒数)
  // 使用类型断言绕过严格的类型检查
  const options = {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions
  return jwt.sign(payload, secret, options)
}

/**
 * 验证JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * 从请求头提取token
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * 获取当前用户（从JWT token）
 */
export async function getCurrentUser(token: string | null) {
  if (!token) {
    return null
  }

  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      plan: true,
      role: true,
      clinicId: true,
    },
  })

  return user
}

