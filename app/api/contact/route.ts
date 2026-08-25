import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { rateLimitEmail, emailSendBudget } from '../../../lib/rateLimit'

// The contact page (public, unauthenticated) — replaces the external Google Form
// previously linked from /about, /for-teachers, the demo tour, ResultsView and
// StartScreen. Behaviour mirrors /api/feedback: record in analytics_events for
// durability, then fire a best-effort email notification via Resend with the
// sender's own address set as replyTo, so replying in an inbox goes straight
// back to them — no copying an address out of a spreadsheet.

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  tutor:   'Tutor',
  parent:  'Parent',
  student: 'Student',
  other:   'Other',
}

// Public endpoint — every field is attacker-controllable, so anything
// interpolated into the email HTML must be neutralised first.
const escapeHtml = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimitEmail(req)).ok) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 })
    }

    const { name, email, role, message, from, sessionId } = await req.json()

    const safeName    = typeof name === 'string' ? name.trim().slice(0, 200) : ''
    const safeEmail   = typeof email === 'string' ? email.trim().slice(0, 200) : ''
    const safeMessage = typeof message === 'string' ? message.trim().slice(0, 4000) : ''
    const safeRole    = typeof role === 'string' && ROLE_LABELS[role] ? role : null

    if (!safeName)    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!safeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }
    if (!safeMessage) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    // Instantiate the admin client per-request (not at module scope) so a missing
    // key can't throw during the production build's page-data collection.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // ── 1. Record in analytics_events ─────────────────────────────────────────
    await supabase.from('analytics_events').insert({
      event:      'contact',
      path:       typeof from === 'string' ? from : 'unknown',
      session_id: sessionId ?? 'unknown',
      properties: {
        name:  safeName,
        email: safeEmail,
        role:  safeRole,
        message: safeMessage,
        from:    from ?? null,
      },
    })

    // ── 2. Best-effort email notification ─────────────────────────────────────
    const notifyEmail = process.env.REPORT_NOTIFY_EMAIL
    const resendKey   = process.env.RESEND_API_KEY
    const fromEmail   = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    // The message is already recorded above; skip email (don't error) if it
    // isn't configured. The response's coarse `email` status makes a
    // missing/broken config observable without leaking config details on this
    // public endpoint (the raw Resend error is logged server-side only).
    if (!notifyEmail || !resendKey) {
      console.warn(
        `[contact] email skipped — missing config: ` +
        `REPORT_NOTIFY_EMAIL=${notifyEmail ? 'set' : 'MISSING'}, ` +
        `RESEND_API_KEY=${resendKey ? 'set' : 'MISSING'}`,
      )
      return NextResponse.json({ ok: true, email: 'skipped_no_config' })
    }

    // Hard daily cap on outbound email (audit F4), claimed here — after the
    // message is durably recorded above — so hitting the cap costs only the
    // notification, never the message itself.
    const budget = await emailSendBudget()
    if (!budget.ok) {
      return NextResponse.json({ ok: true, email: 'skipped_rate_capped' })
    }

    const resend = new Resend(resendKey)
    const roleLabel = safeRole ? ROLE_LABELS[safeRole] : null

    const { data: emailData, error: emailError } = await resend.emails.send({
      from:    fromEmail,
      to:      notifyEmail,
      replyTo: safeEmail,
      subject: `[Mathsense] Contact – ${safeName.replace(/[\r\n]+/g, ' ').slice(0, 120)}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111827;">
          <h2 style="margin:0 0 4px;">✉️ New contact message</h2>
          <p style="margin:0 0 20px;color:#6b7280;">Someone got in touch through the Mathsense contact page.</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Name</td>
              <td style="padding:6px 0;font-weight:600;">${escapeHtml(safeName)}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Email</td>
              <td style="padding:6px 0;">${escapeHtml(safeEmail)}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">I am a</td>
              <td style="padding:6px 0;">${escapeHtml(roleLabel) || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">From page</td>
              <td style="padding:6px 0;">${escapeHtml(from) || '—'}</td>
            </tr>
          </table>

          <p style="margin:0 0 6px;font-weight:600;color:#374151;">Message</p>
          <div style="background:#f9fafb;border-radius:6px;padding:14px 16px;white-space:pre-wrap;line-height:1.5;">${escapeHtml(safeMessage)}</div>
        </div>
      `,
    })

    if (emailError) {
      // Log the full error server-side (visible in Vercel function logs) but
      // never return it — the message can reveal sender/recipient config.
      console.error('[contact] Resend send failed:', emailError)
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ ok: false, email: 'error', emailError }, { status: 500 })
      }
      // In production the message is already saved; report a coarse failure
      // status (no detail) so the email problem is observable without leaking.
      return NextResponse.json({ ok: true, email: 'error' })
    }

    console.log(`[contact] email sent ok (id=${emailData?.id ?? 'unknown'}, from=${fromEmail})`)
    return NextResponse.json({ ok: true, email: 'sent' })
  } catch (err) {
    console.error('contact route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
