import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { mailboxes } from '@/db/schema'
import { getSessionWithMailbox } from '@/lib/session'
import { assignMailboxSchema } from '@/lib/schemas'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = assignMailboxSchema.safeParse(await req.json())
  if (!body.success) return Response.json({ error: body.error.flatten() }, { status: 400 })

  await db
    .insert(mailboxes)
    .values({ userId: params.id, address: body.data.address })
    .onConflictDoUpdate({ target: mailboxes.userId, set: { address: body.data.address } })

  return Response.json({ ok: true })
}
