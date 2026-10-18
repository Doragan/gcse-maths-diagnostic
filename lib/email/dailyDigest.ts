/**
 * Daily digest email — pure aggregation and builder (no I/O, no SDK clients), the
 * same split as lib/email/reengagement.ts. lib/email/dailyDigestData.ts fetches
 * the rows; the cron route (app/api/cron/ad-digest) sends the result. This file
 * only counts and formats, so it is unit-tested without a database.
 *
 * This is an internal ops email to the founder, not a marketing email to a
 * third party — no unsubscribe link, no click tracking, no CTA button.
 *
 * It was an ad-campaign funnel digest until paid ads stopped (2026-10-10). It now
 * answers the questions that outlast the campaign: is traffic arriving, are
 * people signing up, are students coming back, and are the paying ones active.
 * Everything is UTC days. Aggregates and opaque id prefixes only — no emails or
 * names, per the no-PII-in-analytics rule.
 */

const DAY_MS = 86_400_000

// ── Traffic ───────────────────────────────────────────────────────────────────

export type DigestEvent = {
  event: string
  session_id: string
  properties: Record<string, unknown> | null
  created_at: string
}

export type TrafficWindow = {
  /** Distinct sessions (browser tabs) that started in the window. */
  visits: number
  /** Visits with more than one event, not counting the cookie banner. */
  engaged: number
  /** Visits that carried a Google Ads click id. */
  adTagged: number
  signups: number
}

export type TrafficSummary = {
  yesterday: TrafficWindow
  last7: TrafficWindow
  prev7: TrafficWindow
}

// The cookie banner is shown to nearly everyone and answering it is an event, so
// counting it would make a visitor who only dismissed the banner look engaged.
const NOT_ENGAGEMENT = new Set(['cookie_consent'])

const hasGclid = (e: DigestEvent): boolean =>
  typeof e.properties?.gclid === 'string' && e.properties.gclid.length > 0

/**
 * Count visits, engaged visits, ad-tagged visits and signups over three UTC
 * windows ending at `todayStartMs`: yesterday, the last 7 days (including
 * yesterday) and the 7 days before that.
 *
 * A visit belongs to the day of its first event in the data. Signups are counted
 * by the day of the event itself. The maintainer's own traffic
 * (`properties.internal === true`, see lib/analytics.ts) is excluded.
 */
export function summariseTraffic(events: DigestEvent[], todayStartMs: number): TrafficSummary {
  const empty = (): TrafficWindow => ({ visits: 0, engaged: 0, adTagged: 0, signups: 0 })
  const out: TrafficSummary = { yesterday: empty(), last7: empty(), prev7: empty() }

  const windowsFor = (ms: number): TrafficWindow[] => {
    if (ms >= todayStartMs || ms < todayStartMs - 14 * DAY_MS) return []
    if (ms >= todayStartMs - DAY_MS) return [out.yesterday, out.last7]
    if (ms >= todayStartMs - 7 * DAY_MS) return [out.last7]
    return [out.prev7]
  }

  const sessions = new Map<string, { firstMs: number; counted: number; ad: boolean }>()
  for (const e of events) {
    if (e.properties?.internal === true) continue
    const ms = Date.parse(e.created_at)
    if (Number.isNaN(ms)) continue

    if (e.event === 'signup_success') {
      for (const w of windowsFor(ms)) w.signups++
    }

    const s = sessions.get(e.session_id) ?? { firstMs: ms, counted: 0, ad: false }
    if (ms < s.firstMs) s.firstMs = ms
    if (!NOT_ENGAGEMENT.has(e.event)) s.counted++
    if (hasGclid(e)) s.ad = true
    sessions.set(e.session_id, s)
  }

  for (const s of sessions.values()) {
    for (const w of windowsFor(s.firstMs)) {
      w.visits++
      if (s.counted > 1) w.engaged++
      if (s.ad) w.adTagged++
    }
  }
  return out
}

// ── Students ──────────────────────────────────────────────────────────────────

export type PracticeRow = { student_id: string; attempted_at: string }

export type StudentWindow = {
  /** Distinct students who answered at least one practice question. */
  practised: number
  /** Of those, whose first-ever practice answer fell inside the window. */
  newlyStarted: number
  /** Of those, who had practised before the window started. */
  returning: number
}

export type StudentSummary = { yesterday: StudentWindow; last7: StudentWindow }

/**
 * Who practised yesterday and over the last 7 days, split into students on their
 * first day of practice and students who have been here before. `attempts` must
 * be the non-placement attempts inside the last 7 days; `firstAttemptAt` maps a
 * student id to the timestamp of their first-ever non-placement attempt. A
 * student missing from the map falls back to their earliest attempt in `attempts`
 * — which can only over-count them as new, never as returning.
 */
export function summariseStudents(
  attempts: PracticeRow[],
  firstAttemptAt: Record<string, string>,
  todayStartMs: number,
): StudentSummary {
  const yesterdayStart = todayStartMs - DAY_MS
  const weekStart = todayStartMs - 7 * DAY_MS

  const yesterday = new Set<string>()
  const week = new Set<string>()
  const earliestInData = new Map<string, number>()
  for (const a of attempts) {
    const ms = Date.parse(a.attempted_at)
    if (Number.isNaN(ms) || ms < weekStart || ms >= todayStartMs) continue
    week.add(a.student_id)
    if (ms >= yesterdayStart) yesterday.add(a.student_id)
    const seen = earliestInData.get(a.student_id)
    if (seen === undefined || ms < seen) earliestInData.set(a.student_id, ms)
  }

  const firstMs = (id: string): number => {
    const known = Date.parse(firstAttemptAt[id] ?? '')
    return Number.isNaN(known) ? (earliestInData.get(id) as number) : known
  }
  const tally = (ids: Set<string>, windowStart: number): StudentWindow => {
    let newlyStarted = 0
    for (const id of ids) if (firstMs(id) >= windowStart) newlyStarted++
    return { practised: ids.size, newlyStarted, returning: ids.size - newlyStarted }
  }
  return { yesterday: tally(yesterday, yesterdayStart), last7: tally(week, weekStart) }
}

// ── Email ─────────────────────────────────────────────────────────────────────

export type PaidAccess = {
  /** Student id; only its first 8 characters are ever printed. */
  id: string
  /** Whole days since their last practice answer; null if they never practised. */
  daysSincePractised: number | null
}

export type DailyDigestInput = {
  /** e.g. "16 July 2026" — the UTC day being summarised. */
  dateLabel: string
  traffic: TrafficSummary
  students: StudentSummary
  totalStudents: number
  /** All students with unexpired paid access (a subset of them is listed in `paid`). */
  paidCount: number
  paid: PaidAccess[]
  founderSeatsLeft: number
  founderSeatCap: number
}

export type BuiltEmail = { subject: string; html: string; text: string }

const round1 = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const perDay = (weekTotal: number): string => round1(weekTotal / 7)
const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

const ago = (days: number | null): string => {
  if (days === null) return 'no practice recorded'
  if (days <= 0) return 'practised today'
  return `last practised ${days === 1 ? '1 day' : `${days} days`} ago`
}

const FOOTNOTE =
  'Engaged = a visit with more than one event, not counting the cookie banner. ' +
  'A visit is one browser tab, not one person. All days are UTC.'

export function buildDailyDigestEmail(input: DailyDigestInput): BuiltEmail {
  const { dateLabel, traffic, students, totalStudents, paidCount, paid, founderSeatsLeft, founderSeatCap } = input
  const { yesterday: ty, last7: t7, prev7: tp } = traffic

  const subject =
    `Mathsense daily — ${dateLabel}: ${plural(ty.engaged, 'engaged visit', 'engaged visits')}, ` +
    `${plural(ty.signups, 'signup', 'signups')}, ${students.yesterday.practised} practised`

  const sections: { heading: string; lines: string[] }[] = [
    {
      heading: 'Traffic',
      lines: [
        `Visits: ${ty.visits} (7-day avg ${perDay(t7.visits)}, previous 7 days ${perDay(tp.visits)})`,
        `Engaged visits: ${ty.engaged} (7-day avg ${perDay(t7.engaged)}, previous 7 days ${perDay(tp.engaged)})`,
        `Ad-tagged visits: ${ty.adTagged} (last 7 days: ${t7.adTagged})`,
      ],
    },
    {
      heading: 'Signups',
      lines: [`Yesterday: ${ty.signups} · last 7 days: ${t7.signups} · previous 7 days: ${tp.signups}`],
    },
    {
      heading: 'Students',
      lines: [
        `Practised yesterday: ${students.yesterday.practised} (${students.yesterday.newlyStarted} new, ${students.yesterday.returning} returning)`,
        `Practised in the last 7 days: ${students.last7.practised} (${students.last7.newlyStarted} new, ${students.last7.returning} returning)`,
        `Total students: ${totalStudents}`,
      ],
    },
    {
      heading: 'Paid access',
      lines: [
        `${paidCount} active · founder seats left: ${founderSeatsLeft} of ${founderSeatCap}`,
        ...paid.map(p => `${p.id.slice(0, 8)} — ${ago(p.daysSincePractised)}`),
        ...(paidCount > paid.length ? [`…and ${paidCount - paid.length} more`] : []),
      ],
    },
  ]

  const text = [
    `Mathsense daily digest — ${dateLabel}`,
    '',
    ...sections.flatMap(s => [s.heading.toUpperCase(), ...s.lines, '']),
    FOOTNOTE,
  ].join('\n')

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827;line-height:1.6;">
    <p style="font-size:16px;font-weight:700;margin:0 0 14px;color:#2563eb;">Mathsense daily digest &mdash; ${dateLabel}</p>
    ${sections
      .map(
        s => `<p style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;margin:16px 0 4px;">${s.heading}</p>
    <ul style="margin:0;padding-left:18px;">
      ${s.lines.map(l => `<li style="margin:0 0 4px;">${l}</li>`).join('\n      ')}
    </ul>`,
      )
      .join('\n    ')}
    <p style="font-size:12px;color:#6b7280;margin:18px 0 0;">${FOOTNOTE}</p>
  </div>`

  return { subject, html, text }
}
