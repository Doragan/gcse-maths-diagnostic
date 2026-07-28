import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { rateLimitEmail, emailSendBudget } from '../../../lib/rateLimit'

// General product feedback (distinct from the per-question report flow in
// /api/report-question). Sent from the dashboards and question page via the
// FeedbackWidget. Behaviour mirrors report-question: record in analytics_events
// for durability, then fire a best-effort email notification via Resend.

const CATEGORY_LABELS: Record<string, string> = {
  idea:    'Idea / feature request',
  problem: 'Something is broken',
  praise:  'Praise',
  other:   'Other',
}

// The feedback fields are attacker-controllable via this public endpoint, so any
// '<', '"', etc. must be neutralised before interpolating into the email HTML.
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

    const { message, category, context, email, userId, sessionId } = await req.json()

    const trimmed = typeof message === 'string' ? message.trim() : ''
    if (!trimmed) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    // Cap length so a hostile payload can't bloat the row / email.
    const safeMessage = trimmed.slice(0, 4000)
    const safeEmail   = typeof email === 'string' ? email.trim().slice(0, 200) : null

    // Instantiate the admin client per-request (not at module scope) so a missing
    // key can't throw during the production build's page-data collection.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // ── 1. Record in analytics_events ─────────────────────────────────────────
    await supabase.from('analytics_events').insert({
      event:      'feedback',
      path:       typeof context === 'string' ? context : 'unknown',
      session_id: sessionId ?? 'unknown',
      properties: {
        message:  safeMessage,
        category: category ?? null,
        context:  context ?? null,
        email:    safeEmail || null,
        user_id:  userId ?? null,
      },
    })

    // ── 2. Best-effort email notification ─────────────────────────────────────
    const notifyEmail = process.env.REPORT_NOTIFY_EMAIL
    const resendKey   = process.env.RESEND_API_KEY
    const fromEmail   = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    // The feedback is already recorded above; skip email (don't error) if it
    // isn't configured. We return a coarse `email` status so a missing/broken
    // config is observable from the response (the raw Resend error is logged
    // server-side only, never returned, to avoid leaking config details on this
    // public endpoint).
    if (!notifyEmail || !resendKey) {
      console.warn(
        `[feedback] email skipped — missing config: ` +
        `REPORT_NOTIFY_EMAIL=${notifyEmail ? 'set' : 'MISSING'}, ` +
        `RESEND_API_KEY=${resendKey ? 'set' : 'MISSING'}`,
      )
      return NextResponse.json({ ok: true, email: 'skipped_no_config' })
    }

    // Hard daily cap on outbound email (audit F4). Claimed here, after the
    // feedback is durably recorded above, so hitting the cap — or a limiter
    // outage, which this fails closed on — costs the notification but never the
    // feedback itself.
    const budget = await emailSendBudget()
    if (!budget.ok) {
      return NextResponse.json({ ok: true, email: 'skipped_rate_capped' })
    }

    const resend = new Resend(resendKey)
    const categoryLabel = CATEGORY_LABELS[category] ?? (category ? String(category) : 'Feedback')

    const { data: emailData, error: emailError } = await resend.emails.send({
      from:    fromEmail,
      to:      notifyEmail,
      replyTo: safeEmail || undefined,
      subject: `[Mathsense] Feedback – ${categoryLabel.replace(/[\r\n]+/g, ' ').slice(0, 120)}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111827;">
          <h2 style="margin:0 0 4px;">💬 New feedback</h2>
          <p style="margin:0 0 20px;color:#6b7280;">Someone sent feedback through Mathsense.</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Category</td>
              <td style="padding:6px 0;font-weight:600;">${escapeHtml(categoryLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">From page</td>
              <td style="padding:6px 0;">${escapeHtml(context) || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Reply email</td>
              <td style="padding:6px 0;">${escapeHtml(safeEmail) || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">User</td>
              <td style="padding:6px 0;">${escapeHtml(userId ?? 'Anonymous')}</td>
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
      console.error('[feedback] Resend send failed:', emailError)
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ ok: false, email: 'error', emailError }, { status: 500 })
      }
      // In production the feedback is already saved; report a coarse failure
      // status (no detail) so the email problem is observable without leaking.
      return NextResponse.json({ ok: true, email: 'error' })
    }

    console.log(`[feedback] email sent ok (id=${emailData?.id ?? 'unknown'}, from=${fromEmail})`)
    return NextResponse.json({ ok: true, email: 'sent' })
  } catch (err) {
    console.error('feedback route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
