'use client'

import { formatDistanceToNow } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import type { EmailRow, SentRow, Label } from '@/lib/types'

interface EmailListProps {
  emails: (EmailRow | SentRow)[]
  selectedId: string | null
  label: Label
  onSelect: (id: string) => void
}

export function EmailList({ emails, selectedId, label, onSelect }: EmailListProps) {
  const emptyMessage: Record<Label, string> = {
    inbox: 'Your inbox is empty',
    starred: 'No starred messages',
    sent: 'No sent messages',
    trash: 'Trash is empty',
  }

  if (emails.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        {emptyMessage[label]}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {emails.map((email) => (
        <EmailListItem
          key={email.id}
          email={email}
          selected={email.id === selectedId}
          isSent={label === 'sent'}
          onClick={() => onSelect(email.id)}
        />
      ))}
    </ul>
  )
}

interface EmailListItemProps {
  email: EmailRow | SentRow
  selected: boolean
  isSent: boolean
  onClick: () => void
}

function EmailListItem({ email, selected, isSent, onClick }: EmailListItemProps) {
  const isUnread = 'read' in email && !email.read
  const sender = isSent
    ? `To: ${'toEmail' in email ? email.toEmail : ''}`
    : ('fromName' in email && email.fromName) || ('fromEmail' in email ? email.fromEmail : '')

  return (
    <li
      onClick={onClick}
      className={cn(
        'relative cursor-pointer px-4 py-3.5 hover:bg-accent transition-colors border-l-2',
        selected ? 'bg-accent border-l-primary' : isUnread ? 'bg-primary/[0.04] border-l-primary' : 'border-l-transparent'
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn('truncate text-sm', isUnread ? 'font-semibold text-foreground' : 'text-foreground/80')}>
          {sender}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatDistanceToNow(email.date)}
        </span>
      </div>
      <p className={cn('mt-0.5 truncate text-sm', isUnread ? 'text-foreground/70' : 'text-muted-foreground')}>
        {email.subject ?? '(no subject)'}
      </p>
    </li>
  )
}
