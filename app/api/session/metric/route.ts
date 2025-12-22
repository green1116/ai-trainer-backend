import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { sessionId, hz } = await req.json()

  await db.session.update({
    where: { id: sessionId },
    data: { avgHz: hz },
  })

  return Response.json({ ok: true })
}

