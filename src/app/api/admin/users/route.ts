import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { mailboxes } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getSessionWithMailbox } from '@/lib/session'
import { createUserSchema } from '@/lib/schemas'

export async function GET(req: NextRequest) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const users = await auth.api.listUsers({ headers: req.headers, query: { limit: 100 } })
  const allMailboxes = await db.query.mailboxes.findMany()

  const mailboxByUserId = Object.fromEntries(allMailboxes.map((m) => [m.userId, m.address]))

  return Response.json(
    users.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      mailbox: mailboxByUserId[u.id] ?? null,
    }))
  )
}

export async function POST(req: NextRequest) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = createUserSchema.safeParse(await req.json())
  if (!body.success) return Response.json({ error: body.error.flatten() }, { status: 400 })

  const { name, email, password, mailbox, role } = body.data

  const created = await auth.api.createUser({
    headers: req.headers,
    body: { name, email, password, role },
  })

  await db.insert(mailboxes).values({ userId: created.user.id, address: mailbox })

  return Response.json({ ok: true, userId: created.user.id })
}
