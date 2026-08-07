/**
 * Anonymous practice, held in localStorage until the student signs in.
 *
 * Someone can practise without an account; those attempts have nowhere to go
 * (practice_attempts is keyed on the student), so they wait in localStorage —
 * not sessionStorage, because the store has to survive an email-confirmation or
 * OAuth round-trip — and are inserted on login by migratePendingPractice.
 *
 * The key thing this module gets right is WHEN each attempt happened. The store
 * used to hold no timestamp, so the migrated rows fell back to the column
 * default now(); and since they go in as one multi-row insert, now() is the
 * transaction time, so a week of practice landed on a single identical instant.
 * That matters because calculateMastery sorts by attempted_at to take the last
 * five — with every key tied, which five count is whatever order the query
 * returns, and the fast-track branch (which reads the EARLIEST three) can pick
 * the wrong three outright. Spaced review and the re-engagement cron's
 * last_attempt also read the whole batch as brand new.
 */

export const PENDING_KEY = 'pending_practice'

/** Cap the store so a long anonymous run can't bloat localStorage. */
export const PENDING_CAP = 200

export type PendingAttempt = {
  question_id: string
  skill_ids: string[]
  correct: boolean
  kind?: string
  /** ISO time the question was actually answered. Absent on pre-2026-08 entries. */
  at?: string
}

export type PracticeAttemptRow = {
  student_id: string
  question_id: string
  skill_ids: string[]
  correct: boolean
  kind: string
  attempted_at: string
}

function isPendingAttempt(a: unknown): a is PendingAttempt {
  if (typeof a !== 'object' || a === null) return false
  const o = a as Record<string, unknown>
  return typeof o.question_id === 'string'
    && Array.isArray(o.skill_ids)
    && o.skill_ids.every(s => typeof s === 'string')
    && typeof o.correct === 'boolean'
}

/**
 * Turn the stored attempts into practice_attempts rows, resolving a real
 * timestamp for each.
 *
 * Pure, and takes `nowMs` rather than reading the clock, so it is testable.
 *
 * Three cases:
 * - **Has `at`** — trust it, but clamp to `nowMs`. A device with a fast clock
 *   would otherwise write a future time, which pins that attempt at the top of
 *   the mastery window until the real clock catches up.
 * - **No `at`** (written before this module existed) — synthesise one, spacing
 *   the batch a second apart so it lands in the minute before login IN ORDER.
 *   The order is meaningful: entries are appended as they are answered. This is
 *   the old behaviour minus the ties, and it ages out as those stores drain.
 * - **Malformed** — dropped, so one corrupt entry can't fail the whole insert
 *   and cost the student everything they practised.
 */
export function pendingPracticeRows(
  raw: unknown,
  studentId: string,
  nowMs: number,
): PracticeAttemptRow[] {
  const batch = (Array.isArray(raw) ? raw : []).filter(isPendingAttempt).slice(-PENDING_CAP)
  // Fallback clock for entries with no `at`: seeded so a wholly legacy batch
  // ends at nowMs rather than starting there.
  let fallback = nowMs - batch.length * 1000

  return batch.map(a => {
    const parsed = Date.parse(a.at ?? '')
    let t: number
    if (Number.isFinite(parsed)) {
      t = Math.min(parsed, nowMs)
    } else {
      fallback += 1000
      t = Math.min(fallback, nowMs)
    }
    return {
      student_id:  studentId,
      question_id: a.question_id,
      skill_ids:   a.skill_ids,
      correct:     a.correct,
      // 'exam' is positive-only in calculateMastery, so an unrecognised value
      // must fall back to 'mastery' — the stricter of the two.
      kind:        a.kind === 'exam' ? 'exam' : 'mastery',
      attempted_at: new Date(t).toISOString(),
    }
  })
}

/**
 * Append one anonymous attempt to the store. Best-effort: localStorage may be
 * full or disabled (private browsing), and losing an anonymous attempt must
 * never break the practice flow.
 */
export function appendPendingAttempt(a: Omit<PendingAttempt, 'at'>) {
  if (typeof window === 'undefined') return
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]')
    const pending = Array.isArray(raw) ? raw : []
    pending.push({ ...a, at: new Date().toISOString() })
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending.slice(-PENDING_CAP)))
  } catch { /* best-effort */ }
}
