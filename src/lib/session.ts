import { auth } from './auth'
import { db } from '@/db'
import { mailboxes } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getSessionWithMailbox(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return null

  const mailbox = await db.query.mailboxes.findFirst({
    where: eq(mailboxes.userId, session.user.id),
  })

  return { session, mailboxAddress: mailbox?.address ?? null }
}
