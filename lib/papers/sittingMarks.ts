import type { PaperConfig } from '../demoPapers'

/**
 * The two rules that decide what a teacher's mark sheet does to skill tracking.
 *
 * Extracted from app/api/papers/sittings/route.ts so they can be tested without
 * standing up auth and a live class — these are where an off-by-one would be
 * both easy to write and invisible in the UI (a mark silently accepted at one
 * over the maximum, or a near-miss silently credited as mastery).
 */

export type ItemMarks = Record<string, number>

/**
 * Which of a paper's items were actually set.
 *
 * `null`/`undefined` means the whole paper — the default, and what every call
 * site meant before partial papers existed. An array is an explicit subset, in
 * the teacher's chosen order.
 *
 * WHY THIS IS PASSED AROUND RATHER THAN INFERRED from which item ids carry
 * marks: "not set" and "scored zero" are different, and inferring cannot tell
 * them apart. A teacher who writes 0 into every blank would silently shrink the
 * paper, moving the denominator under a student who simply did badly.
 */
export type ItemSelection = readonly string[] | null | undefined

export type StudentEntry = {
  studentId: string
  /** Present when correcting an existing sitting rather than creating one. */
  sittingId?: string
  marks: ItemMarks
}

/**
 * The paper's items narrowed to the selection, in paper order.
 *
 * Paper order rather than selection order: a feedback sheet reads down the
 * paper, and a teacher who ticks questions out of order did not mean to
 * reorder them.
 */
export function selectedItems(paper: PaperConfig, selection: ItemSelection) {
  if (!selection) return paper.questions
  const wanted = new Set(selection)
  return paper.questions.filter(q => wanted.has(q.id))
}

/**
 * Reject a submission before ANY of it is written, so a bad mark cannot leave
 * half a class recorded and half not.
 */
export function validateEntries(
  paper: PaperConfig,
  entries: StudentEntry[],
  selection?: ItemSelection,
): { ok: true } | { ok: false; error: string } {
  if (!entries.length) return { ok: false, error: 'No students supplied' }

  const itemById = new Map(paper.questions.map(q => [q.id, q]))

  if (selection) {
    // An empty selection would produce a zero denominator, which the
    // paper_sittings check constraint (marks_total > 0) rejects at the
    // database anyway — better to say so here than to fail on insert.
    if (!selection.length) {
      return { ok: false, error: 'Select at least one question' }
    }
    for (const itemId of selection) {
      if (!itemById.has(itemId)) {
        return { ok: false, error: `Unknown item "${itemId}" for ${paper.id}` }
      }
    }
  }
  const inSelection = selection ? new Set(selection) : null

  for (const e of entries) {
    if (typeof e?.studentId !== 'string' || !e.studentId) {
      return { ok: false, error: 'Each student needs a studentId' }
    }
    for (const [itemId, mark] of Object.entries(e.marks ?? {})) {
      const item = itemById.get(itemId)
      if (!item) {
        return { ok: false, error: `Unknown item "${itemId}" for ${paper.id}` }
      }
      // A mark for a question that was not set would be counted into
      // marksEarned while contributing nothing to marksTotal — a score over
      // 100%. Reject rather than silently drop it: it means the caller and the
      // teacher disagree about what was set.
      if (inSelection && !inSelection.has(itemId)) {
        return { ok: false, error: `Item "${itemId}" was not set on this paper` }
      }
      // Whole numbers only: exam marks are integers, and a fractional mark
      // would round unpredictably into the full-marks comparison below.
      if (!Number.isInteger(mark) || mark < 0 || mark > item.marks) {
        return {
          ok: false,
          error: `Mark for ${itemId} must be a whole number between 0 and ${item.marks}`,
        }
      }
    }
  }
  return { ok: true }
}

/** Sum of the marks awarded across every item in one student's entry. */
export function marksEarned(marks: ItemMarks): number {
  return Object.values(marks).reduce((s, m) => s + m, 0)
}

/**
 * Every mark available — on the whole paper, or on just the items that were set.
 *
 * The denominator MUST come from the selection, not the paper. Eight questions
 * set out of thirty and a student scoring 34 of an available 42 otherwise reads
 * as 34/80, which is not a worse mark for that student — it is the wrong mark.
 */
export function marksTotal(paper: PaperConfig, selection?: ItemSelection): number {
  return selectedItems(paper, selection).reduce((s, q) => s + q.marks, 0)
}

export type DerivedAttempt = {
  student_id: string
  question_id: string
  skill_ids: string[]
  correct: boolean
  kind: 'exam'
  sitting_id: string
}

/**
 * Turn one student's marks into `practice_attempts` rows.
 *
 * FULL MARKS ONLY COUNTS AS CORRECT (user ruling). Three out of four is
 * `correct: false`, exactly as a wrong answer in practice would be — the
 * mastery substrate is boolean throughout (see lib/exam/recordAttempts.ts,
 * which collapses a multi-mark exam part the same way), and the partial credit
 * that gets lost here is kept in full on the sitting itself.
 *
 * EVERY ROW IS POSITIVE-ONLY (`kind: 'exam'`), whatever the item's own kind.
 * calculateMastery skips a wrong exam-kind attempt entirely, so a dropped mark
 * can never lower a skill — it credits on success and stays silent on failure.
 */
export function deriveAttempts(
  paper: PaperConfig,
  marks: ItemMarks,
  questionIdByItem: Map<string, string>,
  studentId: string,
  sittingId: string,
): DerivedAttempt[] {
  const itemById = new Map(paper.questions.map(q => [q.id, q]))
  const out: DerivedAttempt[] = []

  for (const [itemId, mark] of Object.entries(marks)) {
    const item = itemById.get(itemId)
    const questionId = questionIdByItem.get(itemId)
    // Skip rather than throw: validateEntries has already rejected unknown
    // items, so reaching here means a missing anchor row, which the caller
    // reports as "not set up for tracking" before it gets this far.
    if (!item || !questionId) continue
    out.push({
      student_id: studentId,
      question_id: questionId,
      skill_ids: item.skillIds,
      correct: mark === item.marks,
      kind: 'exam',
      sitting_id: sittingId,
    })
  }
  return out
}
