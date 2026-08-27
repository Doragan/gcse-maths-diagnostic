// ─────────────────────────────────────────────────────────────────────────────
// Which value the student used for π, inferred from their answer.
//
// Every GCSE circle formula is linear in π, so an answer computed with p instead
// of π is exactly `correct × p / π`. That makes the estimate recoverable from
// the answer alone: rebuild the answer each candidate estimate would produce and
// see which one the student wrote. No parsing of working, no second input.
//
// Why this cannot simply be authored as traps: 3.142 is ACCEPTABLE, and a
// question's tolerance cannot express that. The gap 3.142 opens up scales with
// the answer (0.004 at 28 cm², 0.04 at 314 cm²), so any fixed tolerance either
// rejects a legitimate 3.142 on the large draws or waves through 3.14 on the
// small ones. Only a rule that scales with the answer separates them.
// ─────────────────────────────────────────────────────────────────────────────

export type PiEstimate = {
  /** The value used in place of π. */
  value: number
  /** How the student would recognise it — what they typed, not the decimal. */
  label: string
  /**
   * Accurate enough to earn the mark. 3.142 is the floor: it is what a
   * non-calculator paper supplies and what a mark scheme accepts. 3.14 is not,
   * and is the most common reason a sound method lands outside the tolerance.
   */
  acceptable: boolean
}

/**
 * Ordered acceptable-first, so an answer that cannot be told apart from a good
 * estimate at the question's own precision is read as the good one. That is the
 * right way to break a tie: the student is not shown a fault we cannot prove.
 *
 * Deliberately no 3.1 and no 3. Those were measured against every authored trap
 * in the bank — its own catalogue of realistic wrong answers — and they are not
 * safely recoverable: they shift the answer by 1.3% and 4.5%, an ordinary size
 * for an arithmetic slip, and they fired on questions with no π in them at all.
 * 3.14 and 22/7 shift it by 0.05% and 0.04%, far too specific to land on by
 * accident. A student who used 3 gets the generic message, which is the correct
 * outcome: we cannot tell, so we do not say.
 */
export const PI_ESTIMATES: PiEstimate[] = [
  { value: 3.1416, label: '3.1416', acceptable: true  },
  { value: 3.142,  label: '3.142',  acceptable: true  },
  { value: 3.14,   label: '3.14',   acceptable: false },
  { value: 22 / 7, label: '22/7',   acceptable: false },
]

/** One unit in the last decimal place the answer is written to. */
function lastPlaceUnit(rendered: string): number {
  const m = rendered.match(/-?\d+(?:\.(\d+))?/)
  return m && m[1] ? 10 ** -m[1].length : 1
}

/**
 * Whether an answer is built from π in a way the STUDENT substitutes a value
 * for — which is the only kind this can diagnose.
 *
 * The degree/radian conversions (`Math.PI / 180`, `180 / Math.PI`) do not
 * count. Every trig question in the bank carries one, but the student never
 * types a value for π there: the calculator holds it, and the conversion only
 * exists because the templates compute in radians. Telling someone doing the
 * sine rule that their π was inaccurate would be feedback about a step they
 * never took.
 */
export function usesSubstitutablePi(answerTemplate: string | undefined): boolean {
  if (!answerTemplate) return false
  const withoutConversions = answerTemplate
    .replace(/Math\.PI\s*\/\s*180/g, '')
    .replace(/180\s*\/\s*Math\.PI/g, '')
  return /Math\.PI|π/.test(withoutConversions)
}

/**
 * The estimate the student's answer is consistent with, or null.
 *
 * `renderedCorrect` supplies the precision the answer is written to, which the
 * comparison needs in both directions: the student has rounded their answer to
 * it, so the match must allow half a place either way even when the question's
 * own tolerance is tighter, and an estimate whose whole effect is smaller than
 * that place has produced no difference anyone could see.
 */
export function detectPiEstimate(
  studentValue: number,
  correctValue: number,
  tolerance: number,
  renderedCorrect: string,
): PiEstimate | null {
  if (!Number.isFinite(studentValue) || !Number.isFinite(correctValue)) return null
  // A zero answer carries no signal: every estimate rebuilds it identically.
  if (correctValue === 0) return null
  const place = lastPlaceUnit(renderedCorrect)
  const tol = Math.max(tolerance, 0)
  // BOTH sides of the comparison are rounded to `place` — the student rounded
  // their answer to it, and the expectation is built from a canonical answer
  // already rounded to it — so each contributes up to half a place of error and
  // the window has to be a whole one. Half of it was not enough: legitimate
  // 3.142 answers on the sphere-volume question missed by 0.006 against a
  // 0.005 window, on a question whose own tolerance (0.001) is finer than the
  // rounding it asks for.
  const match = Math.max(tol, place)

  for (const est of PI_ESTIMATES) {
    const expected = correctValue * (est.value / Math.PI)
    // An estimate must move the answer by more than a whole displayed place
    // before we will NAME it — below that there is no difference anyone could
    // see, and a diagnosis drawn from it is a guess dressed up as a finding.
    //
    // That guard applies only to the estimates we would fault. For a good one
    // the reasoning inverts: a difference too small to see is precisely a
    // difference too small to mark wrong. Keeping the floor here rejected
    // legitimate 3.142 answers on the smaller draws of every circle question
    // whose tolerance was tighter than its own rounding.
    const floor = est.acceptable ? 0 : Math.max(tol, place)
    if (Math.abs(expected - correctValue) <= floor) continue
    if (Math.abs(studentValue - expected) <= match) return est
  }
  return null
}
