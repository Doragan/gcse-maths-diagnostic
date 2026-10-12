import { CALCULATOR_FILTERS, type CalculatorFilter } from './calculator'
import { getQualification } from '../skills/qualificationPreference'
import type { Qualification } from '../../data/courses'

// ─────────────────────────────────────────────────────────────────────────────
// Which calculator flavour the student wants to practise — Mixed / Non-
// calculator / Calculator. Mirrors lib/skills/tierPreference.ts exactly: a
// per-browser localStorage value so it follows the student back across visits,
// bridged from the sessionStorage key /practice already writes so the two
// never disagree mid-session.
//
// Same deliberate deferral as tier: the "proper" fix is a column on
// `students` so the preference follows the account across devices, not just
// the browser. Not built here — this is the same staged trial tier already
// went through, not a second pattern.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The calculator filters that mean anything on a qualification.
 *
 * 4MA1 has NO non-calculator paper — all 20 coded iGCSE papers are "Paper n
 * (Calculator)", two per tier. So "Non-calculator" there is not a harder
 * setting, it is a constraint that student's exam never imposes, and drilling
 * under it would practise for a paper they will not sit.
 *
 * GCSE keeps all three: 1MA1, 8300 and J560 each open with a non-calculator
 * paper.
 */
export function calculatorFiltersFor(qualification: Qualification): CalculatorFilter[] {
  return qualification === 'igcse'
    ? CALCULATOR_FILTERS.filter(f => f !== 'non_calc')
    : CALCULATOR_FILTERS
}

const LOCAL_KEY   = 'mathsense_calculator_mode'
const SESSION_KEY = 'practice_calculator'   // the key /practice already writes

const isCalculatorFilter = (v: unknown): v is CalculatorFilter =>
  v === 'mixed' || v === 'non_calc' || v === 'calc'

/**
 * Best known calculator filter for this browser. Falls back to Mixed, which
 * is the only default that changes nothing for a student who has never
 * touched the toggle — every other default would silently start excluding
 * content someone never asked to exclude.
 */
export function getCalculatorFilter(): CalculatorFilter {
  if (typeof window === 'undefined') return 'mixed'

  // Coerced to the student's qualification HERE rather than at the toggle, so
  // every caller is covered — the question page fetches its pool straight from
  // this, and a filter left in storage before a qualification switch would
  // otherwise keep narrowing that pool invisibly.
  const allowed = calculatorFiltersFor(getQualification())
  const valid = (f: CalculatorFilter): boolean => allowed.includes(f)

  const stored = localStorage.getItem(LOCAL_KEY)
  if (isCalculatorFilter(stored) && valid(stored)) return stored

  const session = sessionStorage.getItem(SESSION_KEY)
  if (isCalculatorFilter(session) && valid(session)) {
    localStorage.setItem(LOCAL_KEY, session)
    return session
  }

  return 'mixed'
}

/** Persist the student's calculator filter and keep the practice-side key in step. */
export function setCalculatorFilter(filter: CalculatorFilter): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_KEY, filter)
  sessionStorage.setItem(SESSION_KEY, filter)
}
