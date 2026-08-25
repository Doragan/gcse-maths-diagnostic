/**
 * How many marks is a question worth?
 *
 * Until now a single-part question's marks came from a flat guess by difficulty
 * (`NOMINAL_MARKS` = {1:1, 2:1, 3:2, 4:3}), which averaged ~1.8 marks/part
 * against a real-exam average of 2.19, and ignored `kind` entirely even though
 * real synthesis parts are worth well over half again a single-skill part
 * (3.47 vs 2.01). 85% of the published bank was priced that way.
 *
 * This module replaces the guess with evidence from the coded series — 30
 * papers, 1095 parts, 2400 marks (data/exam-audit/, precomputed into
 * markEvidence.data.ts).
 *
 * WHAT IT CAN AND CANNOT DO. The scoping analysis found that a real question's
 * marks are the count of creditable steps in its solution — `mark_split` (B1,
 * M1 A1, …) predicts marks perfectly because it IS the marks. That is a property
 * of the method chain, not of the topic, so topic-based estimation has a floor:
 * conditioning on skill leaves SD 0.83, skill+kind 0.64, against an overall SD
 * of 1.07. `simple_arithmetic` parts genuinely range 1–5 marks.
 *
 * So this is a better CENTRE, not a precise answer. Where the estimate is wrong
 * the fix is an explicit author-set mark on the question, not a cleverer formula.
 */

import { BY_SKILL_KIND, BY_KIND, OVERALL, METHOD_SHARE_BY_MARKS, type MarkStats } from './markEvidence.data'

export type QuestionKind = 'mastery' | 'exam'

/**
 * Minimum observations before a skill's own evidence is preferred over the
 * broader kind average. One or two coded parts is not a distribution — with 200
 * skill+kind buckets, only 47 reach n≥4 — so below this we would be reading
 * noise as signal.
 */
export const MIN_OBSERVATIONS = 3

/**
 * How far difficulty moves a question either side of its evidential centre.
 *
 * The audit carries no difficulty field, so this is NOT empirical — it is a
 * judgement, tuned so an assembled paper lands near the ~25-mark target while
 * preserving the blueprint's d1→d4 ramp. Without it every question on a skill
 * would cost the same regardless of demand, flattening the ramp the blueprint
 * exists to create.
 */
export const DIFFICULTY_SPREAD = 0.6

/**
 * Best available statistics for a question, preferring the skill with the most
 * coded parts (the most reliable estimate) over, say, the first-listed one.
 * Returns null when no tagged skill clears MIN_OBSERVATIONS.
 */
export function evidenceFor(skillIds: string[], kind: QuestionKind): MarkStats | null {
  let best: MarkStats | null = null
  for (const id of skillIds ?? []) {
    const s = BY_SKILL_KIND[`${id}|${kind}`]
    if (!s || s.n < MIN_OBSERVATIONS) continue
    if (!best || s.n > best.n) best = s
  }
  return best
}

/** Evidence for a kind alone — the fallback centre when a skill is thin. */
export function evidenceForKind(kind: QuestionKind): MarkStats {
  return BY_KIND[kind] ?? OVERALL
}

/** Today's flat table, kept as the final fallback. */
const DIFFICULTY_FALLBACK: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4 }

export type MarksSource = 'explicit' | 'skill' | 'kind' | 'difficulty'

/**
 * Resolve a question's marks, in order of confidence:
 *   1. an explicit author-set value (always wins — the override for cases the
 *      evidence gets wrong, or a deliberately short question);
 *   2. the best-evidenced skill+kind average, nudged by difficulty and clamped
 *      to the range actually observed for that skill;
 *   3. the kind average (mastery ≈ 1.55, exam ≈ 2.82), same nudge;
 *   4. the old difficulty table.
 *
 * Always a whole number ≥ 1: fractional nominal marks would make paper totals
 * read oddly, and no real part is worth less than one mark.
 */
export function resolveQuestionMarks(q: {
  marks?: number | null
  skill_ids?: string[] | null
  kind?: string | null
  difficulty?: number | null
}): { marks: number; source: MarksSource } {
  if (q.marks != null && Number.isFinite(q.marks) && q.marks > 0) {
    return { marks: Math.round(q.marks), source: 'explicit' }
  }

  const kind: QuestionKind = q.kind === 'exam' ? 'exam' : 'mastery'
  const difficulty = Number.isFinite(q.difficulty) ? Number(q.difficulty) : 2

  const skillStats = evidenceFor(q.skill_ids ?? [], kind)
  const stats = skillStats ?? evidenceForKind(kind)
  const source: MarksSource = skillStats ? 'skill' : 'kind'

  if (!stats) return { marks: DIFFICULTY_FALLBACK[difficulty] ?? 1, source: 'difficulty' }

  // Centre on the evidence, then let difficulty move it either side.
  const nudged = stats.mean + (difficulty - 2.5) * DIFFICULTY_SPREAD
  // Never leave the range real papers actually award for this material.
  const clamped = Math.min(Math.max(nudged, stats.min), stats.max)
  return { marks: Math.max(1, Math.round(clamped)), source }
}

/**
 * How many of a part's marks a real scheme would typically award for METHOD —
 * the credit that survives a wrong final answer.
 *
 * This is the size of auto-grading's blind spot. We mark a final answer right or
 * wrong; a real examiner also reads the working and pays for a sound approach.
 * Across the coded papers that is 601 of 2400 marks — 25% of every paper —
 * so scoring a wrong answer as a flat zero is not merely conservative, it is
 * systematically low by about a quarter.
 *
 * An EXPECTATION, not a ceiling: it averages over all parts of that size,
 * including the many whose schemes award no method marks at all. A 3-mark part
 * could be M2 A1 (2 method marks) or B3 (none); 0.93 is what the mix comes to.
 * That makes it the right basis for "what were the marks we cannot see probably
 * worth", and the wrong basis for "the most you could have got".
 *
 * Capped below `marks` because at least one mark always needs the right answer:
 * no scheme pays full marks for method alone.
 */
export function methodMarkShare(marks: number): number {
  if (!Number.isFinite(marks) || marks <= 1) return 0
  const table = METHOD_SHARE_BY_MARKS
  // Beyond the largest coded part size, hold the top rate rather than
  // extrapolating from a 12-part sample.
  const sizes = Object.keys(table).map(Number).sort((a, b) => a - b)
  const key = marks <= sizes[sizes.length - 1] ? Math.floor(marks) : sizes[sizes.length - 1]
  const share = table[key] ?? 0
  return Math.min(share, marks - 1)
}
