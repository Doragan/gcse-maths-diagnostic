// ── Mini-exam blueprint ──────────────────────────────────────────────────────
// A blueprint is an ordered list of SLOTS. Each slot targets a difficulty band
// (and optionally a kind), and the assembler fills it from the shared question
// pool. Slots are defined at difficulty-band grain (NOT per-skill) so the
// candidate pool for each slot stays deep — a per-skill blueprint would collapse
// to ~1 candidate and make every paper structurally identical.
//
// The default paper is a ~25-mark, ~11-question ramp: a short opening, a medium
// middle, and an `exam`-kind-preferred synthesis tail. The tail relaxes to the
// hardest available `mastery` questions while the synthesis bank is still thin.

export type DifficultyBand = 1 | 2 | 3 | 4
export type SlotKind = 'mastery' | 'exam' | 'any'

export type ExamSlot = {
  band: DifficultyBand
  /** Preferred kind; the assembler relaxes this first when a cell is empty. */
  kind: SlotKind
}

export const DEFAULT_BLUEPRINT: ExamSlot[] = [
  { band: 1, kind: 'any' },
  { band: 1, kind: 'any' },
  { band: 2, kind: 'any' },
  { band: 2, kind: 'any' },
  { band: 2, kind: 'any' },
  { band: 3, kind: 'any' },
  { band: 3, kind: 'any' },
  { band: 3, kind: 'any' },
  { band: 4, kind: 'exam' },
  { band: 4, kind: 'exam' },
  { band: 4, kind: 'any' },
]

/**
 * Nominal marks for a SINGLE-PART question, by difficulty. Multi-part questions
 * use the sum of their parts' marks instead (which authors set explicitly).
 * This is a rough exam-like weighting, not a calibrated one — the score is
 * labelled a "score", not a predicted grade (calibration is a later increment).
 */
export const NOMINAL_MARKS: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 3 }
