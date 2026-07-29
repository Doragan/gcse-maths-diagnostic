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

// Marks per question are no longer decided here. The flat NOMINAL_MARKS table
// that used to live in this file ({1:1, 2:1, 3:2, 4:3}) was a guess: it averaged
// ~1.8 marks/part against a real-exam 2.16, and ignored `kind` even though real
// synthesis parts are worth nearly twice a single-skill part. It now lives in
// lib/exam/markEvidence.ts as the LAST-RESORT fallback inside
// resolveQuestionMarks, behind evidence from the coded 2024 series. Keeping a
// second copy here would only invite the two to drift.
