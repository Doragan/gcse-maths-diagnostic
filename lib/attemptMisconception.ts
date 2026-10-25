/**
 * Which misconception stands for a whole multi-part question.
 *
 * A multi-part question writes ONE session row, on the final part, because
 * per-part rows would count a three-part question as three answers against
 * the session target. That row has one `misconception` column and the pupil
 * may have tripped over several, so something has to choose.
 *
 * THE FIRST TAGGED ONE AMONG THE WRONG PARTS. Two reasons:
 *
 *   - In a multi-part question the parts are usually a chain, so the earliest
 *     error is the one that caused the rest. Reporting a later part's
 *     misconception would point a teacher at follow-through.
 *   - "First WRONG part" alone would lose the signal whenever the first error
 *     happened to be on an untagged trap and a later one was tagged, which
 *     with 280 of 620 traps tagged is not a rare case.
 *
 * It is a lossy summary and deliberately so. The per-part detail still exists
 * in practice_attempts for a signed-in student; a session pupil has no account
 * to key it on, which is the product line rather than an omission.
 */

export type PartMisconception = {
  correct: boolean
  misconception?: string | null
}

export function rollupMisconception(parts: PartMisconception[]): string | null {
  for (const p of parts) {
    if (p.correct) continue
    if (p.misconception) return p.misconception
  }
  return null
}
