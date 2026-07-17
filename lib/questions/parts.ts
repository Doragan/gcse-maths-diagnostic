import type { QuestionKind } from './kind'
import type { PartAnswerType, ScalarAnswerType } from './answerTypes'

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

/**
 * One labelled blank of a `multi_blank` part ("write down the values of A, B
 * and C"). Each blank is its own scalar mini-answer — template, type,
 * tolerance, traps and marks — graded independently by checkAnswer via
 * checkMultiBlank. The blank COUNT is fixed at authoring time; parameters vary
 * the VALUES only, never how many boxes there are.
 */
export type Blank = {
  label: string // 'A', 'B', ... unique within the part
  // Optional short prompt shown beside the input ("Students who come by bus"),
  // so the student doesn't have to keep glancing between the boxes and the
  // stem/diagram. A template — may reference parameters.
  prompt?: string
  answer_template: string
  answer_type: ScalarAnswerType // never 'multi_blank' — no nesting
  tolerance: number | null // numeric only, like parts
  requires_simplest: boolean
  traps: PartTrap[]
  marks: number // per-blank marks (exam partial credit)
}

export type QuestionPart = {
  prompt: string
  skill_ids: string[]
  answer_template: string
  answer_type: PartAnswerType
  tolerance: number | null
  // Whether the part demanded simplest form (drives the fraction/ratio nudge).
  requires_simplest: boolean
  traps: PartTrap[]
  marks: number
  kind: QuestionKind
  explanation: string | null
  // Only present when answer_type === 'multi_blank'; scalar parts never carry
  // the key (normalizePart omits it, keeping stored jsonb clean).
  blanks?: Blank[]
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

/** An empty blank with sensible defaults, for seeding the blanks editor. */
export function emptyBlank(label: string): Blank {
  return {
    label,
    answer_template: '',
    answer_type: 'numeric',
    tolerance: 0,
    requires_simplest: false,
    traps: [],
    marks: 1,
  }
}

/** First unused label from 'A'..'Z' (falls back to 'A?' beyond 26 blanks). */
export function nextBlankLabel(blanks: { label: string }[]): string {
  const used = new Set(blanks.map(b => b.label.trim().toUpperCase()))
  for (let i = 0; i < 26; i++) {
    const candidate = String.fromCharCode(65 + i)
    if (!used.has(candidate)) return candidate
  }
  return `A${blanks.length + 1}`
}

/** Total marks across a part's blanks. */
export function blankMarksTotal(blanks: { marks: number }[]): number {
  return blanks.reduce((sum, b) => sum + (b.marks || 0), 0)
}

/**
 * The loose, editable representation of a part as it lives in the authoring
 * form, where numeric fields (tolerance, marks) are held as strings so they
 * can be partially typed / left blank. `normalizePart` cleans this into a
 * canonical QuestionPart ready for persistence.
 */
export type BlankInput = Omit<Blank, 'tolerance' | 'marks'> & {
  tolerance: string | number | null
  marks: string | number
}

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
  blanks?: BlankInput[]
}

export function normalizeBlank(b: BlankInput): Blank {
  return {
    label: b.label.trim(),
    // Omitted entirely when empty, keeping stored jsonb clean.
    ...(b.prompt && b.prompt.trim() !== '' ? { prompt: b.prompt } : {}),
    answer_template: b.answer_template,
    answer_type: b.answer_type,
    tolerance: b.answer_type === 'numeric'
      ? (b.tolerance === '' || b.tolerance == null ? 0 : Number(b.tolerance))
      : null,
    requires_simplest: b.requires_simplest ?? false,
    traps: b.traps.filter(t => t.answer_template.trim() !== ''),
    marks: b.marks === '' || b.marks == null ? 1 : Number(b.marks),
  }
}

export function normalizePart(p: PartInput): QuestionPart {
  if (p.answer_type === 'multi_blank') {
    const blanks = (p.blanks ?? []).map(normalizeBlank)
    return {
      prompt: p.prompt,
      skill_ids: p.skill_ids,
      // The part-level answer fields are unused for multi_blank — each blank
      // carries its own. Blanked here so stale form state never persists.
      answer_template: '',
      answer_type: 'multi_blank',
      tolerance: null,
      requires_simplest: false,
      traps: [],
      // Computed, never trusted from the form: this single invariant is what
      // keeps totalMarks and the exam assembler correct with no changes there.
      marks: blankMarksTotal(blanks),
      kind: p.kind,
      explanation: p.explanation && p.explanation.trim() !== '' ? p.explanation : null,
      blanks,
    }
  }
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
