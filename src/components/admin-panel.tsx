'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  mailbox: string | null
}

interface AdminEmail {
  id: string
  fromEmail: string
  toEmail: string
  subject: string | null
  date: string
  label: string | null
  read: boolean | null
}

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [allEmails, setAllEmails] = useState<AdminEmail[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingEmails, setLoadingEmails] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoadingUsers(false))

    fetch('/api/admin/emails')
      .then((r) => r.json())
      .then(setAllEmails)
      .catch(() => {})
      .finally(() => setLoadingEmails(false))
  }, [])

  async function deleteUser(id: string, name: string) {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      alert('Failed to delete user. Please try again.')
    }
  }

  async function updateMailbox(userId: string, address: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/mailbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, address }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, mailbox: address } : u)))
    } catch {
      alert('Failed to update mailbox. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </Link>
          <h1 className="font-serif text-2xl font-semibold">Admin</h1>
        </div>

        <UsersCard
          users={users}
          loading={loadingUsers}
          onDelete={deleteUser}
          onUpdateMailbox={updateMailbox}
        />
        <AddUserCard onAdded={(u) => setUsers((prev) => [...prev, u])} />
        <ResetPasswordCard users={users} />
        <AllEmailsCard emails={allEmails} loading={loadingEmails} />
      </div>
    </div>
  )
}

function UsersCard({
  users,
  loading,
  onDelete,
  onUpdateMailbox,
}: {
  users: AdminUser[]
  loading: boolean
  onDelete: (id: string, name: string) => void
  onUpdateMailbox: (userId: string, address: string) => void
}) {
  const [editingMailbox, setEditingMailbox] = useState<Record<string, string>>({})

  function setMailboxDraft(userId: string, value: string) {
    setEditingMailbox((prev) => ({ ...prev, [userId]: value }))
  }

  return (
    <Card>
      <CardHeader><CardTitle>Users</CardTitle></CardHeader>
      <CardContent>
        <div className="divide-y">
          {loading && <p className="py-3 text-sm text-muted-foreground">Loading…</p>}
          {!loading && users.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">No users</p>
          )}
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  className="h-8 w-48 text-sm"
                  placeholder="mailbox@domain.com"
                  value={editingMailbox[user.id] ?? user.mailbox ?? ''}
                  onChange={(e) => setMailboxDraft(user.id, e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateMailbox(user.id, editingMailbox[user.id] ?? user.mailbox ?? '')}
                >
                  Save
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(user.id, user.name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AddUserCard({ onAdded }: { onAdded: (user: AdminUser) => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', mailbox: '', role: 'user' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to create user.')
        return
      }
      onAdded({ id: data.userId, ...form, mailbox: form.mailbox })
      setForm({ name: '', email: '', password: '', mailbox: '', role: 'user' })
    } catch {
      setError('Failed to create user. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Add user</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Login email</Label>
            <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} required minLength={8} />
          </div>
          <div className="space-y-1">
            <Label>Mailbox address</Label>
            <Input type="email" value={form.mailbox} onChange={(e) => setField('mailbox', e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setField('role', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating…' : 'Create user'}
            </Button>
          </div>
          {error && <p className="col-span-2 text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  )
}

function ResetPasswordCard({ users }: { users: AdminUser[] }) {
  const [userId, setUserId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('idle')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
      })
      if (res.ok) {
        setStatus('ok')
        setNewPassword('')
        setUserId('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Reset password</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="space-y-1 flex-1">
            <Label>User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1">
            <Label>New password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={!userId || loading}>
            {loading ? 'Resetting…' : 'Reset'}
          </Button>
        </form>
        {status === 'ok' && <p className="mt-2 text-sm text-green-600">Password reset successfully.</p>}
        {status === 'error' && <p className="mt-2 text-sm text-destructive">Failed to reset password. Please try again.</p>}
      </CardContent>
    </Card>
  )
}

function AllEmailsCard({ emails, loading }: { emails: AdminEmail[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>All emails</CardTitle></CardHeader>
      <CardContent>
        <div className="divide-y">
          {loading && <p className="py-3 text-sm text-muted-foreground">Loading…</p>}
          {!loading && emails.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">No emails</p>
          )}
          {emails.map((email) => (
            <div key={email.id} className="py-2 text-sm grid grid-cols-4 gap-2">
              <span className="truncate text-muted-foreground">{email.toEmail}</span>
              <span className="truncate">{email.fromEmail}</span>
              <span className="truncate">{email.subject ?? '(no subject)'}</span>
              <span className="text-right tabular-nums text-muted-foreground">
                {new Date(email.date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
