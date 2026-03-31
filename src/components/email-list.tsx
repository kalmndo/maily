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
  if (emails.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No messages</div>
  }

  return (
    <ul className="divide-y">
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
        'cursor-pointer px-4 py-3 hover:bg-accent transition-colors',
        selected && 'bg-accent',
        isUnread && 'font-semibold'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm">{sender}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDistanceToNow(email.date)}
        </span>
      </div>
      <p className="truncate text-sm text-muted-foreground">{email.subject ?? '(no subject)'}</p>
    </li>
  )
}
