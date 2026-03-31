'use client'

import { useState } from 'react'
import { Star, Trash2, Reply, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ComposeModal } from './compose-modal'
import type { EmailDetail } from '@/lib/types'

interface ReadingPaneProps {
  email: EmailDetail
  onStar: () => void
  onTrash: () => void
}

export function ReadingPane({ email, onStar, onTrash }: ReadingPaneProps) {
  const [replyOpen, setReplyOpen] = useState(false)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/*
        Unified header zone — subject, metadata, and actions share one spatial region.
        Eliminates the "two separators sandwiching a thin strip" layout.
        Reply is the primary action; Star and Trash are icon-only ghosts.
      */}
      <div className="shrink-0 px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl font-semibold leading-snug tracking-tight text-foreground">
              {email.subject ?? '(no subject)'}
            </h2>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">
                {email.fromName ?? email.fromEmail}
              </span>
              {email.fromName && (
                <span className="text-muted-foreground/60">&lt;{email.fromEmail}&gt;</span>
              )}
              <span className="tabular-nums">{new Date(email.date).toLocaleString()}</span>
            </div>
          </div>

          {/* Actions — Reply has hierarchy; Star and Trash are demoted to icon ghosts */}
          <div className="flex shrink-0 items-center gap-1 pt-0.5">
            <Button size="sm" onClick={() => setReplyOpen(true)}>
              <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onStar}
              aria-label={email.starred ? 'Remove star' : 'Star email'}
            >
              <Star className={`h-4 w-4 ${email.starred ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onTrash}
              aria-label="Move to trash"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-auto p-4">
        {email.bodyHtml ? (
          <iframe
            srcDoc={`<style>body{margin:0 auto !important;max-width:680px !important;padding:0 16px !important;}</style>${email.bodyHtml}`}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className="h-full w-full border-0"
            title="Email body"
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{email.bodyText ?? '(no content)'}</pre>
        )}
      </div>

      {email.attachments.length > 0 && (
        <>
          <Separator />
          <AttachmentList emailId={email.id} attachments={email.attachments} />
        </>
      )}

      <ComposeModal
        open={replyOpen}
        onOpenChange={setReplyOpen}
        defaultTo={email.fromEmail}
        defaultSubject={email.subject ? `Re: ${email.subject}` : ''}
        inReplyTo={email.messageId ?? undefined}
      />
    </div>
  )
}

interface AttachmentListProps {
  emailId: string
  attachments: EmailDetail['attachments']
}

function AttachmentList({ emailId, attachments }: AttachmentListProps) {
  async function downloadAttachment(attachmentId: string, filename: string) {
    try {
      const res = await fetch(`/api/emails/${emailId}/attachments/${attachmentId}`)
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
    } catch {
      alert(`Could not download "${filename}". Please try again.`)
    }
  }

  return (
    <div className="shrink-0 px-6 py-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Paperclip className="h-3 w-3 text-primary/60" />
        Attachments
      </p>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) => (
          <button
            key={att.id}
            onClick={() => downloadAttachment(att.id, att.filename)}
            className="rounded border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            {att.filename}
            {att.size != null && (
              <span className="ml-1.5 text-muted-foreground">({formatBytes(att.size)})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1048576) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1048576).toFixed(1)}MB`
}
