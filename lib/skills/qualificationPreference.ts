import { BOARDS_BY_QUALIFICATION, type Qualification } from '../../data/courses'

// ─────────────────────────────────────────────────────────────────────────────
// Which qualification the student is sitting.
//
// This is the widest of the three study preferences — tier picks a paper within
// a qualification and board picks whose paper it is, but qualification decides
// which courses, which skill pool and which boards even exist for this student.
//
// It used to be an assumption rather than a choice: every skill pool resolved
// the string "gcse_foundation" inline, and the board switcher offered every
// coded board, which is how coding the iGCSE papers put "Edexcel International"
// in front of GCSE students.
//
// Stored per browser, like tier and board, and for the same reason: a column on
// `students` would follow the account across devices but needs a migration. The
// account-level version of this is a COURSE on the profile, not a qualification
// — a signed-in student signs up to iGCSE Higher, not to "iGCSE" — so this is
// deliberately the signed-out half of the feature.
//
// See tierPreference.ts and boardPreference.ts, which this mirrors.
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_KEY = 'mathsense_qualification'

/**
 * The qualification a student is taken to be sitting until they say otherwise.
 *
 * A signed-out visitor gets the generic GCSE experience; that is a product
 * decision, not an inference about them. This constant is the SEAM every
 * caller resolves through, so there is one place to change rather than a dozen
 * hard-coded 'gcse' literals — and when a signed-in course lands it overrides
 * the stored value here.
 */
export const DEFAULT_QUALIFICATION: Qualification = 'gcse'

/** Every qualification the app can scope to, in the order they are offered. */
export const QUALIFICATIONS = Object.keys(BOARDS_BY_QUALIFICATION) as Qualification[]

const isQualification = (v: unknown): v is Qualification =>
  typeof v === 'string' && (QUALIFICATIONS as string[]).includes(v)

/** Best known qualification for this browser. */
export function getQualification(): Qualification {
  if (typeof window === 'undefined') return DEFAULT_QUALIFICATION

  try {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (isQualification(stored)) return stored
  } catch {
    // Private browsing, or storage disabled. The default is still correct.
  }
  return DEFAULT_QUALIFICATION
}

/**
 * Persist the student's qualification. Ignores an unknown value rather than
 * storing it, so a stale key cannot put the app on a qualification that has no
 * courses behind it.
 *
 * Deliberately does NOT clear the stored board. getBoard() is scoped to a
 * qualification and ignores a board that is not coded for it, so a student who
 * switches to iGCSE and back finds their GCSE board still chosen.
 */
export function setQualification(qualification: Qualification): void {
  if (typeof window === 'undefined' || !isQualification(qualification)) return
  try {
    localStorage.setItem(LOCAL_KEY, qualification)
  } catch {
    // Nothing to do — the page still works, the choice just will not persist.
  }
}

/**
 * The qualification as a student would say it. "iGCSE" is the trade name and
 * what the course titles use, but a student choosing between them is reading
 * two options side by side, where the useful distinction is domestic versus
 * international rather than a lowercase i.
 */
export function qualificationLabel(qualification: Qualification): string {
  return qualification === 'igcse' ? 'International GCSE' : 'GCSE'
}
