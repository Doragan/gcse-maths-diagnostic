import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { skills } from '../../../data/skills'
import { rateLimitEmail, emailSendBudget } from '../../../lib/rateLimit'

const ISSUE_LABELS: Record<string, string> = {
  wrong_answer:    'Wrong answer',
  unclear_wording: 'Confusing wording',
  broken_display:  'Broken display',
  other:           'Other',
}

// Escape user-supplied values before interpolating them into the email HTML.
// The report fields (description, studentId, issueType, renderedValues, …) are
// attacker-controllable via the public report endpoint, so any '<', '"', etc.
// must be neutralised to prevent HTML/markup injection into the notification.
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

    const { questionId, issueType, description, renderedValues, studentId, sessionId, answerContext } =
      await req.json()

    if (!questionId || !issueType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Instantiate the admin client per-request (not at module scope) so a missing
    // key can't throw during the production build's page-data collection. (S4)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // ── 1. Record in analytics_events ─────────────────────────────────────────
    await supabase.from('analytics_events').insert({
      event:      'question_report',
      path:       `/practice/question/${questionId}`,
      session_id: sessionId ?? 'unknown',
      properties: {
        question_id:     questionId,
        issue_type:      issueType,
        description:     description ?? null,
        rendered_values: renderedValues ?? {},
        student_id:      studentId ?? null,
        answer_context:  answerContext ?? null,
      },
    })

    // ── 2. Look up question metadata for the email ────────────────────────────
    const { data: question } = await supabase
      .from('questions')
      .select('skill_ids, difficulty, is_published, kind, calculator')
      .eq('id', questionId)
      .single()

    const skillNames = (question?.skill_ids ?? [])
      .map((id: string) => skills.find(s => s.id === id)?.name ?? id)
      .join(', ')

    // ── 3. Send email notification ────────────────────────────────────────────
    const notifyEmail = process.env.REPORT_NOTIFY_EMAIL
    const resendKey   = process.env.RESEND_API_KEY
    const fromEmail   = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const siteUrl     = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

    // The report is already recorded in analytics_events above; email is a
    // best-effort notification. Skip it (don't error) if it isn't configured.
    if (!notifyEmail || !resendKey) {
      console.warn('REPORT_NOTIFY_EMAIL or RESEND_API_KEY not set — skipping email')
      return NextResponse.json({ ok: true })
    }

    // Hard daily cap on outbound email (audit F4). Claimed here, after the
    // report is durably recorded above, so hitting the cap — or a limiter
    // outage, which this fails closed on — costs the notification but never the
    // report itself. Shares one global budget with /api/feedback.
    const budget = await emailSendBudget()
    if (!budget.ok) {
      return NextResponse.json({ ok: true, email: 'skipped_rate_capped' })
    }

    // Instantiate Resend here (not at module scope) so a missing key can't throw
    // during the production build's page-data collection.
    const resend = new Resend(resendKey)

    // encodeURIComponent the id so a hostile value can't break out of the href.
    const questionUrl   = `${siteUrl}/practice/question/${encodeURIComponent(questionId)}`
    const publishedFlag = question?.is_published ? 'Published' : '⚠ Draft'
    const difficultyStr = question ? '★'.repeat(question.difficulty) + '☆'.repeat(5 - question.difficulty) : '—'

    const paramsHtml = Object.entries(renderedValues ?? {})
      .map(([k, v]) => `<tr><td style="padding:3px 10px 3px 0;color:#6b7280;">${escapeHtml(k)}</td><td style="padding:3px 0;font-weight:600;">${escapeHtml(v)}</td></tr>`)
      .join('')

    // The student's answer(s) at report time — the most useful triage signal for
    // a "wrong answer" report. All fields are attacker-controllable, so escape.
    const markLabel = (c: unknown) => c === true ? '✓ Correct' : c === false ? '✗ Incorrect' : '—'
    const ac = answerContext && typeof answerContext === 'object' ? answerContext : null
    let answerHtml = ''
    if (ac) {
      const cell = (s: string, extra = '') => `<td style="padding:3px 12px 3px 0;${extra}">${s}</td>`
      const label = (s: string) => `<td style="padding:3px 12px 3px 0;color:#6b7280;white-space:nowrap;vertical-align:top;">${s}</td>`
      let rows = ''
      if (Array.isArray(ac.parts) && ac.parts.length > 0) {
        rows = ac.parts.map((p: Record<string, unknown>) =>
          `<tr>${label(escapeHtml(p.label))}` +
          cell(`<strong>${escapeHtml(p.studentAnswer) || '<em>blank</em>'}</strong>`) +
          cell(p.correct === true ? '✓' : '✗') +
          cell(`<span style="color:#6b7280;">expected ${escapeHtml(p.expectedAnswer ?? '—')}</span>`) +
          `</tr>`).join('')
      } else {
        rows =
          `<tr>${label('Answer')}${cell(`<strong>${escapeHtml(ac.studentAnswer) || '<em>blank</em>'}</strong>`)}</tr>` +
          (ac.answered ? `<tr>${label('Marked')}${cell(markLabel(ac.correct))}</tr>` : '') +
          (ac.answered ? `<tr>${label('Expected')}${cell(escapeHtml(ac.expectedAnswer ?? '—'))}</tr>` : '') +
          (ac.answerType ? `<tr>${label('Answer type')}${cell(escapeHtml(ac.answerType))}</tr>` : '')
      }
      const note = ac.answered ? '' : ' <span style="color:#9ca3af;">(reported before submitting)</span>'
      answerHtml = `
        <p style="margin:0 0 6px;font-weight:600;color:#374151;">Student's answer${Array.isArray(ac.parts) && ac.parts.length > 1 ? 's' : ''}${note}</p>
        <table style="border-collapse:collapse;margin-bottom:20px;background:#f9fafb;border-radius:6px;width:auto;">
          ${rows}
        </table>`
    }

    const kindStr = question?.kind ? escapeHtml(question.kind) : '—'
    const calcStr = question?.calculator ? escapeHtml(question.calculator) : '—'

    const { error: emailError } = await resend.emails.send({
      from:    fromEmail,
      to:      notifyEmail,
      subject: `[Mathsense] Question report – ${(ISSUE_LABELS[issueType] ?? String(issueType)).replace(/[\r\n]+/g, ' ').slice(0, 120)}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111827;">
          <h2 style="margin:0 0 4px;">🚩 Question report</h2>
          <p style="margin:0 0 20px;color:#6b7280;">Someone flagged an issue with a practice question.</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Issue type</td>
              <td style="padding:6px 0;font-weight:600;">${escapeHtml(ISSUE_LABELS[issueType] ?? issueType)}</td>
            </tr>
            ${description ? `
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Details</td>
              <td style="padding:6px 0;">${escapeHtml(description)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Skill</td>
              <td style="padding:6px 0;">${escapeHtml(skillNames) || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Difficulty</td>
              <td style="padding:6px 0;">${difficultyStr}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Status</td>
              <td style="padding:6px 0;">${publishedFlag} · ${kindStr} · ${calcStr}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">Reporter</td>
              <td style="padding:6px 0;">${escapeHtml(studentId ?? 'Anonymous')}</td>
            </tr>
          </table>

          ${answerHtml}

          ${paramsHtml ? `
          <p style="margin:0 0 6px;font-weight:600;color:#374151;">Parameter values shown</p>
          <table style="border-collapse:collapse;margin-bottom:20px;background:#f9fafb;padding:10px;border-radius:6px;width:auto;">
            ${paramsHtml}
          </table>` : ''}

          <a href="${questionUrl}"
             style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px;">
            View question →
          </a>

          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Question ID: ${escapeHtml(questionId)}
          </p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      // Surface the error in dev so it's visible in the browser network tab
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ ok: false, emailError }, { status: 500 })
      }
    }

    console.log(`Report email sent → ${notifyEmail} (from: ${fromEmail})`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('report-question route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
