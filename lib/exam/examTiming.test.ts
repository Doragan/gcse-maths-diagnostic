import { describe, it, expect } from 'vitest'
import {
  allowanceSeconds, remainingSeconds, elapsedSeconds,
  urgencyOf, formatClock, formatDuration,
  EXAM_SECONDS_PER_MARK, WARN_SECONDS, URGENT_SECONDS,
} from './examTiming'

describe('allowanceSeconds', () => {
  it('matches the real paper rate — 80 marks in 90 minutes', () => {
    expect(allowanceSeconds(80)).toBe(90 * 60)
    expect(EXAM_SECONDS_PER_MARK).toBeCloseTo(67.5)
  })

  it('gives a ~25-mark mini-exam about half an hour', () => {
    const mins = allowanceSeconds(25) / 60
    expect(mins).toBeGreaterThan(26)
    expect(mins).toBeLessThan(30)
  })

  it('scales with the paper, so a shorter paper gets less time', () => {
    // The marks-first assembler lets the total move a mark or two, and a fixed
    // allowance would quietly make the short papers the generous ones.
    expect(allowanceSeconds(23)).toBeLessThan(allowanceSeconds(27))
  })

  it('lands on a whole or half minute, so the clock reads like an allowance', () => {
    for (const m of [17, 21, 23, 25, 26, 31]) {
      expect(allowanceSeconds(m) % 30).toBe(0)
    }
  })

  it('is zero for a paper with no marks rather than NaN', () => {
    expect(allowanceSeconds(0)).toBe(0)
    expect(allowanceSeconds(Number.NaN)).toBe(0)
  })
})

describe('remainingSeconds', () => {
  const start = 1_000_000

  it('counts down against the wall clock', () => {
    expect(remainingSeconds(start, 600, start)).toBe(600)
    expect(remainingSeconds(start, 600, start + 60_000)).toBe(540)
  })

  it('ignores a backgrounded tab — elapsed time is real time', () => {
    // A decrementing counter would be throttled to ~once a minute in a hidden
    // tab and hand back the difference. Reading the clock cannot.
    expect(remainingSeconds(start, 600, start + 300_000)).toBe(300)
  })

  it('floors at zero rather than going negative', () => {
    expect(remainingSeconds(start, 600, start + 900_000)).toBe(0)
  })
})

describe('elapsedSeconds', () => {
  it('reports how long the paper actually took', () => {
    expect(elapsedSeconds(1000, 1000 + 125_000)).toBe(125)
  })

  it('never goes negative if the clock is nudged backwards', () => {
    expect(elapsedSeconds(5000, 1000)).toBe(0)
  })
})

describe('urgencyOf', () => {
  it('escalates as the time runs out', () => {
    expect(urgencyOf(20 * 60)).toBe('normal')
    expect(urgencyOf(WARN_SECONDS)).toBe('warn')
    expect(urgencyOf(WARN_SECONDS - 1)).toBe('warn')
    expect(urgencyOf(URGENT_SECONDS)).toBe('urgent')
    expect(urgencyOf(0)).toBe('urgent')
  })
})

describe('formatting', () => {
  it('reads as an exam clock', () => {
    expect(formatClock(28 * 60)).toBe('28:00')
    expect(formatClock(247)).toBe('4:07')
    expect(formatClock(9)).toBe('0:09')
    expect(formatClock(-5)).toBe('0:00')
  })

  it('describes a finished paper in prose, not to the second', () => {
    expect(formatDuration(45)).toBe('45 seconds')
    expect(formatDuration(60)).toBe('1 minute')
    expect(formatDuration(21 * 60 + 40)).toBe('22 minutes')
  })
})
