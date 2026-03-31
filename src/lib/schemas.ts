import { z } from 'zod'

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  inReplyTo: z.string().optional(),
})

export const labelSchema = z.object({
  label: z.enum(['inbox', 'starred', 'sent', 'trash']),
})

export const emailQuerySchema = z.object({
  label: z.enum(['inbox', 'starred', 'sent', 'trash']).default('inbox'),
})

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  mailbox: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
})

export const assignMailboxSchema = z.object({
  userId: z.string(),
  address: z.string().email(),
})

export const resetPasswordSchema = z.object({
  userId: z.string(),
  newPassword: z.string().min(8),
})
