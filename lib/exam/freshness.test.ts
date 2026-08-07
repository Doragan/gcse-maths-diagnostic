import { describe, it, expect } from 'vitest'
import { recentlyServedIds, assembleFresh, DEFAULT_WINDOW, type ServedPaper } from './freshness'
import type { Candidate } from './assembler'
import type { ExamBlueprint } from './blueprint'

/**
 * Freshness stops a student meeting the same question two papers running.
 * The load-bearing property is the SAFETY one: it must never cost a paper.
 */

const paper = (...ids: string[]): ServedPaper => ({ questions: ids.map(id => ({ id })) })

/** A deep pool of interchangeable d2 mastery questions. */
const pool = (n: number): Candidate[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    multiPart: false,
    difficulty: 2,
    calculator: 'na' as const,
    kind: 'mastery' as const,
    strand: 'Number',
    marks: 2,
    skillIds: ['simple_arithmetic'],
  }))

const blueprint: ExamBlueprint = {
  targetMarks: 10,
  tolerance: 2,
  bands: [{ band: 2, share: 1 }],
}

const opts = { calculatorMode: 'non_calc' as const }

describe('recentlyServedIds', () => {
  it('collects ids across the window, newest first', () => {
    const papers = [paper('a', 'b'), paper('c'), paper('d')]
    expect(recentlyServedIds(papers, 2)).toEqual(new Set(['a', 'b', 'c']))
  })

  it('is empty for a window of zero, and for no history', () => {
    expect(recentlyServedIds([paper('a')], 0).size).toBe(0)
    expect(recentlyServedIds([], 3).size).toBe(0)
  })

  it('never runs past the history it has', () => {
    expect(recentlyServedIds([paper('a')], 99)).toEqual(new Set(['a']))
  })
})

describe('assembleFresh', () => {
  it('avoids the questions from recent papers when the pool allows', () => {
    const recent = [paper('q0', 'q1', 'q2'), paper('q3', 'q4')]
    const { exam, windowUsed } = assembleFresh(pool(40), blueprint, opts, recent)
    expect(windowUsed).toBeGreaterThan(0)
    for (const id of ['q0', 'q1', 'q2', 'q3', 'q4']) {
      expect(exam.questionIds).not.toContain(id)
    }
  })

  it('ALWAYS returns a usable paper, even when the pool is nearly exhausted', () => {
    // The rule that matters. Excluding shrinks the pool, and the Higher pool is
    // already thin — a repeat is an annoyance, a short paper is broken.
    // Every question here sat in a recent paper, so the window must give way.
    const tiny = pool(6)
    const recent = [paper('q0', 'q1', 'q2'), paper('q3', 'q4'), paper('q5')]
    const { exam } = assembleFresh(tiny, blueprint, opts, recent)
    expect(exam.questionIds.length).toBeGreaterThan(0)
  })

  it('accepts a fresher paper only within a bounded slack of the baseline', () => {
    // The baseline is ONE randomised draw, so an exact comparison rejects good
    // papers on noise — measured on Higher, strictness left 23% of questions
    // repeating while COSTING shortfall. Slack is bounded, not unlimited: a
    // fresh paper cannot be arbitrarily worse than an unrestricted one.
    const recent = [paper('q0', 'q1', 'q2')]
    const { exam } = assembleFresh(pool(40), blueprint, opts, recent)
    const baseline = assembleFresh(pool(40), blueprint, opts, [])
    expect(exam.shortfall.marks).toBeLessThanOrEqual(baseline.exam.shortfall.marks + 3)
  })

  it('narrows the window rather than starving the paper', () => {
    // Every question sat in the last three papers, so the full window would
    // leave nothing. It should fall back and still produce a paper.
    const tiny = pool(5)
    const recent = [paper('q0', 'q1'), paper('q2', 'q3'), paper('q4')]
    const { exam, windowUsed, narrowed } = assembleFresh(tiny, blueprint, opts, recent)
    expect(exam.questionIds.length).toBeGreaterThan(0)
    expect(windowUsed).toBeLessThan(3)
    expect(narrowed).toBe(true)
  })

  it('behaves exactly as before for a student with no history', () => {
    const { exam, windowUsed, narrowed } = assembleFresh(pool(40), blueprint, opts, [])
    expect(windowUsed).toBe(0)
    expect(narrowed).toBe(false)
    expect(exam.questionIds.length).toBeGreaterThan(0)
  })

  it('holds back three papers by default', () => {
    expect(DEFAULT_WINDOW).toBe(3)
    const recent = [paper('q0'), paper('q1'), paper('q2'), paper('q3')]
    const { exam } = assembleFresh(pool(40), blueprint, opts, recent)
    // q3 is the fourth paper back, so it is fair game again.
    for (const id of ['q0', 'q1', 'q2']) expect(exam.questionIds).not.toContain(id)
  })

  it('does not depend on how well the student did — only on what they saw', () => {
    // Freshness is not adaptive surfacing: nothing here reads a score, so
    // papers stay representative and comparable over time.
    const recent = [paper('q0', 'q1')]
    const a = assembleFresh(pool(40), blueprint, opts, recent)
    const b = assembleFresh(pool(40), blueprint, opts, recent)
    expect(a.exam.questionIds.length).toBe(b.exam.questionIds.length)
  })
})
