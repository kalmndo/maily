import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { emails, attachments } from '@/db/schema'
import { getSessionWithMailbox } from '@/lib/session'

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET = process.env.R2_BUCKET ?? 'maily-attachments'

async function getPresignedR2Url(r2Key: string): Promise<string> {
  // Build a presigned URL using the AWS S3-compatible R2 API
  const url = new URL(
    `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${r2Key}`
  )
  url.searchParams.set('X-Amz-Expires', '3600')

  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const region = 'auto'
  const service = 's3'
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`

  url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
  url.searchParams.set('X-Amz-Credential', `${R2_ACCESS_KEY_ID}/${credentialScope}`)
  url.searchParams.set('X-Amz-Date', amzDate)
  url.searchParams.set('X-Amz-SignedHeaders', 'host')

  const encoder = new TextEncoder()

  async function hmac(key: ArrayBuffer, data: string) {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  }

  async function getSigningKey() {
    const kDate = await hmac(encoder.encode(`AWS4${R2_SECRET_ACCESS_KEY}`), dateStamp)
    const kRegion = await hmac(kDate, region)
    const kService = await hmac(kRegion, service)
    return hmac(kService, 'aws4_request')
  }

  const canonicalRequest = [
    'GET',
    `/${R2_BUCKET}/${r2Key}`,
    url.searchParams.toString(),
    `host:${url.host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const hashedCanonical = Buffer.from(
    await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))
  ).toString('hex')

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, hashedCanonical].join('\n')

  const signingKey = await getSigningKey()
  const signature = Buffer.from(await hmac(signingKey, stringToSign)).toString('hex')

  url.searchParams.set('X-Amz-Signature', signature)

  return url.toString()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const ctx = await getSessionWithMailbox(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.mailboxAddress) return Response.json({ error: 'No mailbox' }, { status: 404 })

  const { id, attachmentId } = await params

  const email = await db.query.emails.findFirst({
    where: and(eq(emails.id, id), eq(emails.toEmail, ctx.mailboxAddress)),
  })
  if (!email) return Response.json({ error: 'Not found' }, { status: 404 })

  const attachment = await db.query.attachments.findFirst({
    where: and(eq(attachments.id, attachmentId), eq(attachments.emailId, id)),
  })
  if (!attachment) return Response.json({ error: 'Not found' }, { status: 404 })

  const presignedUrl = await getPresignedR2Url(attachment.r2Key)

  return Response.json({ url: presignedUrl })
}
