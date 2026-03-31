'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './sidebar'
import { EmailList } from './email-list'
import { ReadingPane } from './reading-pane'
import type { EmailRow, EmailDetail, SentRow, Label } from '@/lib/types'

interface MailAppProps {
  userEmail: string
  isAdmin: boolean
}

export function MailApp({ userEmail, isAdmin }: MailAppProps) {
  const [label, setLabel] = useState<Label>('inbox')
  const [emailList, setEmailList] = useState<(EmailRow | SentRow)[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setSelectedId(null)
    setSelectedEmail(null)
    const res = await fetch(`/api/emails?label=${label}`)
    const data = await res.json()
    setEmailList(data)
    setLoading(false)
  }, [label])

  useEffect(() => { fetchList() }, [fetchList])

  async function selectEmail(id: string) {
    setSelectedId(id)
    const res = await fetch(`/api/emails/${id}`)
    const data = await res.json()
    setSelectedEmail(data)
    setEmailList((prev) =>
      prev.map((e) => (e.id === id && 'read' in e ? { ...e, read: true } : e))
    )
  }

  async function handleStar() {
    if (!selectedEmail) return
    const res = await fetch(`/api/emails/${selectedEmail.id}/star`, { method: 'POST' })
    const { starred } = await res.json()
    setSelectedEmail((e) => e && { ...e, starred })
    setEmailList((prev) =>
      prev.map((e) => (e.id === selectedEmail.id && 'starred' in e ? { ...e, starred } : e))
    )
  }

  async function handleTrash() {
    if (!selectedEmail) return
    await fetch(`/api/emails/${selectedEmail.id}`, { method: 'DELETE' })
    setSelectedEmail(null)
    setSelectedId(null)
    setEmailList((prev) => prev.filter((e) => e.id !== selectedEmail.id))
  }

  const unreadCount = emailList.filter((e) => 'read' in e && !e.read).length

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeLabel={label}
        unreadCount={unreadCount}
        userEmail={userEmail}
        isAdmin={isAdmin}
        onLabelChange={setLabel}
      />

      <div className="flex flex-1 overflow-hidden border-r" style={{ maxWidth: 320 }}>
        {loading ? (
          <EmailListSkeleton />
        ) : (
          <div className="w-full overflow-y-auto">
            <EmailList
              emails={emailList}
              selectedId={selectedId}
              label={label}
              onSelect={selectEmail}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedEmail ? (
          <ReadingPane email={selectedEmail} onStar={handleStar} onTrash={handleTrash} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select an email to read
          </div>
        )}
      </div>
    </div>
  )
}

function EmailListSkeleton() {
  return (
    <div className="w-full divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-3 space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}
