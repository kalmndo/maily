import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { emails, attachments } from '@/db/schema'
import { getSessionWithMailbox } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.mailboxAddress) return Response.json({ error: 'No mailbox' }, { status: 404 })

  const email = await db.query.emails.findFirst({
    where: and(eq(emails.id, params.id), eq(emails.toEmail, ctx.mailboxAddress)),
  })

  if (!email) return Response.json({ error: 'Not found' }, { status: 404 })

  const emailAttachments = await db.query.attachments.findMany({
    where: eq(attachments.emailId, params.id),
  })

  await db.update(emails).set({ read: true }).where(eq(emails.id, params.id))

  return Response.json({ ...email, attachments: emailAttachments })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.mailboxAddress) return Response.json({ error: 'No mailbox' }, { status: 404 })

  await db
    .update(emails)
    .set({ label: 'trash' })
    .where(and(eq(emails.id, params.id), eq(emails.toEmail, ctx.mailboxAddress)))

  return Response.json({ ok: true })
}
