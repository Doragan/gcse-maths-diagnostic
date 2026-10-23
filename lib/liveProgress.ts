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

/**
 * How far through the set task someone is.
 *
 * `done` is whatever the completion rule COUNTS, which differs by mode: unique
 * questions attempted, correct answers, or raw attempts. That is the point of
 * reporting it here rather than letting a view pick a number — the figure a
 * teacher reads as progress is then, by construction, the same figure
 * `is_complete` is decided on.
 *
 * Null when there is no target to progress toward: a mastery_based task, which
 * is open-ended by design, or nothing assigned at all.
 */
export type Progress = { done: number; target: number }

export type ProgressRow = {
  subject_id: string
  display_name: string
  year_group: string | null
  total_attempts: number
  correct_count: number
  questions_started: number
  /** Derived from `progress` — never set independently of it. */
  is_complete: boolean
  progress: Progress | null
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
    /**
     * What a pool-mode score is out of. Defaults to `'attempted'`, which is the
     * behaviour every caller had before class sessions existed.
     *
     * ── Why this is an option and not just a fix ────────────────────────────
     *
     * In pool/attempt_once the denominator was the number of questions a person
     * had TRIED, so on a live class view someone one question in read "1/1"
     * while someone who had finished all three read "2/3" — the pupil furthest
     * behind looking like full marks, on the screen whose entire job is
     * comparing a class at a glance. `'target'` scores out of what was asked
     * for instead, so the column reads 0/3, 1/3, 2/3 and sorts by eye.
     *
     * It is an option rather than a change to the existing behaviour because
     * the assignment view is live and a teacher has been reading those numbers;
     * the same argument probably applies there, but that is a product decision
     * about an existing surface rather than part of building a new one.
     *
     * It only affects pool/attempt_once. Picked mode already scores out of the
     * assigned count, pool/until_correct already scores out of the target, and
     * mastery_based has no target to score against.
     */
    scoreAgainst?: 'attempted' | 'target'
  },
): ProgressRow[] {
  const { selectionMode, completionMode, assignedCount, scoreAgainst = 'attempted' } = opts

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

    // Each branch sets `progress`, and completion is DERIVED from it below.
    // Before this they were computed side by side, so a change to one could
    // leave a row reading "2 of 10" and "Complete" at the same time. A teacher
    // watching a lesson would have no way to tell which number to believe.
    let progress: Progress | null = null
    let score: string | null = null

    if (assignedCount <= 0) {
      // ── Nothing assigned ──────────────────────────────────────────────────
      //
      // Reachable two ways: a PICKED assignment with no questions on it, and a
      // POOL one whose `target_count` is null (the column is nullable, and the
      // route resolves null to 0).
      //
      // Every comparison below is `>= assignedCount`, so with a target of zero
      // they are all trivially satisfied and every person on the roster read
      // "✓ Complete" — including people who had done nothing, on an assignment
      // that contained nothing to do. That was carried through the extraction
      // unchanged and pinned by a test, on the grounds that a refactor is the
      // wrong place to change what a teacher sees; fixing it deliberately is a
      // different matter.
      //
      // You cannot have completed a task with no content in it, so nobody is
      // complete. And there is no target to score against, so the score is the
      // no-target form — or nothing at all when there is also nothing done,
      // which the table renders as a dash rather than "0/0".
      // No target, so no progress toward one either.
      score      = mine.length > 0 ? `${correctCount}/${mine.length}` : null
    } else if (selectionMode === 'picked') {
      if (completionMode === 'attempt_once') {
        progress = { done: attemptedQIds.size, target: assignedCount }
        score    = `${correctQIds.size}/${assignedCount}`
      } else if (completionMode === 'until_correct') {
        progress = { done: correctQIds.size, target: assignedCount }
        score    = `${correctQIds.size}/${assignedCount}`
      } else {
        // mastery_based — open-ended, so there is no target to be short of.
        score = `${correctCount}/${mine.length}`
      }
    } else {
      if (completionMode === 'attempt_once') {
        progress   = { done: mine.length, target: assignedCount }
        // The one place `scoreAgainst` bites. See its note on the options type.
        // No `assignedCount > 0` guard needed here any more — a target of zero
        // is handled by the "nothing assigned" branch above, which is what
        // stops this rendering "2/0".
        score      = scoreAgainst === 'target'
          ? `${correctCount}/${assignedCount}`
          : `${correctCount}/${mine.length}`
      } else if (completionMode === 'until_correct') {
        progress   = { done: correctCount, target: assignedCount }
        score      = `${correctCount}/${assignedCount}`
      } else {
        // mastery_based has no target to score against, whatever is asked for.
        score = `${correctCount}/${mine.length}`
      }
    }

    // The one place completion is decided. An open-ended task is never
    // complete, which is what a null progress means.
    const isComplete = progress !== null && progress.done >= progress.target

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
      progress,
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
