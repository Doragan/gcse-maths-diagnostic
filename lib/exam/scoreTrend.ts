/**
 * Mini-exam scores over time — the summative half of the two-currency model.
 *
 * The skill map answers "which topics do I need to work on". This answers "how
 * would I score on a paper, and is that improving" — which only became a fair
 * question once papers were made comparable: marks are now priced against the
 * coded 2024 series (markEvidence.ts) and every paper is assembled to the same
 * ~25-mark budget (blueprint.ts), so a 60% is a 60% across papers rather than an
 * artefact of one paper happening to be longer.
 *
 * Pure: sessions in, chart-ready data out. No React, no Supabase.
 */

export type ExamSessionSummary = {
  id: string
  created_at: string
  tier: 'foundation' | 'higher'
  calculator: 'calc' | 'non_calc'
  marks_earned: number
  marks_total: number
}

export type TrendPoint = {
  id: string
  date: string
  /** Score as a whole-number percentage — the comparable unit across papers. */
  pct: number
  marksEarned: number
  marksTotal: number
  tier: 'foundation' | 'higher'
  calculator: 'calc' | 'non_calc'
}

export type ScoreTrend = {
  /** Oldest first — the order they were sat. */
  points: TrendPoint[]
  latest: number
  best: number
  /** Mean across every paper, rounded. */
  average: number
  /** Latest minus first, in percentage points. */
  change: number
  /**
   * True when the papers span BOTH tiers. Higher papers are harder, so a line
   * mixing them can show a drop that is really a change of tier — the caller
   * must say so rather than let the student read it as getting worse.
   */
  mixedTiers: boolean
}

/** A trend needs at least this many papers to mean anything at all. */
export const MIN_PAPERS_FOR_TREND = 2

/**
 * Build the trend, or null when there is not enough history.
 *
 * Returning null (rather than a one-point chart) is deliberate: with a single
 * paper there is no trend, and drawing one would imply a direction the data
 * cannot support.
 */
export function buildScoreTrend(
  sessions: ExamSessionSummary[],
  minPapers = MIN_PAPERS_FOR_TREND,
): ScoreTrend | null {
  const points: TrendPoint[] = []
  for (const s of sessions) {
    const total = Number(s.marks_total)
    const earned = Number(s.marks_earned)
    // A zero-total paper cannot yield a percentage; skip rather than divide by
    // zero. (Shouldn't exist — the column is CHECKed > 0 — but this is the one
    // place a bad row would poison the whole chart.)
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(earned)) continue
    points.push({
      id: s.id,
      date: s.created_at,
      pct: Math.round((earned / total) * 100),
      marksEarned: earned,
      marksTotal: total,
      tier: s.tier,
      calculator: s.calculator,
    })
  }

  // Oldest first, so the chart reads left-to-right as papers were sat.
  points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (points.length < minPapers) return null

  const pcts = points.map(p => p.pct)
  return {
    points,
    latest: pcts[pcts.length - 1],
    best: Math.max(...pcts),
    average: Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length),
    change: pcts[pcts.length - 1] - pcts[0],
    mixedTiers: new Set(points.map(p => p.tier)).size > 1,
  }
}
