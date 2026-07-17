/**
 * Daily ad-campaign digest email — a pure builder (no I/O, no SDK clients), same
 * split as lib/email/reengagement.ts. The cron route (app/api/cron/ad-digest)
 * queries analytics_events and supplies the numbers; this just formats them.
 *
 * This is an internal ops email to the founder, not a marketing email to a
 * third party — no unsubscribe link, no click tracking, no CTA button.
 */

export type AdDigestInput = {
  /** e.g. "16 July 2026" — the UTC day being summarised. */
  dateLabel: string
  adSessions: number
  organicSessions: number
  /** Average ad sessions/day over the trailing 7 days (including the summarised day). */
  adSessions7dAvg: number
  /** Of ad sessions, how many reached a practice question. */
  adSessionsWithPractice: number
  signupsAd: number
  signupsOrganic: number
  /** Distinct sessions (ad + organic) over the trailing 7 days. */
  rolling7dSessions: number
  /** signup_success events over the trailing 7 days. */
  rolling7dSignups: number
}

export type BuiltEmail = { subject: string; html: string; text: string }

const pct = (n: number, d: number): string => (d > 0 ? `${Math.round((n / d) * 100)}%` : 'n/a')
const round1 = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export function buildAdDigestEmail(input: AdDigestInput): BuiltEmail {
  const {
    dateLabel, adSessions, organicSessions, adSessions7dAvg,
    adSessionsWithPractice, signupsAd, signupsOrganic,
    rolling7dSessions, rolling7dSignups,
  } = input

  const practiceRate = pct(adSessionsWithPractice, adSessions)

  const subject = `Ad digest ${dateLabel} — ${adSessions} ad session${adSessions === 1 ? '' : 's'}, ${practiceRate} practice rate`

  const lines = [
    `Sessions: ${adSessions} ad, ${organicSessions} organic (ad 7-day avg: ${round1(adSessions7dAvg)})`,
    `Practice rate (ad sessions): ${practiceRate} (${adSessionsWithPractice}/${adSessions})`,
    `Signups: ${signupsAd} ad, ${signupsOrganic} organic`,
    `7-day rolling: ${rolling7dSessions} sessions, ${rolling7dSignups} signups`,
  ]

  const text = [`Ad campaign digest — ${dateLabel}`, '', ...lines].join('\n')

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827;line-height:1.6;">
    <p style="font-size:16px;font-weight:700;margin:0 0 14px;color:#2563eb;">Ad campaign digest &mdash; ${dateLabel}</p>
    <ul style="margin:0;padding-left:18px;">
      ${lines.map(l => `<li style="margin:0 0 6px;">${l}</li>`).join('\n      ')}
    </ul>
  </div>`

  return { subject, html, text }
}
