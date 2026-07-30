import { describe, it, expect } from 'vitest'
import { buildScoreTrend, MIN_PAPERS_FOR_TREND, type ExamSessionSummary } from './scoreTrend'

let n = 0
const paper = (over: Partial<ExamSessionSummary> = {}): ExamSessionSummary => ({
  id: `s${n}`,
  // Ascending by default so insertion order is chronological order.
  created_at: new Date(2026, 0, 1 + n++).toISOString(),
  tier: 'foundation',
  calculator: 'non_calc',
  marks_earned: 12,
  marks_total: 25,
  ...over,
})

describe('buildScoreTrend', () => {
  it('needs at least two papers — one is not a trend', () => {
    expect(buildScoreTrend([])).toBeNull()
    expect(buildScoreTrend([paper()])).toBeNull()
    expect(buildScoreTrend([paper(), paper()])).not.toBeNull()
    expect(MIN_PAPERS_FOR_TREND).toBe(2)
  })

  it('scores each paper as a whole-number percentage', () => {
    const t = buildScoreTrend([
      paper({ marks_earned: 12, marks_total: 25 }), // 48%
      paper({ marks_earned: 20, marks_total: 25 }), // 80%
    ])!
    expect(t.points.map(p => p.pct)).toEqual([48, 80])
  })

  it('orders oldest first regardless of the order rows arrive in', () => {
    const older = paper({ id: 'older', created_at: '2026-01-01T00:00:00Z', marks_earned: 5, marks_total: 25 })
    const newer = paper({ id: 'newer', created_at: '2026-03-01T00:00:00Z', marks_earned: 20, marks_total: 25 })
    // The history list fetches newest-first, so this is the realistic input.
    const t = buildScoreTrend([newer, older])!
    expect(t.points.map(p => p.id)).toEqual(['older', 'newer'])
    expect(t.latest).toBe(80)
  })

  it('summarises latest, best, average and change', () => {
    const t = buildScoreTrend([
      paper({ marks_earned: 10, marks_total: 25 }), // 40
      paper({ marks_earned: 25, marks_total: 25 }), // 100
      paper({ marks_earned: 15, marks_total: 25 }), // 60
    ])!
    expect(t.latest).toBe(60)
    expect(t.best).toBe(100)
    expect(t.average).toBe(67)  // (40+100+60)/3 = 66.7
    expect(t.change).toBe(20)   // 60 − 40, not best − first
  })

  it('reports a fall as a negative change', () => {
    const t = buildScoreTrend([
      paper({ marks_earned: 20, marks_total: 25 }), // 80
      paper({ marks_earned: 10, marks_total: 25 }), // 40
    ])!
    expect(t.change).toBe(-40)
  })

  it('flags mixed tiers — a drop may just be a harder paper', () => {
    expect(buildScoreTrend([paper({ tier: 'foundation' }), paper({ tier: 'foundation' })])!.mixedTiers).toBe(false)
    expect(buildScoreTrend([paper({ tier: 'foundation' }), paper({ tier: 'higher' })])!.mixedTiers).toBe(true)
  })

  it('handles fractional marks from grid questions', () => {
    // Grid parts earn per-element credit, so marks_earned is numeric not int.
    const t = buildScoreTrend([
      paper({ marks_earned: 12.5, marks_total: 25 }),
      paper({ marks_earned: 18.5, marks_total: 25 }),
    ])!
    expect(t.points.map(p => p.pct)).toEqual([50, 74])
  })

  it('skips a row that could not yield a percentage rather than poisoning the chart', () => {
    const t = buildScoreTrend([
      paper({ marks_earned: 10, marks_total: 25 }),
      paper({ marks_earned: 5, marks_total: 0 }),        // would divide by zero
      paper({ marks_earned: 20, marks_total: 25 }),
    ])!
    expect(t.points).toHaveLength(2)
    expect(t.points.map(p => p.pct)).toEqual([40, 80])
  })

  it('drops below the threshold if bad rows leave too few', () => {
    expect(buildScoreTrend([
      paper({ marks_earned: 10, marks_total: 25 }),
      paper({ marks_earned: 5, marks_total: 0 }),
    ])).toBeNull()
  })
})
