import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { sessionId, hz } = await req.json()

  // 注意：Session 模型中不存在 avgHz 字段
  // avgHz 可以从 deviceData 或 samples 计算得出，不需要单独存储
  // 如果需要存储，可以考虑存储到 samples JSON 中或创建单独的 SessionMetrics 表
  // await db.session.update({
  //   where: { id: sessionId },
  //   data: { avgHz: hz }, // ❌ Session 模型中不存在此字段
  // })
  
  // TODO: 如果需要存储 avgHz，可以考虑：
  // 1. 将 avgHz 存储到 samples JSON 中
  // 2. 创建单独的 SessionMetrics 表
  // 3. 或者从 deviceData 实时计算

  return Response.json({ ok: true })
}

