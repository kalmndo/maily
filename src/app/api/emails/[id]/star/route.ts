import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { emails } from '@/db/schema'
import { getSessionWithMailbox } from '@/lib/session'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.mailboxAddress) return Response.json({ error: 'No mailbox' }, { status: 404 })

  const email = await db.query.emails.findFirst({
    where: and(eq(emails.id, params.id), eq(emails.toEmail, ctx.mailboxAddress)),
  })

  if (!email) return Response.json({ error: 'Not found' }, { status: 404 })

  await db
    .update(emails)
    .set({ starred: !email.starred })
    .where(eq(emails.id, params.id))

  return Response.json({ starred: !email.starred })
}
