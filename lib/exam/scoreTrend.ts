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
 * The x-axis is REAL TIME, not paper number. A month's break between papers is
 * information — plotting papers evenly spaced would hide it and imply steady
 * practice that never happened. The cost of a time axis is that papers sat close
 * together crowd into the same pixel, so they are bucketed and averaged.
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

export type Granularity = 'day' | 'week' | 'month'

/** One plotted point: the papers sat within a single time bucket, averaged. */
export type TrendBucket = {
  /** Bucket anchor (day/week-start/month), stable enough to use as a key. */
  key: string
  /** Mean timestamp of this bucket's papers — where the point actually sits. */
  date: string
  /** Mean score across the bucket, rounded. */
  pct: number
  /** How many papers were averaged into this point. */
  count: number
  /** Any Higher paper in the bucket — Higher is harder, so the chart flags it. */
  hasHigher: boolean
}

export type ScoreTrend = {
  buckets: TrendBucket[]
  granularity: Granularity
  /** Total papers behind the chart (≥ buckets.length once any are averaged). */
  papers: number
  /** Most recent PAPER's score — what the student last actually got. */
  latest: number
  /** Best single paper, not best bucket average. */
  best: number
  /** Mean across every paper. */
  average: number
  /** Last bucket minus first, in percentage points — matches the drawn line. */
  change: number
  /** True when the history spans both tiers; a dip may just be a harder paper. */
  mixedTiers: boolean
  /** True when any bucket averaged more than one paper. */
  averaged: boolean
}

/** A trend needs at least this many plotted points to mean anything. */
export const MIN_POINTS_FOR_TREND = 2

/**
 * Most points we will draw. Beyond this the line stops being readable and
 * individual papers are indistinguishable anyway, so we coarsen the bucket.
 */
const MAX_POINTS = 12

const DAY_MS = 86_400_000

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Monday-start week, matching how the class mastery trend buckets. */
function startOfWeek(d: Date): Date {
  const s = startOfDay(d)
  const dow = (s.getDay() + 6) % 7 // Mon = 0
  return new Date(s.getTime() - dow * DAY_MS)
}

function bucketKey(iso: string, g: Granularity): string {
  const d = new Date(iso)
  if (g === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const anchor = g === 'week' ? startOfWeek(d) : startOfDay(d)
  return `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-${String(anchor.getDate()).padStart(2, '0')}`
}

/**
 * The FINEST bucket that keeps the chart readable. A student sitting one paper a
 * month gets a point per paper (day buckets); one sitting several a week gets
 * them averaged into weeks or months rather than a crowded smear.
 */
export function chooseGranularity(dates: string[]): Granularity {
  for (const g of ['day', 'week', 'month'] as const) {
    if (new Set(dates.map(d => bucketKey(d, g))).size <= MAX_POINTS) return g
  }
  return 'month'
}

/**
 * Build the trend, or null when there is not enough history to show one.
 *
 * Null (rather than a one-point chart) is deliberate: a single point has no
 * direction, and drawing a line through it would imply one. Note this is one
 * point AFTER bucketing — two papers sat on the same day are one moment in time,
 * not a trend.
 */
export function buildScoreTrend(
  sessions: ExamSessionSummary[],
  minPoints = MIN_POINTS_FOR_TREND,
): ScoreTrend | null {
  type Paper = { date: string; time: number; pct: number; tier: 'foundation' | 'higher' }
  const papers: Paper[] = []
  for (const s of sessions) {
    const total = Number(s.marks_total)
    const earned = Number(s.marks_earned)
    const time = new Date(s.created_at).getTime()
    // A zero-total paper cannot yield a percentage, and an unparseable date
    // cannot be placed on a time axis. Skip rather than poison the chart.
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(earned) || !Number.isFinite(time)) continue
    papers.push({ date: s.created_at, time, pct: Math.round((earned / total) * 100), tier: s.tier })
  }
  if (papers.length === 0) return null

  papers.sort((a, b) => a.time - b.time)

  const granularity = chooseGranularity(papers.map(p => p.date))
  const groups = new Map<string, Paper[]>()
  for (const p of papers) {
    const k = bucketKey(p.date, granularity)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(p)
  }

  const buckets: TrendBucket[] = [...groups.entries()].map(([key, ps]) => ({
    key,
    // Mean timestamp, so the point sits where the papers actually were rather
    // than at an arbitrary bucket edge.
    date: new Date(ps.reduce((s, p) => s + p.time, 0) / ps.length).toISOString(),
    pct: Math.round(ps.reduce((s, p) => s + p.pct, 0) / ps.length),
    count: ps.length,
    hasHigher: ps.some(p => p.tier === 'higher'),
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (buckets.length < minPoints) return null

  const pcts = papers.map(p => p.pct)
  return {
    buckets,
    granularity,
    papers: papers.length,
    // Summary stats describe the PAPERS (what the student actually scored);
    // only `change` follows the drawn line, so the two never contradict.
    latest: pcts[pcts.length - 1],
    best: Math.max(...pcts),
    average: Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length),
    change: buckets[buckets.length - 1].pct - buckets[0].pct,
    mixedTiers: new Set(papers.map(p => p.tier)).size > 1,
    averaged: buckets.some(b => b.count > 1),
  }
}
