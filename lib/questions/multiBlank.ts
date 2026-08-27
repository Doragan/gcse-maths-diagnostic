import { checkAnswer, type CheckResult } from './answerChecker'
import { evaluateTemplate } from './paramEngine'
import type { ScalarAnswerType } from './answerTypes'

/**
 * Grading for a `multi_blank` part: N labelled scalar blanks, each graded
 * independently by the existing checkAnswer, submitted together in one go.
 *
 * The aggregate `correct` (every blank right) is what feeds the ONE
 * practice_attempts row the part produces — blanks share the part's skill, and
 * per-blank rows would let a single question flood the mastery engine's
 * most-recent-5 window. Partial credit surfaces only in the exam-marks layer,
 * where each blank carries its own marks.
 */

export type BlankCheck = {
  label: string
  student: string // raw student input; '' / whitespace = unanswered
  answer: string // RENDERED canonical answer
  // UNRENDERED template for that answer. Only used to tell whether the answer
  // is built from π, which gates the poor-π-estimate check in the grader.
  answer_template?: string
  answer_type: ScalarAnswerType
  tolerance: number | null
  requires_simplest: boolean
  traps: { answer: string, response: string, method_marks?: number }[] // RENDERED traps
  // RENDERED errors-carried-forward formula: arithmetic over numbers and
  // [[SIBLING]] refs, e.g. '[[F]] - 4'. See Blank.ecf_template.
  ecf?: string
}

export type BlankResult = CheckResult & {
  label: string
  student: string
  // True when this blank was only correct BECAUSE we followed through from the
  // student's own wrong answer elsewhere. Displayed amber, not green.
  followThrough?: boolean
}

export type MultiBlankResult = {
  correct: boolean // every blank correct — feeds practice_attempts
  correctCount: number
  blanks: BlankResult[]
}

/** Sibling references inside an ECF formula: [[A]], [[B]], … */
const ECF_REF = /\[\[\s*([^\]]+?)\s*\]\]/g

/**
 * Resolve one blank's ECF formula against what the student actually wrote.
 *
 * Returns the follow-through value, or null when ECF can't apply: an unknown
 * or self-referential label, a sibling left blank or written non-numerically,
 * every referenced sibling already correct (nothing to follow through FROM),
 * or arithmetic that doesn't evaluate.
 */
function resolveEcf(
  ecf: string,
  self: string,
  studentByLabel: Map<string, string>,
  correctByLabel: Map<string, boolean>,
): string | null {
  let usable = true
  let followsAnError = false
  const substituted = ecf.replace(ECF_REF, (_m, rawLabel: string) => {
    const label = rawLabel.trim()
    // Self-reference would make the blank trivially "correct" whatever it says.
    if (label === self || !studentByLabel.has(label)) { usable = false; return '0' }
    const raw = (studentByLabel.get(label) ?? '').trim()
    const n = Number(raw)
    if (raw === '' || !Number.isFinite(n)) { usable = false; return '0' }
    if (!correctByLabel.get(label)) followsAnError = true
    // Parenthesised so a negative or multi-term answer can't rebind operators
    // around it ('[[F]] - 4' with F = -3 must be (-3) - 4, not -3 - 4 read as
    // a subtraction of a bare token).
    return `(${n})`
  })
  if (!usable || !followsAnError) return null
  const value = evaluateTemplate(`{{${substituted}}}`, {})
  if (value.includes('[error') || value.includes('NaN') || !Number.isFinite(Number(value))) return null
  return value
}

export function checkMultiBlank(blanks: BlankCheck[]): MultiBlankResult {
  // Pass 1 — mark every blank on its own merits.
  const results: BlankResult[] = blanks.map(b => {
    if (b.student.trim() === '') {
      return { label: b.label, student: b.student, correct: false, trap: null, message: 'Not answered.' }
    }
    const res = checkAnswer(b.student, b.answer, b.answer_type, b.tolerance, b.traps, b.requires_simplest, b.answer_template)
    return { label: b.label, student: b.student, ...res }
  })

  // Pass 2 — errors carried forward. A blank that's wrong outright may still be
  // right GIVEN the student's own earlier mistake, which is a method mark in
  // the exam. Pass 1 verdicts are the input, so this never cascades or loops:
  // ECF always follows through from what the student wrote, not from another
  // blank's follow-through.
  const studentByLabel = new Map(blanks.map(b => [b.label, b.student]))
  const correctByLabel = new Map(results.map(r => [r.label, r.correct]))
  for (let i = 0; i < blanks.length; i++) {
    const b = blanks[i]
    if (results[i].correct || !b.ecf || b.student.trim() === '') continue
    const expected = resolveEcf(b.ecf, b.label, studentByLabel, correctByLabel)
    if (expected === null) continue
    // Reuse the normal checker so tolerance and number formatting behave
    // exactly as they do for the canonical answer. Traps are dropped: a value
    // that legitimately follows through isn't a misconception, so trap
    // feedback would actively mislead.
    const res = checkAnswer(b.student, expected, b.answer_type, b.tolerance, [], b.requires_simplest, b.answer_template)
    if (!res.correct) continue
    results[i] = {
      label: b.label,
      student: b.student,
      correct: true,
      followThrough: true,
      trap: null,
      message: 'Correct, following through from your earlier answer.',
    }
  }

  // Follow-through can never make the aggregate all-correct: ECF only applies
  // when a referenced sibling is wrong, and that sibling stays wrong. So the
  // practice_attempts row still records the part as failed, as it should.
  const correctCount = results.filter(r => r.correct).length
  return {
    correct: correctCount === blanks.length && blanks.length > 0,
    correctCount,
    blanks: results,
  }
}
