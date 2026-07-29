/**
 * The pure half of a mini-exam paper: turning a question row into the numbered
 * item the runner renders, and grading a set of answers against it.
 *
 * Extracted from ExamRunner so THREE surfaces can share one implementation —
 * the live runner, the post-submit review, and (via lib/exam/examSession.ts)
 * re-opening a stored paper. No React, no DOM, no Supabase: given the same
 * question row and the same parameter draw, buildItem is deterministic, which is
 * exactly what makes a stored paper reproducible.
 */

import { skillsById } from '../skills/skillGraph'
import { renderQuestion, renderMultiPartQuestion, type Parameters } from '../questions/paramEngine'
import { checkAnswer } from '../questions/answerChecker'
import { resolveQuestionMarks } from './markEvidence'
import type { QuestionPart } from '../questions/parts'
import type { ScalarAnswerType } from '../questions/answerTypes'
import {
  checkGridDraw, parseGridAnswer, formatGridPoints,
  type RenderedGrid, type GridDrawMode,
} from '../questions/gridDraw'

export type AnswerType = ScalarAnswerType
export type Tier = 'foundation' | 'higher'

export type Unit = {
  key: string                   // `${questionId}:${partIndex}` (+ `:${blankIndex}`)
  label: string | null          // "(a)" etc. for multi-part; null for single-part
  promptHtml: string            // part prompt (multi-part) or '' (single, uses header)
  correctAnswer: string
  answerType: AnswerType
  tolerance: number | null
  requiresSimplest: boolean
  traps: { answer: string; response: string }[]
  explanation: string
  skillIds: string[]
  kind: 'mastery' | 'exam'
  marks: number
  // A grid_draw part's rendered grid — when present the unit is answered on a
  // GridCanvas (answerType is an inert placeholder) and earns FRACTIONAL
  // credit per element.
  grid?: RenderedGrid
}

export type Item = {
  questionId: string
  number: number
  headerHtml: string
  imageUrl: string | null
  skillNames: string
  marks: number
  units: Unit[]
  // The parameter draw this item was rendered from. Snapshotted into
  // exam_sessions so the SAME numbers come back when the paper is re-opened.
  params: Record<string, number>
}

export type UnitResult = {
  correct: boolean // FULLY correct — the projected-mastery panel keys on this
  message: string
  studentAnswer: string
  correctAnswer: string
  explanation: string
  marksEarned: number // fractional credit: grid units earn per-element marks
  // grid units: verdict per student point (drawn order), for the review overlay
  perStudent?: boolean[]
}

export type QuestionRow = {
  id: string
  skill_ids: string[]
  difficulty: number
  calculator: string | null
  kind: string | null
  question_type: string
  parts: QuestionPart[] | null
  question_template: string
  answer_template: string
  answer_type: AnswerType
  tolerance: number | null
  requires_simplest: boolean | null
  traps: { answer_template: string; response: string }[] | null
  explanation: string | null
  image_url: string | null
  parameters: Parameters | null
}

/**
 * The columns buildItem needs — the question SELECT list, shared by the runner
 * and the re-review page. Deliberately ONE string literal with `as const`:
 * supabase-js infers the row type from the literal, so splitting or
 * concatenating it collapses the result to GenericStringError.
 */
export const QUESTION_COLUMNS = 'id, skill_ids, difficulty, calculator, kind, question_type, parts, question_template, answer_template, answer_type, tolerance, requires_simplest, traps, explanation, image_url, parameters' as const

const letter = (i: number) => `(${String.fromCharCode(97 + i)})`

/**
 * Render one question into a numbered paper item.
 *
 * `fixedValues` pins the parameter draw. Omit it for a fresh paper (the engine
 * generates); pass a stored draw to reproduce a paper exactly as it was sat.
 */
export function buildItem(q: QuestionRow, number: number, fixedValues?: Record<string, number>): Item {
  const skillNames = q.skill_ids.map(id => skillsById[id]?.name ?? id).join(', ')

  if (q.parts && q.parts.length > 0) {
    const r = renderMultiPartQuestion(q.question_template, q.parts, q.parameters ?? {}, fixedValues)
    // A multi_blank part flattens to one Unit PER BLANK (key q.id:i:b) — the
    // flat answers/results records, the submit loop, per-blank marks and the
    // review boxes then all work unchanged. (The mastery write collapses them
    // back into one attempt per part — see lib/exam/recordAttempts.ts.)
    const units: Unit[] = q.parts.flatMap((p, i) => {
      if (p.answer_type === 'multi_blank') {
        const rb = r.parts[i].blanks ?? []
        return (p.blanks ?? []).map((blank, b): Unit => ({
          key: `${q.id}:${i}:${b}`,
          label: `${letter(i)} · ${blank.label}`,
          // Part prompt rendered once (first blank); each blank then carries
          // its own short prompt so the units are self-describing.
          promptHtml: [b === 0 ? r.parts[i].prompt : '', rb[b]?.prompt ?? '']
            .filter(Boolean).join(' '),
          correctAnswer: rb[b]?.answer ?? '',
          answerType: blank.answer_type,
          tolerance: blank.tolerance,
          requiresSimplest: blank.requires_simplest ?? false,
          traps: rb[b]?.traps ?? [],
          // Explanation shown once, in the last blank's review box.
          explanation: b === (p.blanks?.length ?? 0) - 1 ? r.parts[i].explanation : '',
          skillIds: p.skill_ids,
          kind: p.kind === 'exam' ? 'exam' : 'mastery',
          marks: blank.marks || 1,
        }))
      }
      if (p.answer_type === 'grid_draw') {
        // ONE unit per grid part (a drawing is one interaction); fractional
        // credit comes from checkGridDraw at submit time. A missing rendered
        // grid (impossible for harness-verified rows) contributes nothing.
        const g = r.parts[i].grid as RenderedGrid | undefined
        if (!g) return []
        return [{
          key: `${q.id}:${i}`,
          label: letter(i),
          promptHtml: r.parts[i].prompt,
          correctAnswer: formatGridPoints(g.elements.map(e => ({ x: e.x, y: e.y }))),
          answerType: 'exact' as AnswerType, // inert — grid units never reach checkAnswer
          tolerance: null,
          requiresSimplest: false,
          traps: [],
          explanation: r.parts[i].explanation,
          skillIds: p.skill_ids,
          kind: p.kind === 'exam' ? 'exam' : 'mastery',
          marks: p.marks || 1,
          grid: g,
        }]
      }
      return [{
        key: `${q.id}:${i}`,
        label: letter(i),
        promptHtml: r.parts[i].prompt,
        correctAnswer: r.parts[i].answer,
        answerType: p.answer_type,
        tolerance: p.tolerance,
        requiresSimplest: p.requires_simplest ?? false,
        traps: r.parts[i].traps,
        explanation: r.parts[i].explanation,
        skillIds: p.skill_ids,
        kind: p.kind === 'exam' ? 'exam' : 'mastery',
        marks: p.marks || 1,
      }]
    })
    return {
      questionId: q.id, number, headerHtml: r.stem, imageUrl: q.image_url, skillNames,
      marks: units.reduce((s, u) => s + u.marks, 0), units,
      params: r.generatedValues,
    }
  }

  const r = renderQuestion(q.question_template, q.answer_template, q.traps ?? [], q.explanation, q.parameters ?? {}, fixedValues)
  // Must agree with the assembler, which prices the paper before it is built.
  const marks = resolveQuestionMarks(q).marks
  return {
    questionId: q.id,
    number,
    headerHtml: r.question,
    imageUrl: q.image_url,
    skillNames,
    marks,
    params: r.generatedValues,
    units: [{
      key: `${q.id}:0`,
      label: null,
      promptHtml: '',
      correctAnswer: r.answer,
      answerType: q.answer_type,
      tolerance: q.tolerance,
      requiresSimplest: q.requires_simplest ?? false,
      traps: r.traps,
      explanation: r.explanation,
      skillIds: q.skill_ids,
      kind: q.kind === 'exam' ? 'exam' : 'mastery',
      marks,
    }],
  }
}

/**
 * Grade every unit of a paper against the student's raw answers.
 *
 * Pure and total: an unanswered unit scores 0 with a "Not answered" message
 * rather than being omitted, so the review can show every unit. Because this is
 * the ONLY grading path, a paper re-opened from storage is graded by exactly the
 * same code that graded it at submit.
 */
export function gradeUnits(
  items: Item[],
  answers: Record<string, string>,
): { results: Record<string, UnitResult>; earned: number } {
  const results: Record<string, UnitResult> = {}
  let earned = 0

  for (const item of items) {
    for (const u of item.units) {
      const raw = (answers[u.key] ?? '').trim()
      if (raw === '') {
        results[u.key] = { correct: false, message: 'Not answered.', studentAnswer: '', correctAnswer: u.correctAnswer, explanation: u.explanation, marksEarned: 0 }
        continue
      }
      if (u.grid) {
        // Grid units earn fractional per-element credit (the method marks);
        // `correct` stays "fully correct" so projected mastery is unchanged.
        const pts = parseGridAnswer(raw)
        const g = u.grid
        const check = checkGridDraw(
          pts, g.elements, g.mode as GridDrawMode, g.tolerance,
          { xStep: g.x.step, yStep: g.y.step },
          g.traps ?? [],
        )
        earned += check.marksEarned
        const nRight = check.perElement.filter(e => e.correct).length
        const unitNoun = g.mode === 'cells' ? 'squares'
          : g.mode === 'polygon' ? 'corners'
          : g.mode === 'bars' || g.mode === 'bars_free' ? 'bars'
          : 'points'
        results[u.key] = {
          correct: check.correct,
          // The trap response is additive: it explains the score line rather
          // than replacing it (the review markers are keyed to the count).
          message: check.correct
            ? 'Correct!'
            : `${nRight} of ${g.elements.length} ${unitNoun} correct`
              + (check.trap ? `<br/>${check.trap.response}` : ''),
          studentAnswer: formatGridPoints(pts),
          correctAnswer: u.correctAnswer,
          explanation: u.explanation,
          marksEarned: check.marksEarned,
          perStudent: check.perStudent,
        }
        continue
      }
      const check = checkAnswer(raw, u.correctAnswer, u.answerType, u.tolerance, u.traps, u.requiresSimplest)
      if (check.correct) earned += u.marks
      results[u.key] = { correct: check.correct, message: check.message, studentAnswer: raw, correctAnswer: u.correctAnswer, explanation: u.explanation, marksEarned: check.correct ? u.marks : 0 }
    }
  }

  return { results, earned }
}
