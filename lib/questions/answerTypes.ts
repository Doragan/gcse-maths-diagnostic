// Single source of truth for answer types, mirroring the kind.ts /
// calculator.ts pattern. Before this module the union was hand-copied across
// the grader, parts model, page-level types, admin selects and both audit
// scripts — and had drifted ('set' was missing from the parts union even
// though the editor offered it and the grader supports it).
//
// Two tiers:
//   scalar — one input, one canonical answer; what checkAnswer grades.
//   part   — everything a PART may declare: the scalars plus 'multi_blank'
//            (N labelled scalar blanks, graded independently, one submit).
//
// 'multi_blank' is PART-LEVEL ONLY, never a question-level answer_type: parts
// live in the unconstrained `questions.parts` jsonb, while the question-level
// answer_type column carries a CHECK constraint listing the scalars — keeping
// multi_blank out of it means no DDL migration. Blanks themselves are always
// scalar (no nesting).

export const SCALAR_ANSWER_TYPES = [
  'exact', 'numeric', 'fraction', 'expression', 'set', 'ratio', 'coordinate',
] as const
export type ScalarAnswerType = typeof SCALAR_ANSWER_TYPES[number]

export const PART_ANSWER_TYPES = [...SCALAR_ANSWER_TYPES, 'multi_blank', 'grid_draw'] as const
export type PartAnswerType = typeof PART_ANSWER_TYPES[number]

export const ANSWER_TYPE_LABELS: Record<PartAnswerType, string> = {
  exact: 'Exact',
  numeric: 'Numeric',
  fraction: 'Fraction',
  expression: 'Expression',
  set: 'Set',
  ratio: 'Ratio',
  coordinate: 'Coordinate',
  multi_blank: 'Multi-blank — several labelled answers',
  grid_draw: 'Grid drawing — place points on a grid',
}

export function isScalarAnswerType(t: string): t is ScalarAnswerType {
  return (SCALAR_ANSWER_TYPES as readonly string[]).includes(t)
}

/**
 * The FORM a fraction answer must be written in, where the question insists on
 * one. Lives beside the answer types because it qualifies 'fraction' the way
 * `requires_simplest` does, and like it is a property of the question rather
 * than of the answer.
 *
 * NULL / absent is the default and means EITHER form is accepted — "7/3" and
 * "2 1/3" are the same number and nearly every mark scheme says so ("oe").
 * Only a question whose assessed skill IS the conversion sets this.
 *
 *   mixed    — "write 7/3 as a mixed number": 2 1/3 only.
 *   improper — "write 2 1/3 as an improper fraction": 7/3 only.
 *
 * Measured over the 86 coded papers: of the 16 mixed/improper parts whose gap
 * note states which form the scheme credits, 15 demand the mixed form and 1
 * the improper one. The improper value is here because that one part exists and
 * the question cannot otherwise be authored — not for symmetry's sake.
 */
export const FRACTION_FORMS = ['mixed', 'improper'] as const
export type FractionForm = typeof FRACTION_FORMS[number]

export const FRACTION_FORM_LABELS: Record<FractionForm, string> = {
  mixed: 'Mixed number (2 1/3)',
  improper: 'Improper fraction (7/3)',
}

export function isFractionForm(t: unknown): t is FractionForm {
  return typeof t === 'string' && (FRACTION_FORMS as readonly string[]).includes(t)
}
