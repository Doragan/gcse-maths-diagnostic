import type { QuestionKind } from './kind'

/**
 * A single, independently-graded and independently-attributed part of a
 * multi-part question (e.g. part a, part b, ...).
 *
 * Each part is its own unit of attribution: when answered in practice it
 * produces ONE practice_attempts row carrying THIS part's skill_ids and kind.
 * A part with one skill is naturally `mastery` (credit-on-success +
 * penalise-on-failure); a part synthesising several skills is `exam`
 * (positive-only — credit on success, route to revision on failure).
 *
 * Parts render against the SHARED generated value set of their parent
 * question, so part (b)'s prompt/answer can reference {{a}} from part (a).
 */
export type PartTrap = {
  answer_template: string
  response: string
}

export type QuestionPart = {
  prompt: string
  skill_ids: string[]
  answer_template: string
  answer_type: 'exact' | 'numeric' | 'fraction' | 'expression' | 'ratio' | 'coordinate'
  tolerance: number | null
  // Whether the part demanded simplest form (drives the fraction/ratio nudge).
  requires_simplest: boolean
  traps: PartTrap[]
  marks: number
  kind: QuestionKind
  explanation: string | null
}

/**
 * The skill_ids a multi-part question covers as a whole: the de-duplicated
 * union of every part's skill_ids, preserving first-seen order. This is what
 * we persist into the question-level `skill_ids` column so existing serving /
 * filtering queries (which use `.overlaps('skill_ids', ...)`) keep working
 * unchanged for multi-part questions.
 */
export function computeSkillUnion(parts: { skill_ids: string[] }[]): string[] {
  const seen = new Set<string>()
  const union: string[] = []
  for (const part of parts) {
    for (const id of part.skill_ids) {
      if (!seen.has(id)) {
        seen.add(id)
        union.push(id)
      }
    }
  }
  return union
}

/**
 * Default kind for a part, derived from how many skills it assesses:
 *   1 skill  → 'mastery'  (single-skill proof; penalises on failure)
 *  >1 skill  → 'exam'     (irreducible synthesis; positive-only)
 *
 * This is only a sensible default for the authoring form — an author can
 * override it (e.g. mark a single-skill part as exam-kind deliberately).
 */
export function defaultKindForSkills(skillIds: string[]): QuestionKind {
  return skillIds.length > 1 ? 'exam' : 'mastery'
}

/** Total marks across all parts. */
export function totalMarks(parts: QuestionPart[]): number {
  return parts.reduce((sum, p) => sum + (p.marks || 0), 0)
}

/** An empty part with sensible defaults, for seeding the authoring form. */
export function emptyPart(): QuestionPart {
  return {
    prompt: '',
    skill_ids: [],
    answer_template: '',
    answer_type: 'numeric',
    tolerance: 0,
    requires_simplest: false,
    traps: [],
    marks: 1,
    kind: 'mastery',
    explanation: null,
  }
}

/**
 * The loose, editable representation of a part as it lives in the authoring
 * form, where numeric fields (tolerance, marks) are held as strings so they
 * can be partially typed / left blank. `normalizePart` cleans this into a
 * canonical QuestionPart ready for persistence.
 */
export type PartInput = {
  prompt: string
  skill_ids: string[]
  answer_template: string
  answer_type: QuestionPart['answer_type']
  tolerance: string | number | null
  requires_simplest: boolean
  traps: PartTrap[]
  marks: string | number
  kind: QuestionKind
  explanation: string | null
}

export function normalizePart(p: PartInput): QuestionPart {
  return {
    prompt: p.prompt,
    skill_ids: p.skill_ids,
    answer_template: p.answer_template,
    answer_type: p.answer_type,
    tolerance: p.answer_type === 'numeric'
      ? (p.tolerance === '' || p.tolerance == null ? 0 : Number(p.tolerance))
      : null,
    // Default false for legacy parts that predate this field (lenient: a missing
    // flag must never cause a correct answer to be rejected).
    requires_simplest: p.requires_simplest ?? false,
    // Drop wholly-empty trap rows (no wrong-answer template).
    traps: p.traps.filter(t => t.answer_template.trim() !== ''),
    marks: p.marks === '' || p.marks == null ? 1 : Number(p.marks),
    kind: p.kind,
    explanation: p.explanation && p.explanation.trim() !== '' ? p.explanation : null,
  }
}
