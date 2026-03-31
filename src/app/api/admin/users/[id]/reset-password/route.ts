import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getSessionWithMailbox } from '@/lib/session'
import { resetPasswordSchema } from '@/lib/schemas'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = resetPasswordSchema.safeParse(await req.json())
  if (!body.success) return Response.json({ error: body.error.flatten() }, { status: 400 })

  await auth.api.setPassword({
    headers: req.headers,
    body: { userId: id, newPassword: body.data.newPassword },
  })

  return Response.json({ ok: true })
}
