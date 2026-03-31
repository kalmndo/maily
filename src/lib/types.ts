export type Label = 'inbox' | 'starred' | 'sent' | 'trash'

export interface EmailRow {
  id: string
  fromName: string | null
  fromEmail: string
  subject: string | null
  date: string
  read: boolean | null
  starred: boolean | null
  label: string | null
}

export interface EmailDetail extends EmailRow {
  toEmail: string
  bodyText: string | null
  bodyHtml: string | null
  messageId: string | null
  attachments: AttachmentRow[]
}

export interface AttachmentRow {
  id: string
  filename: string
  mimeType: string | null
  size: number | null
  r2Key: string
}

export interface SentRow {
  id: string
  fromEmail: string
  toEmail: string
  subject: string | null
  date: string
  starred: boolean | null
}
