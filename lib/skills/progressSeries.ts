import { calculateMastery, inferPrerequisiteMastery } from './masteryEngine'

// Turns a flat list of practice attempts into a time-bucketed series for the
// dashboard "Progress over time" chart. For each bucket boundary we replay the
// student's history *up to that point* and recompute mastery, so the line shows
// how the mastered-skill count actually grew (and can dip, honestly, if a skill
// regresses). Accuracy and activity are derived from the same buckets.

type Attempt = {
  skill_ids: string[]
  correct: boolean
  attempted_at: string
  kind?: 'mastery' | 'exam'   // passed through to calculateMastery (positive-only for 'exam')
}

export type ProgressPoint = {
  /** ISO timestamp of the bucket's end. */
  date: string
  /** Short axis label, e.g. "3 Jun". */
  label: string
  /** Mastered skills (incl. inferred) as of this bucket end. */
  mastered: number
  /** Cumulative accuracy 0–100 up to this bucket end; null before any attempt. */
  accuracy: number | null
  /** Attempts that fell within this bucket. */
  activity: number
}

export type ProgressSeries = {
  points: ProgressPoint[]
  unit: 'day' | 'week' | 'month'
  maxMastered: number
  maxActivity: number
}

const DAY_MS = 86_400_000

function formatLabel(d: Date, unit: 'day' | 'week' | 'month'): string {
  if (unit === 'month') {
    return d.toLocaleDateString('en-GB', { month: 'short' })
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * Builds the progress series, or returns null when there isn't enough history
 * to draw a meaningful line (fewer than two distinct days of activity).
 */
export function buildProgressSeries(
  attempts: Attempt[],
  getPrerequisiteTree: (id: string) => string[],
): ProgressSeries | null {
  if (!attempts || attempts.length === 0) return null

  const distinctDays = new Set(attempts.map(a => a.attempted_at.substring(0, 10)))
  if (distinctDays.size < 2) return null

  const times = attempts.map(a => new Date(a.attempted_at).getTime())
  const first = new Date(Math.min(...times))
  const now = new Date()

  const spanDays = Math.max(1, Math.round((now.getTime() - first.getTime()) / DAY_MS))
  const unit: 'day' | 'week' | 'month' =
    spanDays <= 12 ? 'day' : spanDays <= 84 ? 'week' : 'month'
  const stepDays = unit === 'day' ? 1 : unit === 'week' ? 7 : 30

  // Bucket end boundaries: end-of-day for `first`, then every `stepDays`, always
  // finishing exactly at `now` so the latest point reflects current state.
  const boundaries: Date[] = []
  const cursor = new Date(first)
  cursor.setHours(23, 59, 59, 999)
  while (cursor.getTime() < now.getTime()) {
    boundaries.push(new Date(cursor))
    cursor.setTime(cursor.getTime() + stepDays * DAY_MS)
  }
  boundaries.push(new Date(now))

  let maxMastered = 0
  let maxActivity = 0
  let prevBoundaryMs = -Infinity

  const points: ProgressPoint[] = boundaries.map(boundary => {
    const boundaryMs = boundary.getTime()

    const upToHere = attempts.filter(a => new Date(a.attempted_at).getTime() <= boundaryMs)
    const inBucket = attempts.filter(a => {
      const t = new Date(a.attempted_at).getTime()
      return t > prevBoundaryMs && t <= boundaryMs
    })
    prevBoundaryMs = boundaryMs

    const mastery = inferPrerequisiteMastery(calculateMastery(upToHere), getPrerequisiteTree)
    const mastered = Object.values(mastery).filter(m => m.status === 'mastered').length

    const correct = upToHere.filter(a => a.correct).length
    const accuracy = upToHere.length > 0 ? Math.round((correct / upToHere.length) * 100) : null

    maxMastered = Math.max(maxMastered, mastered)
    maxActivity = Math.max(maxActivity, inBucket.length)

    return {
      date: boundary.toISOString(),
      label: formatLabel(boundary, unit),
      mastered,
      accuracy,
      activity: inBucket.length,
    }
  })

  return { points, unit, maxMastered, maxActivity }
}
