import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { MailApp } from '@/components/mail-app'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return (
    <MailApp
      userEmail={session.user.email}
      isAdmin={session.user.role === 'admin'}
    />
  )
}
