import { checkAnswer, type CheckResult } from './answerChecker'
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
  answer_type: ScalarAnswerType
  tolerance: number | null
  requires_simplest: boolean
  traps: { answer: string, response: string }[] // RENDERED traps
}

export type BlankResult = CheckResult & { label: string, student: string }

export type MultiBlankResult = {
  correct: boolean // every blank correct — feeds practice_attempts
  correctCount: number
  blanks: BlankResult[]
}

export function checkMultiBlank(blanks: BlankCheck[]): MultiBlankResult {
  const results: BlankResult[] = blanks.map(b => {
    if (b.student.trim() === '') {
      return { label: b.label, student: b.student, correct: false, trap: null, message: 'Not answered.' }
    }
    const res = checkAnswer(b.student, b.answer, b.answer_type, b.tolerance, b.traps, b.requires_simplest)
    return { label: b.label, student: b.student, ...res }
  })
  const correctCount = results.filter(r => r.correct).length
  return {
    correct: correctCount === blanks.length && blanks.length > 0,
    correctCount,
    blanks: results,
  }
}
