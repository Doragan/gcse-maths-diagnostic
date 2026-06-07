// The two-kind question model. A question's `kind` decides how a wrong answer
// attributes to skill mastery — the single source of truth for the type, its
// labels, and the default. See migration 20260607_question_kind.sql for the
// full semantics and the masteryEngine for the attribution branch.
//
//   'mastery' — exactly one assessed skill; credit on success, penalise on
//               failure (drives the mastery graph).
//   'exam'    — irreducible multi-skill synthesis; positive-only: credit on
//               success, NEVER penalise on failure (route to revision instead).

export type QuestionKind = 'mastery' | 'exam'

export const QUESTION_KINDS: QuestionKind[] = ['mastery', 'exam']

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  mastery: 'Mastery — single skill (penalises on failure)',
  exam: 'Exam — multi-skill synthesis (positive-only)',
}

export const DEFAULT_QUESTION_KIND: QuestionKind = 'mastery'
