import { NextRequest } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { emails } from '@/db/schema'
import { getSessionWithMailbox } from '@/lib/session'

export async function GET(req: NextRequest) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const rows = await db
    .select({
      id: emails.id,
      fromEmail: emails.fromEmail,
      toEmail: emails.toEmail,
      subject: emails.subject,
      date: emails.date,
      label: emails.label,
      read: emails.read,
    })
    .from(emails)
    .orderBy(desc(emails.date))

  return Response.json(rows)
}
