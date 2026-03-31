import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { mailboxes } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getSessionWithMailbox } from '@/lib/session'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  await auth.api.removeUser({ headers: req.headers, body: { userId: params.id } })
  await db.delete(mailboxes).where(eq(mailboxes.userId, params.id))

  return Response.json({ ok: true })
}
