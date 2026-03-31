import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { emails } from '@/db/schema'
import { getSessionWithMailbox } from '@/lib/session'
import { labelSchema } from '@/lib/schemas'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.mailboxAddress) return Response.json({ error: 'No mailbox' }, { status: 404 })

  const body = labelSchema.safeParse(await req.json())
  if (!body.success) return Response.json({ error: 'Invalid label' }, { status: 400 })

  await db
    .update(emails)
    .set({ label: body.data.label })
    .where(and(eq(emails.id, params.id), eq(emails.toEmail, ctx.mailboxAddress)))

  return Response.json({ ok: true })
}
