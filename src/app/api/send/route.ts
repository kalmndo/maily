import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/db'
import { sent } from '@/db/schema'
import { getSessionWithMailbox } from '@/lib/session'
import { sendEmailSchema } from '@/lib/schemas'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.mailboxAddress) return Response.json({ error: 'No mailbox assigned' }, { status: 400 })

  const body = sendEmailSchema.safeParse(await req.json())
  if (!body.success) return Response.json({ error: body.error.flatten() }, { status: 400 })

  const { to, subject, bodyHtml, bodyText, inReplyTo } = body.data

  const headers: Record<string, string> = {}
  if (inReplyTo) {
    headers['In-Reply-To'] = inReplyTo
    headers['References'] = inReplyTo
  }

  const { error } = await resend.emails.send({
    from: `${ctx.session.user.name} <${ctx.mailboxAddress}>`,
    to,
    subject,
    html: bodyHtml,
    text: bodyText ?? '',
    headers,
  })

  if (error) return Response.json({ error: error.message }, { status: 502 })

  await db.insert(sent).values({
    userId: ctx.session.user.id,
    fromEmail: ctx.mailboxAddress,
    toEmail: to,
    subject,
    bodyText,
    bodyHtml,
    inReplyTo,
  })

  return Response.json({ ok: true })
}
