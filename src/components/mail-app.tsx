'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { ReadingPane } from './reading-pane'
import { ComposeWindow } from './compose-window'
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
  const [error, setError] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [composeKey, setComposeKey] = useState(0)
  const [replyTo, setReplyTo] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [replyMessageId, setReplyMessageId] = useState<string | undefined>()

  const fetchList = useCallback(async () => {
    setLoading(true)
    setSelectedId(null)
    setSelectedEmail(null)
    setError(null)
    try {
      const res = await fetch(`/api/emails?label=${label}`)
      if (!res.ok) throw new Error('Failed to load emails')
      const data = await res.json()
      setEmailList(data)
    } catch {
      setError('Could not load emails. Check your connection.')
      setEmailList([])
    } finally {
      setLoading(false)
    }
  }, [label])

  useEffect(() => { fetchList() }, [fetchList])

  async function selectEmail(id: string) {
    setSelectedId(id)
    setSelectedEmail(null)
    try {
      const res = await fetch(`/api/emails/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedEmail(data)
      setEmailList((prev) =>
        prev.map((e) => (e.id === id && 'read' in e ? { ...e, read: true } : e))
      )
    } catch {
      setError('Could not open email. Try again.')
      setSelectedId(null)
    }
  }

  function handleCompose() {
    setReplyTo('')
    setReplySubject('')
    setReplyMessageId(undefined)
    setComposeKey(k => k + 1)
    setComposing(true)
  }

  function handleReply(email: EmailDetail) {
    setReplyTo(email.fromEmail)
    setReplySubject(email.subject ? `Re: ${email.subject}` : '')
    setReplyMessageId(email.messageId ?? undefined)
    setComposeKey(k => k + 1)
    setComposing(true)
  }

  async function handleStar() {
    if (!selectedEmail) return
    try {
      const res = await fetch(`/api/emails/${selectedEmail.id}/star`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { starred } = await res.json()
      setSelectedEmail((e) => e && { ...e, starred })
      setEmailList((prev) =>
        prev.map((e) => (e.id === selectedEmail.id && 'starred' in e ? { ...e, starred } : e))
      )
    } catch {
      setError('Could not update star. Try again.')
    }
  }

  async function handleTrash() {
    if (!selectedEmail) return
    try {
      const res = await fetch(`/api/emails/${selectedEmail.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSelectedEmail(null)
      setSelectedId(null)
      setEmailList((prev) => prev.filter((e) => e.id !== selectedEmail.id))
    } catch {
      setError('Could not delete email. Try again.')
    }
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "350px" } as React.CSSProperties} className="h-svh overflow-hidden">
      <AppSidebar
        activeLabel={label}
        emails={emailList}
        selectedId={selectedId}
        loading={loading}
        userEmail={userEmail}
        isAdmin={isAdmin}
        onLabelChange={setLabel}
        onEmailSelect={selectEmail}
        onCompose={handleCompose}
      />
      <ComposeWindow
        open={composing}
        onClose={() => setComposing(false)}
        defaultTo={replyTo}
        defaultSubject={replySubject}
        inReplyTo={replyMessageId}
        resetKey={composeKey}
      />
      <SidebarInset className="overflow-hidden">
{error && (
          <div className="flex items-center justify-between gap-2 bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-sm text-destructive shrink-0">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 rounded p-0.5 hover:bg-destructive/10 transition-colors" aria-label="Dismiss error">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {selectedEmail ? (
            <ReadingPane email={selectedEmail} onStar={handleStar} onTrash={handleTrash} onReply={handleReply} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Select an email to read
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
