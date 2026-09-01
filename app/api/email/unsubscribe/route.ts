import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseSendKind, SEND_TABLE, SEND_ANALYTICS, type SendKind } from '../../../../lib/email/sendKind'

// One-click unsubscribe for the practice emails. The link carries an opaque
// send-id token (?s=<uuid>) and a channel (&k=) — we resolve it to the student
// and flip their auth user_metadata.email_reminders to false. Consent is opt-in,
// so this is the off-switch; it's honoured by both crons' selectors immediately.
//
// One switch covers BOTH channels on purpose. "Practice reminders" is a single
// thing from the student's point of view, and a granular preference centre would
// make opting out harder — the wrong direction for a service used by children.
//
// GET  → flip + render a small human confirmation page (in-body link click).
// POST → flip + 200 (RFC 8058 List-Unsubscribe-Post one-click, sent by mail
//        clients without a human visiting the page).

export const dynamic = 'force-dynamic'

async function unsubscribe(sendId: string | null, kind: SendKind): Promise<'ok' | 'invalid' | 'error'> {
  if (!sendId) return 'invalid'
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: row } = await supabase
      .from(SEND_TABLE[kind])
      .select('student_id')
      .eq('id', sendId)
      .single()
    if (!row) return 'invalid'

    const studentId = row.student_id as string

    // Merge (don't clobber) the rest of the user's metadata.
    const { data: userRes } = await supabase.auth.admin.getUserById(studentId)
    const existingMeta = userRes?.user?.user_metadata ?? {}
    const { error: updErr } = await supabase.auth.admin.updateUserById(studentId, {
      user_metadata: { ...existingMeta, email_reminders: false },
    })
    if (updErr) {
      console.error('[email/unsubscribe] updateUserById failed:', updErr.message)
      return 'error'
    }

    await supabase.from('analytics_events').insert({
      event:      `${SEND_ANALYTICS[kind].prefix}_unsubscribed`,
      path:       SEND_ANALYTICS[kind].path,
      session_id: sendId,
      properties: { send_id: sendId, student_id: studentId },
    })
    return 'ok'
  } catch (err) {
    console.error('[email/unsubscribe] error:', err)
    return 'error'
  }
}

function page(title: string, body: string): NextResponse {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Mathsense</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f9fafb;color:#111827;margin:0;padding:48px 20px;">
  <div style="max-width:440px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px 28px;text-align:center;">
    <p style="font-size:18px;font-weight:700;margin:0 0 16px;color:#2563eb;">Mathsense</p>
    <h1 style="font-size:20px;margin:0 0 10px;">${title}</h1>
    <p style="color:#6b7280;line-height:1.6;margin:0 0 20px;">${body}</p>
    <a href="/" style="display:inline-block;background:#2563eb;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Back to Mathsense</a>
  </div>
</body></html>`
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export async function GET(req: NextRequest) {
  const result = await unsubscribe(
    req.nextUrl.searchParams.get('s'),
    parseSendKind(req.nextUrl.searchParams.get('k')),
  )
  if (result === 'ok') {
    return page('You’re unsubscribed', 'You won’t get practice-reminder emails any more. You can turn them back on any time from your dashboard settings.')
  }
  if (result === 'invalid') {
    return page('Link not recognised', 'This unsubscribe link isn’t valid. If you keep getting emails you don’t want, you can turn reminders off from your dashboard settings.')
  }
  return page('Something went wrong', 'We couldn’t update your preferences just now. Please try again, or turn reminders off from your dashboard settings.')
}

export async function POST(req: NextRequest) {
  const result = await unsubscribe(
    req.nextUrl.searchParams.get('s'),
    parseSendKind(req.nextUrl.searchParams.get('k')),
  )
  return NextResponse.json({ ok: result === 'ok' }, { status: result === 'ok' ? 200 : 400 })
}
