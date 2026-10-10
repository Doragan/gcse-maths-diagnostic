import { describe, it, expect } from 'vitest'
import { ago } from './relativeTime'

const NOW = new Date('2026-06-15T12:00:00Z').getTime()

describe('ago', () => {
  it('reads as a dash when there is nothing to report', () => {
    expect(ago(null, NOW)).toBe('—')
  })

  it('stays coarse: today, yesterday, days, then weeks', () => {
    expect(ago('2026-06-15T09:00:00Z', NOW)).toBe('today')
    expect(ago('2026-06-14T09:00:00Z', NOW)).toBe('yesterday')
    expect(ago('2026-06-12T09:00:00Z', NOW)).toBe('3 days ago')
    expect(ago('2026-06-07T09:00:00Z', NOW)).toBe('last week')
    expect(ago('2026-05-20T09:00:00Z', NOW)).toBe('3 weeks ago')
  })

  it('treats a future timestamp as today rather than a negative age', () => {
    expect(ago('2026-06-16T09:00:00Z', NOW)).toBe('today')
  })
})
