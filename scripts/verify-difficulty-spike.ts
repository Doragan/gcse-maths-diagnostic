import './env'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Re-verification for docs/audit/22-difficulty-spike-plan.md
//
// The plan's §1 numbers were a point-in-time pull from a small, young cohort,
// and its own §4.5 says to re-check them before building further. This script
// is that check, so it is a repeatable command rather than an ad-hoc session.
//
// Read-only. Aggregates and opaque student ids only — no emails, no names.
//
// Definitions, kept as close to the plan as its wording allows:
//   • cohort    — students whose FIRST attempt is ≥48h old (a fair chance to
//                 have returned).
//   • returner  — has attempts on ≥2 distinct UTC days.
//   • window    — the student's first practice session. The plan says "first-day
//                 session" without fixing a rule, and the two obvious readings
//                 disagree, so BOTH are reported: a sitting (a run of attempts
//                 less than 30 minutes apart — the rule lib/practice/session.ts
//                 measured SESSION_LENGTH with) and the whole first UTC day.
//   • losing end — that window's last two answers were both wrong.
//   • spike     — a wrong answer in that trailing run whose difficulty is ≥1
//                 above the mean difficulty of the correct answers earlier in
//                 the same window (needs ≥2 of them to be a usable baseline).
// ─────────────────────────────────────────────────────────────────────────────

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!
const db = createClient(URL, SVC, { auth: { persistSession: false } })

const SITTING_GAP_MS = 30 * 60 * 1000
const FAIR_CHANCE_MS = 48 * 60 * 60 * 1000
/** Correct answers needed before a difficulty comparison means anything. */
const MIN_BASELINE = 2
/** How much harder counts as a spike, on the bank's 1–5 scale. */
const SPIKE_DELTA = 1

type Attempt = {
  student_id: string
  question_id: string | null
  correct: boolean
  attempted_at: string
  kind?: string | null
}

/** Pages through a table, because PostgREST caps a single select at 1000 rows. */
async function fetchAll<T>(table: string, cols: string, order: string): Promise<T[]> {
  const out: T[] = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await db.from(table).select(cols).order(order).range(from, from + page - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < page) return out
  }
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const pct = (n: number, d: number) => d === 0 ? 'n/a' : `${Math.round((n / d) * 100)}%`

/** Did this student's first session end on two wrong answers in a row? */
function endedLosing(window: Attempt[] | undefined): boolean {
  return !!window && window.length >= 2 &&
    !window[window.length - 1].correct && !window[window.length - 2].correct
}

function report(
  label: string,
  windows: Map<string, Attempt[]>,
  returners: string[],
  nonReturners: string[],
  difficultyOf: Map<string, number>,
) {
  const losingReturners    = returners.filter(s => endedLosing(windows.get(s)))
  const losingNonReturners = nonReturners.filter(s => endedLosing(windows.get(s)))

  console.log(`── Session window: ${label} ──`)
  console.log('Ended it on two wrong in a row:')
  console.log(`  returners:     ${losingReturners.length} of ${returners.length} (${pct(losingReturners.length, returners.length)})`)
  console.log(`  non-returners: ${losingNonReturners.length} of ${nonReturners.length} (${pct(losingNonReturners.length, nonReturners.length)})`)

  // Of the losing non-returners, how many were on a difficulty spike?
  let usableBaseline = 0
  let spiked = 0
  const jumps: number[] = []
  for (const s of losingNonReturners) {
    const window = windows.get(s)!
    // Split the window at the trailing run of wrong answers.
    let cut = window.length
    while (cut > 0 && !window[cut - 1].correct) cut--
    const priorCorrect = window.slice(0, cut)
      .filter(a => a.correct)
      .map(a => difficultyOf.get(a.question_id ?? ''))
      .filter((d): d is number => typeof d === 'number')
    if (priorCorrect.length < MIN_BASELINE) continue
    usableBaseline++

    const baseline = mean(priorCorrect)
    const finalDiffs = window.slice(cut)
      .map(a => difficultyOf.get(a.question_id ?? ''))
      .filter((d): d is number => typeof d === 'number')
    if (!finalDiffs.length) continue
    const jump = Math.max(...finalDiffs) - baseline
    if (jump >= SPIKE_DELTA) { spiked++; jumps.push(jump) }
  }

  console.log(`Of those ${losingNonReturners.length} non-returners:`)
  console.log(`  with a usable difficulty baseline (≥${MIN_BASELINE} prior correct): ${usableBaseline}`)
  console.log(`  failing ≥${SPIKE_DELTA} difficulty point above it: ${spiked} of ${usableBaseline} (${pct(spiked, usableBaseline)})`)
  if (jumps.length) {
    const sorted = jumps.slice().sort((a, b) => a - b)
    console.log(`  median jump: ${sorted[Math.floor(sorted.length / 2)].toFixed(2)} difficulty points`)
  }
  console.log()
}

async function main() {
  const attempts = await fetchAll<Attempt>(
    'practice_attempts',
    'student_id, question_id, correct, attempted_at, kind',
    'attempted_at',
  )
  const questions = await fetchAll<{ id: string; difficulty: number }>('questions', 'id, difficulty', 'id')
  const difficultyOf = new Map(questions.map(q => [q.id, q.difficulty]))

  // Placement answers are priors, not practice — the app excludes them from the
  // mastery window for the same reason, so they must not shape a session here.
  const practice = attempts.filter(a => a.kind !== 'placement')

  const byStudent = new Map<string, Attempt[]>()
  for (const a of practice) {
    const list = byStudent.get(a.student_id) ?? []
    list.push(a)
    byStudent.set(a.student_id, list)
  }

  const now = Date.now()
  let cohort = 0
  const returners: string[] = []
  const nonReturners: string[] = []
  const firstSitting = new Map<string, Attempt[]>()
  const firstDay = new Map<string, Attempt[]>()

  for (const [student, raw] of byStudent) {
    const list = raw.slice().sort((a, b) => a.attempted_at.localeCompare(b.attempted_at))
    if (now - new Date(list[0].attempted_at).getTime() < FAIR_CHANCE_MS) continue
    cohort++

    const days = new Set(list.map(a => a.attempted_at.slice(0, 10)))
    ;(days.size >= 2 ? returners : nonReturners).push(student)

    const sitting: Attempt[] = [list[0]]
    for (let i = 1; i < list.length; i++) {
      const gap = new Date(list[i].attempted_at).getTime() - new Date(list[i - 1].attempted_at).getTime()
      if (gap >= SITTING_GAP_MS) break
      sitting.push(list[i])
    }
    firstSitting.set(student, sitting)
    firstDay.set(student, list.filter(a => a.attempted_at.slice(0, 10) === list[0].attempted_at.slice(0, 10)))
  }

  console.log(`Cohort (first attempt ≥48h old): ${cohort} students`)
  console.log(`  returned on a later day: ${returners.length}`)
  console.log(`  never returned:          ${nonReturners.length}`)
  console.log()

  report('first sitting (<30 min gaps)', firstSitting, returners, nonReturners, difficultyOf)
  report('whole first day', firstDay, returners, nonReturners, difficultyOf)
}

main().catch(e => { console.error(e); process.exit(1) })
