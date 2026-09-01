/**
 * The email channels that issue opaque send-id links, and the per-channel facts
 * the click / unsubscribe routes need.
 *
 * Both channels put an unguessable send-row uuid in their links (`?s=<uuid>`)
 * and never a student id, so the routes have to know WHICH ledger to resolve the
 * token against — carried as `&k=`. Absent or unrecognised means the
 * re-engagement channel, so the links already sitting in people's inboxes from
 * before the nudge existed keep working.
 *
 * `k` selects a table from this fixed map and nothing else. It is never
 * interpolated into a query, and the CTA destination is looked up here rather
 * than taken from the URL — that is what stops the click route becoming an open
 * redirect.
 */

export type SendKind = 'reengagement' | 'nudge'

export const SEND_TABLE: Record<SendKind, string> = {
  reengagement: 'reengagement_sends',
  nudge:        'weekly_nudge_sends',
}

/** Where each channel's CTA lands. Fixed server-side, never from the request. */
export const SEND_DESTINATION: Record<SendKind, string> = {
  // "Pick up where you left off" — a lapsed student gets the overview first.
  reengagement: '/student/dashboard',
  // "Practise a few now" — an active student wants questions, not statistics.
  nudge:        '/practice',
}

/** analytics_events `path` + event-name prefix, so the two funnels stay separable. */
export const SEND_ANALYTICS: Record<SendKind, { path: string; prefix: string }> = {
  reengagement: { path: '/email/reengagement', prefix: 'reengagement_email' },
  nudge:        { path: '/email/weekly-nudge', prefix: 'weekly_nudge_email' },
}

/** Unknown / missing → 'reengagement', keeping already-sent links valid. */
export function parseSendKind(raw: string | null | undefined): SendKind {
  return raw === 'nudge' ? 'nudge' : 'reengagement'
}
