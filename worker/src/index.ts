import PostalMime from 'postal-mime'

interface Env {
  BUCKET: R2Bucket
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const raw = await streamToArrayBuffer(message.raw)
    const parsed = await new PostalMime().parse(raw)

    const emailId = crypto.randomUUID()
    const toEmail = message.to

    await uploadAttachments(parsed.attachments, emailId, env.BUCKET)
    await insertEmail(parsed, emailId, toEmail, env)
    await insertAttachments(parsed.attachments, emailId, env)
  },
}

async function uploadAttachments(
  attachments: PostalMime.Attachment[],
  emailId: string,
  bucket: R2Bucket
): Promise<void> {
  await Promise.all(
    attachments
      .filter((a) => a.disposition === 'attachment')
      .map((a) => bucket.put(`attachments/${emailId}/${a.filename}`, a.content))
  )
}

async function insertEmail(
  parsed: PostalMime.Email,
  emailId: string,
  toEmail: string,
  env: Env
): Promise<void> {
  const body = {
    id: emailId,
    message_id: parsed.messageId ?? null,
    from_name: parsed.from?.name ?? null,
    from_email: parsed.from?.address ?? '',
    to_email: toEmail,
    subject: parsed.subject ?? null,
    body_text: parsed.text ?? null,
    body_html: parsed.html ?? null,
    date: parsed.date ?? new Date().toISOString(),
    label: 'inbox',
    read: false,
    starred: false,
  }

  const res = await supabaseInsert(env, 'emails', body)
  if (!res.ok) throw new Error(`Email insert failed: ${await res.text()}`)
}

async function insertAttachments(
  attachments: PostalMime.Attachment[],
  emailId: string,
  env: Env
): Promise<void> {
  const rows = attachments
    .filter((a) => a.disposition === 'attachment')
    .map((a) => ({
      id: crypto.randomUUID(),
      email_id: emailId,
      filename: a.filename ?? 'attachment',
      mime_type: a.mimeType ?? null,
      size: a.content.byteLength,
      r2_key: `attachments/${emailId}/${a.filename}`,
    }))

  if (rows.length === 0) return

  const res = await supabaseInsert(env, 'attachments', rows)
  if (!res.ok) throw new Error(`Attachments insert failed: ${await res.text()}`)
}

function supabaseInsert(env: Env, table: string, body: unknown): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })
}

async function streamToArrayBuffer(stream: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const total = chunks.reduce((n, c) => n + c.byteLength, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result.buffer
}
