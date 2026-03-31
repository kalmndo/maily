import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminPanel } from '@/components/admin-panel'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) redirect('/login')
  if (session.user.role !== 'admin') redirect('/')

  return <AdminPanel />
}
