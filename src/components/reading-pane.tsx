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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 p-4">
        <h2 className="text-xl font-semibold">{email.subject ?? '(no subject)'}</h2>
        <div className="mt-1 text-sm text-muted-foreground">
          <span>From: {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}</span>
          <span className="mx-2">·</span>
          <span>{new Date(email.date).toLocaleString()}</span>
        </div>
      </div>

      <Separator />

      <div className="flex shrink-0 items-center gap-2 px-4 py-2">
        <Button size="sm" variant="outline" onClick={() => setReplyOpen(true)}>
          <Reply className="mr-1 h-4 w-4" /> Reply
        </Button>
        <Button size="sm" variant="outline" onClick={onStar}>
          <Star className={`mr-1 h-4 w-4 ${email.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          {email.starred ? 'Unstar' : 'Star'}
        </Button>
        <Button size="sm" variant="outline" onClick={onTrash}>
          <Trash2 className="mr-1 h-4 w-4" /> Trash
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-auto p-4">
        {email.bodyHtml ? (
          <iframe
            srcDoc={email.bodyHtml}
            sandbox="allow-same-origin"
            className="h-full w-full border-0"
            title="Email body"
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{email.bodyText}</pre>
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
    const res = await fetch(`/api/emails/${emailId}/attachments/${attachmentId}`)
    const { url } = await res.json()
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <div className="shrink-0 p-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <Paperclip className="mr-1 inline h-3 w-3" />
        Attachments
      </p>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) => (
          <button
            key={att.id}
            onClick={() => downloadAttachment(att.id, att.filename)}
            className="rounded border px-3 py-1 text-sm hover:bg-accent transition-colors"
          >
            {att.filename}
            {att.size != null && (
              <span className="ml-1 text-muted-foreground">({formatBytes(att.size)})</span>
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
