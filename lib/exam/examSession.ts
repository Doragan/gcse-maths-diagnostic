/**
 * Snapshotting a sat mini-exam, and rebuilding one from storage.
 *
 * WHAT IS STORED (and why it is enough): questions are parametric, so a
 * question_id alone cannot reproduce a paper — re-rendering draws different
 * numbers. But `id + the parameter draw + the raw answer` is sufficient:
 *   - buildItem with `fixedValues` reproduces the exact stem, prompts, correct
 *     answers and explanations;
 *   - gradeUnits on the stored answers reproduces the verdicts, marks, trap
 *     feedback and grid overlays.
 * So per-unit verdicts and marks are NOT stored — they are derived here, by the
 * same code that graded the paper at submit.
 *
 * The consequence, accepted deliberately: a re-opened paper reflects CURRENT
 * grading, so a later grader fix or question edit changes what the review shows.
 * The score that fed the history/trend does not move with it — that is pinned in
 * the exam_sessions columns (see the migration).
 */

import { buildItem, gradeUnits, type Item, type QuestionRow, type UnitResult } from './examPaper'

/**
 * How the paper was sat, as opposed to what was on it.
 *
 * Rides inside the existing `paper` jsonb rather than taking new columns: it is
 * descriptive detail for the review, never queried or aggregated, and adding
 * columns would need a migration for something no list or chart reads. Every
 * field is optional — papers sat before timing existed simply have none.
 */
export type PaperMeta = {
  /** Sat under a countdown, rather than at the student's own pace. */
  timed?: boolean
  /** The allowance, at the real paper rate — see EXAM_SECONDS_PER_MARK. */
  allowedSeconds?: number
  /** How long it actually took, whether timed or not. */
  elapsedSeconds?: number
  /** Submitted by the clock running out rather than by the student. */
  autoSubmitted?: boolean
}

/** The `paper` jsonb column of exam_sessions. */
export type PaperSnapshot = {
  /** Paper order — index 0 is Question 1. */
  questions: { id: string; params: Record<string, number> }[]
  /** Raw submitted answers by unit key (`qid:part[:blank]`). Blanks omitted. */
  answers: Record<string, string>
  meta?: PaperMeta
}

export type RehydratedPaper = {
  items: Item[]
  answers: Record<string, string>
  results: Record<string, UnitResult>
  earned: number
  /**
   * Method marks a real examiner might have added — re-derived, never stored.
   *
   * Deliberately not pinned like `marks_earned`: the band is an estimate about
   * marks we cannot see, so it SHOULD move when the estimate improves, and
   * nothing (history list, score trend) depends on it holding still.
   */
  unknown: number
  meta: PaperMeta
  /** Ids present in the snapshot whose question could not be loaded. */
  missingQuestionIds: string[]
}

/**
 * Build the stored snapshot from a freshly-sat paper.
 *
 * Only answers belonging to this paper's units are kept, and only non-empty
 * ones — a missing key re-hydrates as "Not answered", which is what a blank is.
 */
export function buildPaperSnapshot(
  items: Item[],
  answers: Record<string, string>,
  meta?: PaperMeta,
): PaperSnapshot {
  const kept: Record<string, string> = {}
  for (const item of items) {
    for (const u of item.units) {
      const raw = (answers[u.key] ?? '').trim()
      if (raw !== '') kept[u.key] = raw
    }
  }
  return {
    questions: items.map(it => ({ id: it.questionId, params: it.params })),
    answers: kept,
    ...(meta && Object.keys(meta).length ? { meta } : {}),
  }
}

/**
 * Rebuild a stored paper into exactly what the review renders.
 *
 * A question that has since been deleted or unpublished is skipped rather than
 * throwing — the caller shows the remaining questions plus a note. Paper
 * NUMBERING follows the stored order, so a missing question leaves a gap rather
 * than renumbering the ones around it (the student sat "Question 5"; it stays 5).
 */
export function rehydratePaper(
  snapshot: PaperSnapshot,
  questionsById: Map<string, QuestionRow>,
): RehydratedPaper {
  const items: Item[] = []
  const missingQuestionIds: string[] = []

  snapshot.questions.forEach((entry, i) => {
    const row = questionsById.get(entry.id)
    if (!row) { missingQuestionIds.push(entry.id); return }
    items.push(buildItem(row, i + 1, entry.params))
  })

  const { results, earned, unknown } = gradeUnits(items, snapshot.answers)
  return {
    items, answers: snapshot.answers, results, earned, unknown,
    meta: snapshot.meta ?? {},
    missingQuestionIds,
  }
}

/**
 * Narrow an unknown jsonb value to a PaperSnapshot, or null if it is not one.
 * The column is written by this app, but a hand-edited or partially-written row
 * must degrade to "can't re-open this" rather than crashing the page.
 */
export function parsePaperSnapshot(value: unknown): PaperSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.questions)) return null
  const questions: PaperSnapshot['questions'] = []
  for (const q of v.questions) {
    if (!q || typeof q !== 'object') return null
    const { id, params } = q as Record<string, unknown>
    if (typeof id !== 'string') return null
    const p: Record<string, number> = {}
    if (params && typeof params === 'object') {
      for (const [k, val] of Object.entries(params as Record<string, unknown>)) {
        if (typeof val === 'number' && Number.isFinite(val)) p[k] = val
      }
    }
    questions.push({ id, params: p })
  }
  const answers: Record<string, string> = {}
  if (v.answers && typeof v.answers === 'object') {
    for (const [k, val] of Object.entries(v.answers as Record<string, unknown>)) {
      if (typeof val === 'string') answers[k] = val
    }
  }
  return { questions, answers, ...(parseMeta(v.meta) ? { meta: parseMeta(v.meta)! } : {}) }
}

/**
 * Narrow the optional `meta` block. Field-by-field rather than a cast, so a
 * partially-written or older row yields the fields it does have instead of
 * being discarded whole — meta is descriptive, and losing it must never stop a
 * paper re-opening.
 */
function parseMeta(value: unknown): PaperMeta | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  const meta: PaperMeta = {}
  if (typeof v.timed === 'boolean') meta.timed = v.timed
  if (typeof v.autoSubmitted === 'boolean') meta.autoSubmitted = v.autoSubmitted
  for (const k of ['allowedSeconds', 'elapsedSeconds'] as const) {
    const n = v[k]
    if (typeof n === 'number' && Number.isFinite(n) && n >= 0) meta[k] = n
  }
  return Object.keys(meta).length ? meta : null
}
