// Tri-state calculator flag carried by every question row (DB column
// `questions.calculator`, default 'na'). Single source of truth for the type
// and its human labels so the admin form and the later paper-assembly logic
// agree. See migration 20260607_question_calculator_flag.sql for semantics.

export type CalculatorMode = 'calc' | 'non_calc' | 'na'

export const CALCULATOR_MODES: CalculatorMode[] = ['na', 'non_calc', 'calc']

export const CALCULATOR_LABELS: Record<CalculatorMode, string> = {
  na: 'N/A — calculator irrelevant',
  non_calc: 'Non-calculator (Paper 1)',
  calc: 'Calculator required',
}

export const DEFAULT_CALCULATOR_MODE: CalculatorMode = 'na'

// ─────────────────────────────────────────────────────────────────────────────
// The STUDENT's choice on the practice screen — not the same three states as
// the question tag above, and not the same rule as the mini-exam assembler's
// `calcEligible` (lib/exam/assembler.ts). That rule is asymmetric on purpose:
// it models real PAPER STRUCTURE, where an easy non-calc-style question
// legitimately appears on a calculator paper, so only `calc` questions are
// ever excluded (from a non-calc paper).
//
// Practice mode isn't modelling a paper — it's the student's stated intent to
// drill one flavour of question. Serving a `non_calc` question (one a
// calculator would trivialise) during declared Calculator practice wastes
// that question's purpose just as serving a `calc` question during
// Non-calculator practice makes it unanswerable, so the practice rule
// excludes in BOTH directions. `na` questions carry no calculator concept at
// all and are eligible under every filter.
// ─────────────────────────────────────────────────────────────────────────────

export type CalculatorFilter = 'mixed' | 'non_calc' | 'calc'

export const CALCULATOR_FILTERS: CalculatorFilter[] = ['mixed', 'non_calc', 'calc']

export const CALCULATOR_FILTER_LABELS: Record<CalculatorFilter, string> = {
  mixed: 'Mixed',
  non_calc: 'Non-calculator',
  calc: 'Calculator',
}

/**
 * Which `questions.calculator` values satisfy a practice filter, for passing
 * straight to `.in('calculator', …)`. `null` means "no filter" (mixed) —
 * callers should skip the `.in()` clause entirely rather than pass all three
 * values, so a future fourth tag doesn't need this updated to stay inclusive.
 */
export function calculatorValuesFor(filter: CalculatorFilter): CalculatorMode[] | null {
  if (filter === 'mixed') return null
  if (filter === 'non_calc') return ['non_calc', 'na']
  return ['calc', 'na']
}
