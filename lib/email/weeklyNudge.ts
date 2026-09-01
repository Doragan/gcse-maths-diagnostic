/**
 * Weekly-goal nudge email — a pure builder, like lib/email/reengagement.ts.
 * The cron route (app/api/cron/weekly-nudge) supplies the data and sends.
 *
 * This one goes to ACTIVE students: they practised this week and are short of
 * the 10-question goal. The re-engagement email is its opposite number (lapsed
 * students, 4+ days idle), and the two cohorts are disjoint by construction —
 * see the selector in the migration.
 *
 * ── Deliberately not a pressure email ───────────────────────────────────────
 * The obvious version of this — "2 days left!", "don't lose your 3-week
 * streak!" — is a countdown plus loss aversion, aimed at children. That is the
 * exact pattern the UK Age Appropriate Design Code calls out, and it is also
 * the pattern the weekly goal was built to get AWAY from. So:
 *
 *   • No deadline, no countdown, no "last chance".
 *   • No mention of the streak at all. Naming a streak in a nudge turns it into
 *     something to lose; it belongs on the dashboard as a reward, not in the
 *     inbox as a lever.
 *   • An explicit line saying a missed week costs nothing — which is TRUE of
 *     the model (mastery is computed from all attempts ever; a quiet week
 *     subtracts nothing), so it costs no honesty to say it.
 *   • Never sent to someone on zero: that is nagging, not nudging, and it is
 *     the re-engagement email's job anyway.
 *
 * The nudge is the FACT ("you're 3 off") plus an easy way to act. If that isn't
 * motivating enough on its own, the answer is a better product, not a countdown.
 */

// Neutralise markup in dynamic values before interpolating into the HTML —
// mirrors escapeHtml in reengagement.ts and the feedback/report routes.
const escapeHtml = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * How recently a student must have practised to count as ACTIVE for the nudge,
 * given the re-engagement cron's lapsed threshold.
 *
 * These have to be two DIFFERENT numbers, which is not obvious. The cohorts look
 * disjoint — "practised within N days" versus "hasn't practised within N days" —
 * but the two crons evaluate that test at different times of day, and each one
 * measures back from its OWN run. With both on 4 days, the nudge running at
 * 10:00 admits anyone active since 10:00 four days ago, while the re-engagement
 * run at 16:00 admits anyone idle since 16:00 four days ago — so a student whose
 * last attempt fell in that six-hour band gets both emails on the same day.
 *
 * Shaving a day off the nudge's window closes the overlap for any pair of run
 * times, rather than for one particular schedule. It leaves a band where neither
 * email fires, which is the harmless direction to err in: a missed nudge costs
 * nothing, two emails in one morning costs trust.
 */
export function nudgeActiveDays(reengagementDays: number): number {
  return Math.max(1, reengagementDays - 1)
}

export type WeeklyNudgeEmailInput = {
  /** Student's display name; first word only, neutral greeting if absent. */
  displayName: string
  /** Questions answered so far in the current week. */
  answered: number
  /** The weekly goal (injected rather than imported, so the email states what the cron actually used). */
  goal: number
  /** Click-tracked URL that redirects to practice (CTA target). */
  practiceUrl: string
  /** One-click unsubscribe URL (opaque send-id token, no login needed). */
  unsubscribeUrl: string
}

export type BuiltEmail = { subject: string; html: string; text: string }

function firstName(displayName: string): string {
  return (displayName ?? '').trim().split(/\s+/)[0] ?? ''
}

export function buildWeeklyNudgeEmail(input: WeeklyNudgeEmailInput): BuiltEmail {
  const name = firstName(input.displayName)
  const greet = name ? `Hi ${escapeHtml(name)},` : 'Hi there,'

  const remaining = Math.max(0, input.goal - input.answered)
  const q = (n: number) => `${n} question${n === 1 ? '' : 's'}`

  // Lead with what they've done, not what they haven't. The number they are
  // short by follows as information, not as a demand.
  const subject = name
    ? `Nice work this week, ${name} — ${q(remaining)} to go`
    : `Nice work this week — ${q(remaining)} to go`

  const didLine = `You’ve answered ${q(input.answered)} on Mathsense this week.`
  const goLine  = `That leaves ${q(remaining)} to reach your weekly goal of ${input.goal}.`
  // The anti-pressure line. Load-bearing: it is what stops this being a
  // countdown email, and it is a true description of how the model works.
  const easeLine = `No rush though — the goal starts fresh every Monday, and a quiet week doesn’t undo anything you’ve already learned.`

  const text = [
    greet,
    '',
    didLine,
    goLine,
    '',
    easeLine,
    '',
    `Fancy a few now? ${input.practiceUrl}`,
    '',
    'You’re getting this because you turned on practice reminders when you created your free Mathsense account.',
    `Don’t want these? Unsubscribe in one click: ${input.unsubscribeUrl}`,
  ].join('\n')

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827;line-height:1.6;">
    <p style="font-size:18px;font-weight:700;margin:0 0 16px;color:#2563eb;">Mathsense</p>

    <p style="margin:0 0 12px;">${greet}</p>
    <p style="margin:0 0 12px;">${escapeHtml(didLine)}</p>
    <p style="margin:0 0 20px;">${escapeHtml(goLine)}</p>

    <a href="${escapeHtml(input.practiceUrl)}"
       style="display:inline-block;background:#2563eb;color:#ffffff;padding:13px 26px;
              border-radius:8px;text-decoration:none;font-weight:600;margin:0 0 22px;">
      Practise a few now &rarr;
    </a>

    <p style="margin:0 0 22px;color:#374151;">${escapeHtml(easeLine)}</p>

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
