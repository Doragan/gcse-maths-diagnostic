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
import { resolveQuestionMarks, methodMarkShare } from './markEvidence'
import { bandedMarks, bandedMax, type QuestionPart, type MarkBand } from '../questions/parts'
import { checkMultiBlank } from '../questions/multiBlank'
import { buildOptions, renderMcOptions } from '../questions/multipleChoice'
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
  /**
   * The UNRENDERED answer template. Carried so the grader can tell whether the
   * answer is built from π, which gates the poor-π-estimate check.
   */
  answerTemplate?: string
  answerType: AnswerType
  tolerance: number | null
  requiresSimplest: boolean
  traps: { answer: string; response: string; method_marks?: number }[]
  explanation: string
  skillIds: string[]
  kind: 'mastery' | 'exam'
  marks: number
  // A grid_draw part's rendered grid — when present the unit is answered on a
  // GridCanvas (answerType is an inert placeholder) and earns FRACTIONAL
  // credit per element.
  grid?: RenderedGrid
  /**
   * Multiple-choice options, in the order to display them.
   *
   * Order is SEEDED from the question id and its parameter draw, not random:
   * a stored paper keeps only ids, params and raw answers, so a random order
   * would come back different on re-open and the review would not match the
   * paper that was sat. The answer is stored as the option TEXT, so grading
   * goes through checkAnswer unchanged.
   */
  options?: string[]
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
  /**
   * Marks a real examiner might have awarded for method that we cannot see —
   * the third state, between `marksEarned` (confirmed) and simply lost.
   *
   * Present only on a wrong-but-attempted answer to a multi-mark question. Never
   * added to `marksEarned`: the recorded score stays the confirmed floor, and
   * this widens an uncertainty band around it instead.
   */
  marksUnknown?: number
  /**
   * A trap told us the method WAS sound (e.g. "you found the midpoint but didn't
   * halve it"), so those marks moved from unknown to confirmed. Set to the marks
   * awarded, so the review can explain where they came from.
   */
  methodAwarded?: number
}

/**
 * A paper's score under the three-state model.
 *
 * `earned` is the confirmed floor — every mark we can prove. `unknown` is what a
 * real examiner would likely add for method behind the wrong answers; it is an
 * expectation drawn from the coded papers (see methodMarkShare), not a
 * ceiling, and deliberately never folded into `earned`.
 */
export type PaperScore = {
  earned: number
  unknown: number
  total: number
}

/**
 * Marks a wrong-but-attempted answer may still have earned for method.
 *
 * Three rules, in order:
 *   - a trap that the author marked as proving method PAYS OUT — that credit is
 *     confirmed, not uncertain, because the trap identifies the exact slip;
 *   - otherwise the marks stay UNKNOWN at the evidence rate for a part that
 *     size, because we genuinely cannot see the working;
 *   - a 1-mark part yields nothing either way. Across 149 coded 1-mark parts,
 *     not one carried a method mark: there is no method to credit when the whole
 *     mark is the answer.
 *
 * A blank answer is handled by the caller and earns nothing at all — no work
 * means no method, and that distinction is what keeps attempting worthwhile.
 */
function methodCredit(
  marks: number,
  trap: { method_marks?: number } | null,
): { awarded: number; unknown: number } {
  if (marks <= 1) return { awarded: 0, unknown: 0 }
  // Clamped so a mis-authored trap can never pay more than the part is worth,
  // nor pay for the accuracy mark that needs the right answer.
  const ceiling = marks - 1
  if (trap && typeof trap.method_marks === 'number') {
    return { awarded: Math.max(0, Math.min(trap.method_marks, ceiling)), unknown: 0 }
  }
  return { awarded: 0, unknown: methodMarkShare(marks) }
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
  traps: { answer_template: string; response: string; method_marks?: number }[] | null
  explanation: string | null
  image_url: string | null
  parameters: Parameters | null
  /** Author-supplied MC option templates; null falls back to derived options. */
  mc_options?: string[] | null
}

/**
 * The columns buildItem needs — the question SELECT list, shared by the runner
 * and the re-review page. Deliberately ONE string literal with `as const`:
 * supabase-js infers the row type from the literal, so splitting or
 * concatenating it collapses the result to GenericStringError.
 */
export const QUESTION_COLUMNS = 'id, skill_ids, difficulty, calculator, kind, marks, question_type, parts, question_template, answer_template, answer_type, tolerance, requires_simplest, traps, explanation, image_url, parameters, mc_options' as const

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
    /**
     * "(a)" only means something when there is a "(b)".
     *
     * Some question SHAPES are necessarily one part in a parts array —
     * grid_draw and multi_blank are only expressible as parts — so labelling
     * them "(a)" invented a part structure the student could see was missing.
     */
    const partLetter = (i: number) => (q.parts!.length > 1 ? letter(i) : null)
    /**
     * Drop a part letter the author already typed at the start of the prompt.
     *
     * 61 of the bank's 72 multi-part prompts open with their own "(a)", so the
     * app's label made every one of them read "(a) (a) How many…". The app's
     * label is the single source of truth — it is the one that knows whether a
     * letter is warranted at all — so the authored duplicate goes.
     *
     * Matched against THIS part's own letter, never any letter: a prompt that
     * genuinely opens with different bracketed algebra is left alone.
     */
    const stripLeadingLetter = (prompt: string, i: number) => {
      const own = String.fromCharCode(97 + i)
      return prompt.replace(new RegExp(`^\\s*\\(?${own}\\)\\s*`, 'i'), '')
    }
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
          label: [partLetter(i), blank.label].filter(Boolean).join(" · "),
          // Part prompt rendered once (first blank); each blank then carries
          // its own short prompt so the units are self-describing.
          promptHtml: [b === 0 ? stripLeadingLetter(r.parts[i].prompt, i) : "", rb[b]?.prompt ?? '']
            .filter(Boolean).join(' '),
          correctAnswer: rb[b]?.answer ?? '',
          answerTemplate: blank.answer_template,
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
          label: partLetter(i),
          promptHtml: stripLeadingLetter(r.parts[i].prompt, i),
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
        label: partLetter(i),
        promptHtml: stripLeadingLetter(r.parts[i].prompt, i),
        correctAnswer: r.parts[i].answer,
        answerTemplate: p.answer_template,
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
  const isMc = q.question_type === 'multiple_choice'
  // Must agree with the assembler, which prices the paper before it is built —
  // including its rule that a multiple-choice question is worth 1 mark.
  const marks = isMc
    ? (q.marks != null && Number.isFinite(q.marks) && q.marks > 0 ? Math.round(q.marks) : 1)
    : resolveQuestionMarks(q).marks
  // Seed the option order from the id and the actual parameter draw, so the
  // same paper always presents the same options in the same places — including
  // when it is rebuilt from storage months later.
  const options = isMc
    ? buildOptions(
        r.answer,
        r.traps,
        renderMcOptions(q.mc_options, r.generatedValues),
        `${q.id}|${JSON.stringify(r.generatedValues)}`,
      )
    : undefined
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
      answerTemplate: q.answer_template,
      answerType: q.answer_type,
      tolerance: q.tolerance,
      requiresSimplest: q.requires_simplest ?? false,
      traps: r.traps,
      explanation: r.explanation,
      skillIds: q.skill_ids,
      kind: q.kind === 'exam' ? 'exam' : 'mastery',
      marks,
      ...(options ? { options } : {}),
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
): { earned: number; unknown: number } {
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
  let unknown = 0
  group.forEach((u, i) => {
    const r = checked.blanks[i]
    const answered = (answers[u.key] ?? '').trim() !== ''
    // Under a banded scheme the first unit carries the part's marks; otherwise
    // each blank earns its own.
    const unitMarks = bands
      ? (i === 0 ? partMarks : 0)
      : (r.correct ? u.marks : 0)
    // A banded part already prices partial success — its bands ARE the method
    // marks — so adding a method estimate on top would pay twice for the same
    // work. Only plain per-blank scoring has a blind spot to fill.
    const credit = (!bands && !r.correct && answered)
      ? methodCredit(u.marks, r.trap)
      : { awarded: 0, unknown: 0 }
    earned += unitMarks + credit.awarded
    unknown += credit.unknown
    results[u.key] = {
      correct: r.correct,
      message: !answered ? 'Not answered.'
        : r.followThrough ? 'Correct, following through from your earlier answer.'
        : r.message,
      studentAnswer: answers[u.key] ?? '',
      correctAnswer: u.correctAnswer,
      explanation: u.explanation,
      marksEarned: unitMarks + credit.awarded,
      ...(r.followThrough ? { followThrough: true } : {}),
      ...(credit.unknown > 0 ? { marksUnknown: credit.unknown } : {}),
      ...(credit.awarded > 0 ? { methodAwarded: credit.awarded } : {}),
    }
  })
  return { earned, unknown }
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
): { results: Record<string, UnitResult>; earned: number; unknown: number } {
  const results: Record<string, UnitResult> = {}
  let earned = 0
  // Method marks a real examiner might have awarded but we cannot see. Kept
  // strictly apart from `earned` so the recorded score never overstates.
  let unknown = 0

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
      const g = gradeBlankGroup(group, answers, results)
      earned += g.earned
      unknown += g.unknown
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
      const check = checkAnswer(raw, u.correctAnswer, u.answerType, u.tolerance, u.traps, u.requiresSimplest, u.answerTemplate)
      if (check.correct) {
        // Units missing or wrong. The maths is sound, so it stays `correct`
        // and the skill map credits it in full — the unit is rarely the skill
        // under test. Exam MARKS are the exception: real schemes fold units
        // into the final accuracy mark, so an answer not expressed in the unit
        // the question asked for cannot have that mark. The method marks stay.
        const earnedHere = check.unitsIssue ? Math.max(0, u.marks - 1) : u.marks
        earned += earnedHere
        results[u.key] = {
          correct: true,
          message: check.message,
          studentAnswer: raw,
          correctAnswer: u.correctAnswer,
          explanation: u.explanation,
          marksEarned: earnedHere,
        }
        continue
      }
      // Wrong, but attempted — the only place method marks arise.
      const credit = methodCredit(u.marks, check.trap)
      earned += credit.awarded
      unknown += credit.unknown
      results[u.key] = {
        correct: false,
        message: check.message,
        studentAnswer: raw,
        correctAnswer: u.correctAnswer,
        explanation: u.explanation,
        marksEarned: credit.awarded,
        ...(credit.unknown > 0 ? { marksUnknown: credit.unknown } : {}),
        ...(credit.awarded > 0 ? { methodAwarded: credit.awarded } : {}),
      }
    }
  }

  return { results, earned, unknown }
}
