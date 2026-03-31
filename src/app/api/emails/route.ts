import { NextRequest } from 'next/server'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/db'
import { emails, sent } from '@/db/schema'
import { getSessionWithMailbox } from '@/lib/session'
import { emailQuerySchema } from '@/lib/schemas'

export async function GET(req: NextRequest) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { label } = emailQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  )

  if (label === 'sent') {
    const rows = await db
      .select({
        id: sent.id,
        fromEmail: sent.fromEmail,
        toEmail: sent.toEmail,
        subject: sent.subject,
        date: sent.date,
        starred: sent.starred,
      })
      .from(sent)
      .where(eq(sent.userId, ctx.session.user.id))
      .orderBy(desc(sent.date))

    return Response.json(rows)
  }

  if (!ctx.mailboxAddress) return Response.json([])

  const condition =
    label === 'starred'
      ? and(eq(emails.toEmail, ctx.mailboxAddress), eq(emails.starred, true))
      : and(eq(emails.toEmail, ctx.mailboxAddress), eq(emails.label, label))

  const rows = await db
    .select({
      id: emails.id,
      fromName: emails.fromName,
      fromEmail: emails.fromEmail,
      subject: emails.subject,
      date: emails.date,
      read: emails.read,
      starred: emails.starred,
      label: emails.label,
    })
    .from(emails)
    .where(condition)
    .orderBy(desc(emails.date))

  return Response.json(rows)
}
