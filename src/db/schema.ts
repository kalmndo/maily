import { pgTable, uuid, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core'

export const mailboxes = pgTable('mailboxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  address: text('address').notNull().unique(),
})

export const emails = pgTable('emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: text('message_id'),
  fromName: text('from_name'),
  fromEmail: text('from_email').notNull(),
  toEmail: text('to_email').notNull(),
  subject: text('subject'),
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  date: timestamp('date', { withTimezone: true }).defaultNow(),
  label: text('label').default('inbox'),
  read: boolean('read').default(false),
  starred: boolean('starred').default(false),
})

export const sent = pgTable('sent', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  fromEmail: text('from_email').notNull(),
  toEmail: text('to_email').notNull(),
  subject: text('subject'),
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  inReplyTo: text('in_reply_to'),
  date: timestamp('date', { withTimezone: true }).defaultNow(),
  starred: boolean('starred').default(false),
})

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailId: uuid('email_id').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type'),
  size: integer('size'),
  r2Key: text('r2_key').notNull(),
})
