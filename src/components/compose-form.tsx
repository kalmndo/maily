'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from './rich-text-editor'
import { Paperclip } from 'lucide-react'

interface ComposeFormProps {
  defaultTo?: string
  defaultSubject?: string
  inReplyTo?: string
  onSent?: () => void
  // Increment to reset form (e.g. when opening a new compose)
  resetKey?: string | number
}

export function ComposeForm({
  defaultTo = '',
  defaultSubject = '',
  inReplyTo,
  onSent,
  resetKey,
}: ComposeFormProps) {
  const [to, setTo] = useState(defaultTo)
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState(defaultSubject)
  const [bodyHtml, setBodyHtml] = useState('')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when resetKey changes (i.e. when a new compose is triggered)
  useEffect(() => {
    setTo(defaultTo)
    setSubject(defaultSubject)
    setCc('')
    setBcc('')
    setBodyHtml('')
    setError(null)
    setShowCcBcc(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]) // defaultTo/defaultSubject intentionally excluded — only resetKey triggers a full reset

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, cc: cc || undefined, bcc: bcc || undefined, subject, bodyHtml, inReplyTo }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to send. Please try again.')
        return
      }
      onSent?.()
    } catch {
      setError('Failed to send. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  const fieldClass = 'h-8 rounded-none border-0 border-b px-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0'

  return (
    <form onSubmit={handleSend} className="flex flex-1 flex-col overflow-hidden">
      {/* Fields */}
      <div className="shrink-0">
        <div className="flex items-center">
          <Input
            placeholder="To"
            type="email"
            value={to}
            onChange={e => setTo(e.target.value)}
            required
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => setShowCcBcc(v => !v)}
            className="shrink-0 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Cc Bcc
          </button>
        </div>
        {showCcBcc && (
          <>
            <Input placeholder="Cc" type="text" value={cc} onChange={e => setCc(e.target.value)} className={fieldClass} />
            <Input placeholder="Bcc" type="text" value={bcc} onChange={e => setBcc(e.target.value)} className={fieldClass} />
          </>
        )}
        <Input
          placeholder="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* Rich text editor — fills remaining space; key forces remount on reset to clear Tiptap content */}
      <RichTextEditor key={resetKey} onUpdate={setBodyHtml} className="flex-1" />

      {/* Error */}
      {error && <p className="shrink-0 px-3 py-1 text-xs text-destructive">{error}</p>}

      {/* Bottom bar */}
      <div className="flex shrink-0 items-center justify-between border-t px-3 py-2">
        <Button type="submit" size="sm" disabled={sending}>
          {sending ? 'Sending…' : 'Send'}
        </Button>
        <button type="button" title="Attach file" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Paperclip className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
