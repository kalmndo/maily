'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ComposeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTo?: string
  defaultSubject?: string
  inReplyTo?: string
}

export function ComposeModal({ open, onOpenChange, defaultTo = '', defaultSubject = '', inReplyTo }: ComposeModalProps) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)

    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, bodyText: body, inReplyTo }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to send')
      setSending(false)
      return
    }

    onOpenChange(false)
    setTo(defaultTo)
    setSubject(defaultSubject)
    setBody('')
    setSending(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{inReplyTo ? 'Reply' : 'New message'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="email" value={to} onChange={(e) => setTo(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
