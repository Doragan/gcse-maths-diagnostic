/**
 * Live-progress rules for the assignment view (docs/audit/24, Part 3).
 *
 * Kept pure and clock-injected so the polling decisions can be tested without
 * a DOM or a timer — the component is then just wiring.
 *
 * The standing constraint from Part 1 applies here too (docs/audit/12
 * decision 2): this reports PRESENCE and PROGRESS, never a verdict. There is
 * no "stuck", no "idle for N minutes", no per-question timing. A teacher looks
 * at who is working and how far they are, and draws their own conclusions.
 */

/** A student counts as answering now if their last attempt is this recent. */
export const ANSWERING_NOW_MS = 2 * 60 * 1000

/** Polling interval while the tab is visible. */
export const POLL_MS = 10_000

/**
 * Stop polling after this long with no change at all. A teacher leaves tabs
 * open for days; a lesson lasts an hour.
 */
export const IDLE_PAUSE_MS = 45 * 60 * 1000

export type ResultsHead = { attemptCount: number; lastAttemptAt: string | null }

/** True when a probe shows work has happened since the last one. */
export function headChanged(prev: ResultsHead | null, next: ResultsHead): boolean {
  if (prev === null) return true
  return prev.attemptCount !== next.attemptCount
    || prev.lastAttemptAt !== next.lastAttemptAt
}

/** Is this student answering right now? */
export function isAnsweringNow(
  lastAttemptAt: string | null,
  now: number = Date.now(),
  windowMs: number = ANSWERING_NOW_MS,
): boolean {
  if (!lastAttemptAt) return false
  const age = now - new Date(lastAttemptAt).getTime()
  // A clock skewed slightly ahead of the server shouldn't read as "not here".
  return age < windowMs && age > -windowMs
}

/** Whether polling should stand down, having seen nothing change for a while. */
export function shouldPause(
  lastChangeAt: number,
  now: number = Date.now(),
  idleMs: number = IDLE_PAUSE_MS,
): boolean {
  return now - lastChangeAt >= idleMs
}

/**
 * How a student's last attempt reads in the table.
 *
 * Live use needs more than a date — during a lesson every row says "today".
 * Minute granularity is as fine as this goes, deliberately.
 */
export function formatLastAttempt(
  lastAttemptAt: string | null,
  now: number = Date.now(),
): string {
  if (!lastAttemptAt) return '—'
  if (isAnsweringNow(lastAttemptAt, now)) return 'answering now'

  const then = new Date(lastAttemptAt)
  const nowDate = new Date(now)
  const sameDay = then.getFullYear() === nowDate.getFullYear()
    && then.getMonth() === nowDate.getMonth()
    && then.getDate() === nowDate.getDate()

  return sameDay
    ? then.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : then.toLocaleDateString('en-GB')
}
