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
import { bandedMarks, bandedMax, type QuestionPart, type MarkBand } from '../questions/parts'
import { checkMultiBlank } from '../questions/multiBlank'
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
  /**
   * One blank of a `multi_blank` part. The blanks stay separate UNITS (each
   * needs its own input box and review line), but they must be GRADED together:
   * errors-carried-forward means a blank can be right given the student's own
   * earlier slip, which is invisible when each is checked in isolation.
   *
   * Every unit of the same part shares `partKey`. `bands`/`partMarks` are set on
   * the FIRST unit only — a banded scheme prices the whole part, so exactly one
   * unit carries the marks and the rest carry zero (see gradeUnits).
   */
  blank?: {
    partKey: string
    label: string
    /** Rendered errors-carried-forward formula, e.g. '[[F]] - 4'. */
    ecf?: string
    /** Banded mark scheme (first unit of the part only). */
    bands?: MarkBand[]
  }
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
  /**
   * multi_blank: correct only BECAUSE we followed through from the student's own
   * wrong answer elsewhere. Credited, but shown amber rather than green — the
   * value itself is not the right one.
   */
  followThrough?: boolean
}

export type QuestionRow = {
  id: string
  skill_ids: string[]
  difficulty: number
  calculator: string | null
  kind: string | null
  /** Author's explicit exam marks; null = estimate from the coded papers. */
  marks: number | null
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
export const QUESTION_COLUMNS = 'id, skill_ids, difficulty, calculator, kind, marks, question_type, parts, question_template, answer_template, answer_type, tolerance, requires_simplest, traps, explanation, image_url, parameters' as const

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
        const bands = p.mark_bands && p.mark_bands.length > 0 ? p.mark_bands : undefined
        const partKey = `${q.id}:${i}`
        return (p.blanks ?? []).map((blank, b): Unit => ({
          key: `${partKey}:${b}`,
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
          // Under a banded scheme the marks belong to the PART, so the first
          // blank carries them all and the rest carry none.
          marks: bands ? (b === 0 ? bandedMax(bands) : 0) : (blank.marks || 1),
          blank: {
            partKey,
            label: blank.label,
            ...(rb[b]?.ecf ? { ecf: rb[b].ecf } : {}),
            ...(bands && b === 0 ? { bands } : {}),
          },
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
 * Grade one multi_blank part's blanks together, writing a result per blank and
 * returning the marks the PART earned.
 *
 * Two things only work at part level:
 *   - errors carried forward — `checkMultiBlank` follows a blank through from
 *     what the student actually wrote elsewhere, so a blank that is wrong on its
 *     own merits can still earn its method mark;
 *   - banded marks — real "complete the table" schemes award by how many cells
 *     are right (B3 all / B2 all-but-one / B1 any, ecf), not per cell.
 *
 * Without bands the behaviour is unchanged: each blank simply earns its own
 * marks, exactly as before, but now with ECF applied.
 */
function gradeBlankGroup(
  group: Unit[],
  answers: Record<string, string>,
  results: Record<string, UnitResult>,
): number {
  const checked = checkMultiBlank(group.map(u => ({
    label: u.blank!.label,
    student: (answers[u.key] ?? '').trim(),
    answer: u.correctAnswer,
    answer_type: u.answerType,
    tolerance: u.tolerance,
    requires_simplest: u.requiresSimplest,
    traps: u.traps,
    ...(u.blank!.ecf ? { ecf: u.blank!.ecf } : {}),
  })))

  const bands = group.find(u => u.blank?.bands)?.blank?.bands
  // A follow-through blank has earned its method mark, so it counts toward the
  // band — that is exactly what "(ecf)" means on a real mark scheme.
  const partMarks = bands ? bandedMarks(bands, checked.correctCount) : 0

  let earned = 0
  group.forEach((u, i) => {
    const r = checked.blanks[i]
    const answered = (answers[u.key] ?? '').trim() !== ''
    // Under a banded scheme the first unit carries the part's marks; otherwise
    // each blank earns its own.
    const unitMarks = bands
      ? (i === 0 ? partMarks : 0)
      : (r.correct ? u.marks : 0)
    earned += unitMarks
    results[u.key] = {
      correct: r.correct,
      message: !answered ? 'Not answered.'
        : r.followThrough ? 'Correct, following through from your earlier answer.'
        : r.message,
      studentAnswer: answers[u.key] ?? '',
      correctAnswer: u.correctAnswer,
      explanation: u.explanation,
      marksEarned: unitMarks,
      ...(r.followThrough ? { followThrough: true } : {}),
    }
  })
  return earned
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
    // multi_blank parts are graded as a WHOLE, before the per-unit loop: their
    // blanks are separate units for input and review, but errors-carried-forward
    // means a blank can be right *given* the student's own earlier slip, which
    // is invisible when each blank is checked in isolation. This is also where a
    // banded scheme is applied.
    const blankUnits = item.units.filter(u => u.blank)
    const byPart = new Map<string, Unit[]>()
    for (const u of blankUnits) {
      const k = u.blank!.partKey
      if (!byPart.has(k)) byPart.set(k, [])
      byPart.get(k)!.push(u)
    }
    for (const group of byPart.values()) {
      earned += gradeBlankGroup(group, answers, results)
    }

    for (const u of item.units) {
      if (u.blank) continue // already graded above
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
