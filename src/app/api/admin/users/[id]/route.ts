import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { mailboxes } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getSessionWithMailbox } from '@/lib/session'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await auth.api.removeUser({ headers: req.headers, body: { userId: id } })
  await db.delete(mailboxes).where(eq(mailboxes.userId, id))

  return Response.json({ ok: true })
}
