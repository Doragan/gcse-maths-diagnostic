/**
 * Re-engagement email content — a pure builder (no I/O, no SDK clients) so it's
 * trivially unit-testable and reviewable in isolation. The cron route
 * (app/api/cron/reengagement) supplies the data and does the sending.
 *
 * Children's-Code-safe by construction:
 *   • Honest personalisation from the student's OWN practice data only
 *     (questions answered, a couple of skills they actually practised).
 *   • Mentions only real dashboard features — weak spots, mastered skills,
 *     progress over time. NO "skill map" (that feature doesn't exist).
 *   • No dark patterns: no countdowns, no "you'll lose everything", no guilt.
 *   • Plain, age-appropriate UK English.
 *   • Says who it's from and why they got it, with a one-click unsubscribe.
 */

// Neutralise any markup in dynamic values (display name, skill names) before
// interpolating into the email HTML — mirrors the escapeHtml in the feedback /
// report-question routes.
const escapeHtml = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export type ReengagementEmailInput = {
  /** Student's display name; we use the first word only, falling back to a neutral greeting. */
  displayName: string
  /** Lifetime practice questions answered — stated honestly. */
  totalAttempts: number
  /** Human-readable names of a few skills they actually practised (already resolved from ids). */
  skillNames: string[]
  /** Click-tracked URL that redirects to the dashboard (CTA target). */
  dashboardUrl: string
  /** One-click unsubscribe URL (opaque send-id token, no login needed). */
  unsubscribeUrl: string
}

export type BuiltEmail = { subject: string; html: string; text: string }

/** First word of a name, for a friendly-but-not-creepy greeting. Empty → neutral. */
function firstName(displayName: string): string {
  const first = (displayName ?? '').trim().split(/\s+/)[0] ?? ''
  return first
}

/** "algebra and fractions" / "algebra, fractions and ratios" — natural list, max 2 shown. */
function skillPhrase(skillNames: string[]): string {
  const names = skillNames.filter(Boolean).slice(0, 2)
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names[0]} and ${names[1]}`
}

export function buildReengagementEmail(input: ReengagementEmailInput): BuiltEmail {
  const name   = firstName(input.displayName)
  const greet  = name ? `Hi ${escapeHtml(name)},` : 'Hi there,'
  const skills = skillPhrase(input.skillNames)

  const subject = name
    ? `Ready for your next Mathsense session, ${name}?`
    : `Ready for your next Mathsense session?`

  // Honest, specific opener built from their own data. Only mention skills if we
  // actually have them; only mention a count if it's a real number.
  const didLine = input.totalAttempts > 0
    ? `A little while ago you answered ${input.totalAttempts} question${input.totalAttempts === 1 ? '' : 's'} on Mathsense${skills ? ` — including some on ${escapeHtml(skills)}` : ''}.`
    : `You made a start on Mathsense a little while ago.`

  // ── Plain-text part (good deliverability + accessible) ──────────────────────
  const text = [
    greet,
    '',
    didLine,
    'Nice work — practising a bit at a time is exactly how GCSE maths sticks.',
    '',
    `Whenever you're ready, pick up where you left off: ${input.dashboardUrl}`,
    '',
    'Your dashboard shows the skills you’ve mastered, where your weak spots are, and how your progress is building over time.',
    '',
    'You’re getting this because you turned on practice reminders when you created your free Mathsense account.',
    `Don’t want these? Unsubscribe in one click: ${input.unsubscribeUrl}`,
  ].join('\n')

  // ── HTML part ───────────────────────────────────────────────────────────────
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827;line-height:1.6;">
    <p style="font-size:18px;font-weight:700;margin:0 0 16px;color:#2563eb;">Mathsense</p>

    <p style="margin:0 0 12px;">${greet}</p>
    <p style="margin:0 0 12px;">${escapeHtml(didLine)}</p>
    <p style="margin:0 0 20px;">Nice work — practising a bit at a time is exactly how GCSE maths sticks.</p>

    <a href="${escapeHtml(input.dashboardUrl)}"
       style="display:inline-block;background:#2563eb;color:#ffffff;padding:13px 26px;
              border-radius:8px;text-decoration:none;font-weight:600;margin:0 0 22px;">
      Pick up where you left off &rarr;
    </a>

    <p style="margin:0 0 22px;color:#374151;">
      Your dashboard shows the skills you&rsquo;ve mastered, where your weak spots are,
      and how your progress is building over time.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 14px;">
    <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;">
      You&rsquo;re getting this because you turned on practice reminders when you created
      your free Mathsense account.
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      Don&rsquo;t want these? <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#6b7280;">Unsubscribe</a> &mdash; one click, no hard feelings.
    </p>
  </div>`

  return { subject, html, text }
}
