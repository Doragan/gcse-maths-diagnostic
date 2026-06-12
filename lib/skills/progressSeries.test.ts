import { describe, it, expect } from 'vitest'
import { buildProgressSeries } from './progressSeries'

// The series spans from the first attempt to NOW (the chart runs up to today),
// so test dates must be relative to now, not absolute.
const noTree = () => [] as string[]
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const attempt = (n: number, skill: string, correct: boolean) => ({
  skill_ids: [skill], correct, attempted_at: daysAgo(n),
})

describe('buildProgressSeries', () => {
  it('returns null with no attempts', () => {
    expect(buildProgressSeries([], noTree)).toBeNull()
  })
  it('returns null when all activity is on a single day', () => {
    expect(buildProgressSeries(
      [attempt(0, 's', true), attempt(0, 's', true)], noTree,
    )).toBeNull()
  })
  it('uses day buckets for a short span (≤ ~12 days)', () => {
    const series = buildProgressSeries([attempt(3, 's', true), attempt(0, 't', true)], noTree)
    expect(series).not.toBeNull()
    expect(series!.unit).toBe('day')
    expect(series!.points.length).toBeGreaterThan(0)
  })
  it('switches to week buckets for a multi-week span', () => {
    const series = buildProgressSeries([attempt(30, 's', true), attempt(0, 't', true)], noTree)!
    expect(series.unit).toBe('week')
  })
  it('reports cumulative accuracy that ends at the overall rate', () => {
    const series = buildProgressSeries(
      [attempt(3, 's', true), attempt(2, 's', false), attempt(1, 's', true)], noTree,
    )!
    const last = series.points[series.points.length - 1]
    expect(last.accuracy).toBe(67) // 2 of 3 correct, rounded
  })
})
