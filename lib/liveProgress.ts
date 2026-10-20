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

// ── Per-subject aggregation ──────────────────────────────────────────────────
//
// Extracted from app/api/assignments/[id]/results/route.ts, which had two
// separable halves: resolving a roster, and turning attempts into per-person
// progress. Only the FIRST half differs between an assignment and a no-login
// class session (docs/audit/29 §6) — an assignment walks targets → classes →
// memberships → students across four queries, a session reads one table — so
// the second half lives here, pure, and both routes call it.
//
// "Subject" rather than "student" deliberately: in a class session the row
// belongs to a session participant, who has no account and is not a student
// record. Calling that field student_id would have been a lie in exactly the
// place the design's whole point is that no student id exists.

export type SelectionMode  = 'picked' | 'pool'
export type CompletionMode = 'attempt_once' | 'until_correct' | 'mastery_based'

/** Whoever the progress is being reported for: one pupil, however identified. */
export type RosterEntry = {
  id: string
  display_name: string
  year_group?: string | null
}

/** One answer. `subject_id` matches a RosterEntry's `id`. */
export type AttemptRow = {
  subject_id: string
  question_id: string
  correct: boolean
  attempted_at: string
}

export type ProgressRow = {
  subject_id: string
  display_name: string
  year_group: string | null
  total_attempts: number
  correct_count: number
  questions_started: number
  is_complete: boolean
  score: string | null
  last_attempt_at: string | null
}

/**
 * Per-subject progress, and the order to show it in.
 *
 * Behaviour is a faithful port of the route this came from, including one edge
 * worth knowing about: when `assignedCount` is 0 every comparison it feeds is
 * trivially satisfied, so everybody reads as complete. That is reachable today
 * (a picked assignment with no questions, or a pool one whose `target_count` is
 * null) and is pinned by a test rather than quietly changed here — a refactor
 * is the wrong place to alter what a teacher sees. Callers should pass a real
 * target; class sessions always do.
 *
 * Attempts are grouped once rather than filtered per subject, and the last
 * attempt is taken as a maximum rather than trusting the caller to have sorted
 * — the assignment route does order its query, but a pure function should not
 * depend on that.
 */
export function aggregateProgress(
  roster: RosterEntry[],
  attempts: AttemptRow[],
  opts: {
    selectionMode: SelectionMode
    completionMode: CompletionMode | string
    assignedCount: number
  },
): ProgressRow[] {
  const { selectionMode, completionMode, assignedCount } = opts

  const bySubject = new Map<string, AttemptRow[]>()
  for (const a of attempts) {
    const list = bySubject.get(a.subject_id)
    if (list) list.push(a)
    else bySubject.set(a.subject_id, [a])
  }

  const rows = roster.map(person => {
    const mine = bySubject.get(person.id) ?? []

    const attemptedQIds = new Set(mine.map(a => a.question_id))
    const correctQIds   = new Set(mine.filter(a => a.correct).map(a => a.question_id))
    const correctCount  = mine.filter(a => a.correct).length

    let isComplete = false
    let score: string | null = null

    if (selectionMode === 'picked') {
      if (completionMode === 'attempt_once') {
        isComplete = attemptedQIds.size >= assignedCount
        score      = `${correctQIds.size}/${assignedCount}`
      } else if (completionMode === 'until_correct') {
        isComplete = correctQIds.size >= assignedCount
        score      = `${correctQIds.size}/${assignedCount}`
      } else {
        // mastery_based — open-ended, so there is no target to be short of.
        score = `${correctCount}/${mine.length}`
      }
    } else {
      if (completionMode === 'attempt_once') {
        isComplete = mine.length >= assignedCount
        score      = `${correctCount}/${mine.length}`
      } else if (completionMode === 'until_correct') {
        isComplete = correctCount >= assignedCount
        score      = `${correctCount}/${assignedCount}`
      } else {
        score = `${correctCount}/${mine.length}`
      }
    }

    let lastAttemptAt: string | null = null
    for (const a of mine) {
      if (lastAttemptAt === null || a.attempted_at > lastAttemptAt) lastAttemptAt = a.attempted_at
    }

    return {
      subject_id:        person.id,
      display_name:      person.display_name,
      year_group:        person.year_group ?? null,
      total_attempts:    mine.length,
      correct_count:     correctCount,
      questions_started: attemptedQIds.size,
      is_complete:       isComplete,
      score,
      last_attempt_at:   lastAttemptAt,
    }
  })

  // Complete first, then whoever answered most recently, then alphabetically.
  // During a lesson this puts the people still working at the top of the part
  // of the list that is still moving.
  rows.sort((a, b) => {
    if (a.is_complete !== b.is_complete) return a.is_complete ? -1 : 1
    if (a.last_attempt_at && b.last_attempt_at)
      return b.last_attempt_at.localeCompare(a.last_attempt_at)
    if (a.last_attempt_at) return -1
    if (b.last_attempt_at) return 1
    return a.display_name.localeCompare(b.display_name)
  })

  return rows
}

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
 * The "Avg score" figure above the results table.
 *
 * `score` arrives from the results route as a fraction STRING — "3/10" — whose
 * denominator is the assigned count in some completion modes and the attempt
 * count in others. It used to be read with `parseInt`, which takes the numerator
 * alone, so the tile showed the mean number of correct answers with a percent
 * sign after it: a student on 3/10 counted as 3%.
 *
 * Averaged over students who have STARTED. The tile sits beside "Started" and
 * "Complete", so it should not double as a progress meter — counting a class who
 * have not opened the assignment yet as 0% makes the number meaningless for the
 * first ten minutes of a lesson, which is exactly when it is being watched.
 *
 * Null when nobody has a usable score, which the caller renders as a dash.
 */
export function averageScorePct(
  rows: { score: string | null; total_attempts: number }[],
): number | null {
  const pcts = rows.flatMap(r => {
    if (r.total_attempts === 0 || !r.score) return []
    const [got, outOf] = r.score.split('/').map(Number)
    // "0/0" is a real payload (mastery_based before the first answer lands), and
    // a malformed one must not become NaN and poison the mean.
    if (!Number.isFinite(got) || !Number.isFinite(outOf) || outOf <= 0) return []
    return [(got / outOf) * 100]
  })

  if (pcts.length === 0) return null
  return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length)
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
