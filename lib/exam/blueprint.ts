// ── Mini-exam blueprint ──────────────────────────────────────────────────────
// A blueprint is a MARK BUDGET, not a list of question slots.
//
// It used to be ~11 fixed slots by difficulty band, with the mark total falling
// out wherever it landed (measured 19–35). Real papers work the other way round:
// every one of the 30 coded papers is exactly 80 marks, with the question
// count as the free variable (23–29 questions, 28–46 parts). Marks are what a
// student is scored on and what the score trend plots, so marks are what should
// be fixed — a 19-mark paper and a 35-mark paper are not the same assessment.
//
// TWO THINGS THE AUDIT SETTLED:
//
// 1. Real papers do NOT ramp marks-per-question. A Foundation paper runs
//    3 4 3 4 3 3 3 4 3 3 3 2 3 4 1 3 4 2 1 2 3 4 3 3 3 3 3 — noisy around 3,
//    with 1- and 2-mark questions appearing late; marks split 32/34/34 by
//    position. Papers ramp DIFFICULTY and hold marks-per-question roughly flat.
//    So the budget ramps by band, and nothing here tries to make later questions
//    worth more.
//
// 2. The tiers are different papers, not one paper with harder questions. Same
//    80 marks, but Higher uses ten fewer parts (mean 2.47 marks/part against
//    Foundation's 1.92) and takes 78% of its marks from synthesis against
//    Foundation's 48%. Hence a blueprint PER TIER; tier is no longer only a
//    skill filter.

import type { QuestionKind } from '../questions/kind'

export type DifficultyBand = 1 | 2 | 3 | 4
export type SlotKind = QuestionKind | 'any'
export type Tier = 'foundation' | 'higher'

/** One difficulty band's share of the paper's marks. */
export type BandBudget = {
  band: DifficultyBand
  /** Fraction of targetMarks this band should contribute; shares sum to 1. */
  share: number
  /** Preferred kind; relaxed first when the band can't be filled. */
  preferKind?: SlotKind
}

export type ExamBlueprint = {
  targetMarks: number
  /** A band stops once it is within this many marks of its budget. */
  tolerance: number
  bands: BandBudget[]
}

/**
 * ~25 marks ≈ a 30-minute paper (a real paper is 80 marks / 90 minutes).
 *
 * The band shares carry the difficulty ramp. They are a JUDGEMENT, not an
 * empirical result: the audit codes marks but not difficulty, so there is no
 * measured band distribution to copy. What IS measured is the resulting shape —
 * scaled to 25 marks, a real Foundation slice is ~13 parts and a real Higher
 * slice ~10 — and these shares were tuned to land there against the live pool.
 */
export const BLUEPRINTS: Record<Tier, ExamBlueprint> = {
  // Lighter questions, more of them: real Foundation parts average 1.92 marks
  // and 41% of them are worth a single mark.
  foundation: {
    targetMarks: 25,
    tolerance: 1,
    bands: [
      { band: 1, share: 0.12 },
      { band: 2, share: 0.24 },
      { band: 3, share: 0.34 },
      { band: 4, share: 0.30, preferKind: 'exam' },
    ],
  },
  // Fewer, heavier questions, weighted hard and toward synthesis: real Higher
  // parts average 2.47 marks, 49% are worth 3+, and 78% of the paper's marks
  // come from exam-kind parts.
  higher: {
    targetMarks: 25,
    tolerance: 1,
    bands: [
      { band: 1, share: 0.06 },
      { band: 2, share: 0.14 },
      { band: 3, share: 0.34, preferKind: 'exam' },
      { band: 4, share: 0.46, preferKind: 'exam' },
    ],
  },
}

// Marks per question are not decided here. The flat NOMINAL_MARKS table that
// used to live in this file ({1:1, 2:1, 3:2, 4:3}) was a guess; marks now come
// from lib/exam/markEvidence.ts, priced against the coded series (30 papers).
