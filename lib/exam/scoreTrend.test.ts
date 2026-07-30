import { describe, it, expect } from 'vitest'
import {
  buildScoreTrend, chooseGranularity, MIN_POINTS_FOR_TREND,
  type ExamSessionSummary,
} from './scoreTrend'

let n = 0
/** `at` is a local date/time string, e.g. '2026-05-02T10:00'. */
const paper = (at: string, over: Partial<ExamSessionSummary> = {}): ExamSessionSummary => ({
  id: `s${n++}`,
  created_at: new Date(at).toISOString(),
  tier: 'foundation',
  calculator: 'non_calc',
  marks_earned: 12,
  marks_total: 25,
  ...over,
})

describe('buildScoreTrend — thresholds', () => {
  it('needs at least two plotted points', () => {
    expect(buildScoreTrend([])).toBeNull()
    expect(buildScoreTrend([paper('2026-05-02T10:00')])).toBeNull()
    expect(buildScoreTrend([paper('2026-05-02T10:00'), paper('2026-05-09T10:00')])).not.toBeNull()
    expect(MIN_POINTS_FOR_TREND).toBe(2)
  })

  it('two papers on the SAME DAY are one moment, not a trend', () => {
    // They average into a single bucket — a line through one point has no
    // direction, so there is nothing honest to draw.
    const t = buildScoreTrend([
      paper('2026-05-02T09:00', { marks_earned: 10, marks_total: 25 }),
      paper('2026-05-02T18:00', { marks_earned: 20, marks_total: 25 }),
    ])
    expect(t).toBeNull()
  })
})

describe('buildScoreTrend — time axis', () => {
  it('orders oldest first regardless of the order rows arrive in', () => {
    // The history list fetches newest-first, so this is the realistic input.
    const t = buildScoreTrend([
      paper('2026-07-01T10:00', { marks_earned: 20, marks_total: 25 }),
      paper('2026-05-01T10:00', { marks_earned: 5, marks_total: 25 }),
    ])!
    expect(t.buckets.map(b => b.pct)).toEqual([20, 80])
  })

  it('keeps a gap in usage visible by dating the points, not spacing them evenly', () => {
    const t = buildScoreTrend([
      paper('2026-05-01T10:00', { marks_earned: 10, marks_total: 25 }),
      paper('2026-05-02T10:00', { marks_earned: 12, marks_total: 25 }),
      paper('2026-11-01T10:00', { marks_earned: 20, marks_total: 25 }), // 6 months later
    ])!
    const ms = t.buckets.map(b => new Date(b.date).getTime())
    const firstGap = ms[1] - ms[0]
    const secondGap = ms[2] - ms[1]
    // The chart positions by date, so the long break really is far wider.
    expect(secondGap).toBeGreaterThan(firstGap * 50)
  })
})

describe('buildScoreTrend — bucketing', () => {
  it('uses day buckets when papers are spread out', () => {
    const t = buildScoreTrend([
      paper('2026-05-01T10:00'), paper('2026-06-01T10:00'), paper('2026-07-01T10:00'),
    ])!
    expect(t.granularity).toBe('day')
    expect(t.buckets).toHaveLength(3)
    expect(t.averaged).toBe(false)
  })

  it('coarsens to keep the chart readable when papers are dense', () => {
    // 40 papers on consecutive days would be 40 day-buckets; too many to read.
    const many = Array.from({ length: 40 }, (_, i) =>
      paper(`2026-05-${String((i % 28) + 1).padStart(2, '0')}T10:00`))
    const t = buildScoreTrend(many)!
    expect(t.granularity).not.toBe('day')
    expect(t.buckets.length).toBeLessThanOrEqual(12)
    expect(t.papers).toBe(40)
  })

  it('averages the papers inside a bucket', () => {
    // Same week, different days → one weekly bucket once day-buckets overflow.
    const t = buildScoreTrend([
      paper('2026-05-04T10:00', { marks_earned: 10, marks_total: 25 }), // 40%
      paper('2026-05-06T10:00', { marks_earned: 20, marks_total: 25 }), // 80%
      paper('2026-08-04T10:00', { marks_earned: 15, marks_total: 25 }), // 60%
    ], 2)!
    // With only 3 papers this stays day-granular, so no averaging yet…
    expect(t.buckets).toHaveLength(3)

    // …force weekly by making the day count exceed the cap.
    const dense = [
      ...Array.from({ length: 14 }, (_, i) => paper(`2026-05-${String(i + 1).padStart(2, '0')}T10:00`, { marks_earned: 10, marks_total: 25 })),
      ...Array.from({ length: 14 }, (_, i) => paper(`2026-06-${String(i + 1).padStart(2, '0')}T10:00`, { marks_earned: 20, marks_total: 25 })),
    ]
    const t2 = buildScoreTrend(dense)!
    expect(t2.averaged).toBe(true)
    expect(t2.buckets.some(b => b.count > 1)).toBe(true)
    expect(t2.papers).toBe(28)
  })

  it('places a bucket at the MEAN time of its papers, not a bucket edge', () => {
    const dense = Array.from({ length: 30 }, (_, i) =>
      paper(`2026-05-${String((i % 30) + 1).padStart(2, '0')}T10:00`))
    const t = buildScoreTrend(dense)!
    for (const b of t.buckets) {
      const time = new Date(b.date).getTime()
      expect(Number.isFinite(time)).toBe(true)
    }
  })
})

describe('chooseGranularity', () => {
  it('prefers the finest bucket that stays readable', () => {
    expect(chooseGranularity(['2026-05-01T10:00', '2026-06-01T10:00'].map(d => new Date(d).toISOString()))).toBe('day')
    const manyDays = Array.from({ length: 30 }, (_, i) => new Date(`2026-05-${String(i % 28 + 1).padStart(2, '0')}T10:00`).toISOString())
    expect(chooseGranularity(manyDays)).not.toBe('day')
  })
})

describe('buildScoreTrend — summary', () => {
  it('summarises papers, while change follows the drawn line', () => {
    const t = buildScoreTrend([
      paper('2026-05-01T10:00', { marks_earned: 10, marks_total: 25 }), // 40
      paper('2026-06-01T10:00', { marks_earned: 25, marks_total: 25 }), // 100
      paper('2026-07-01T10:00', { marks_earned: 15, marks_total: 25 }), // 60
    ])!
    expect(t.latest).toBe(60)
    expect(t.best).toBe(100)   // best PAPER, not best bucket
    expect(t.average).toBe(67) // (40+100+60)/3
    expect(t.change).toBe(20)  // last bucket − first bucket
    expect(t.papers).toBe(3)
  })

  it('reports a fall as a negative change', () => {
    const t = buildScoreTrend([
      paper('2026-05-01T10:00', { marks_earned: 20, marks_total: 25 }),
      paper('2026-06-01T10:00', { marks_earned: 10, marks_total: 25 }),
    ])!
    expect(t.change).toBe(-40)
  })

  it('flags mixed tiers, and marks the bucket containing the Higher paper', () => {
    const same = buildScoreTrend([paper('2026-05-01T10:00'), paper('2026-06-01T10:00')])!
    expect(same.mixedTiers).toBe(false)
    expect(same.buckets.every(b => !b.hasHigher)).toBe(true)

    const mixed = buildScoreTrend([
      paper('2026-05-01T10:00', { tier: 'foundation' }),
      paper('2026-06-01T10:00', { tier: 'higher' }),
    ])!
    expect(mixed.mixedTiers).toBe(true)
    expect(mixed.buckets.map(b => b.hasHigher)).toEqual([false, true])
  })

  it('handles fractional marks from grid questions', () => {
    const t = buildScoreTrend([
      paper('2026-05-01T10:00', { marks_earned: 12.5, marks_total: 25 }),
      paper('2026-06-01T10:00', { marks_earned: 18.5, marks_total: 25 }),
    ])!
    expect(t.buckets.map(b => b.pct)).toEqual([50, 74])
  })

  it('skips rows that cannot be plotted rather than poisoning the chart', () => {
    const t = buildScoreTrend([
      paper('2026-05-01T10:00', { marks_earned: 10, marks_total: 25 }),
      paper('2026-05-15T10:00', { marks_earned: 5, marks_total: 0 }),      // ÷0
      { ...paper('2026-06-01T10:00'), created_at: 'not-a-date' },          // unplottable
      paper('2026-07-01T10:00', { marks_earned: 20, marks_total: 25 }),
    ])!
    expect(t.papers).toBe(2)
    expect(t.buckets.map(b => b.pct)).toEqual([40, 80])
  })
})
