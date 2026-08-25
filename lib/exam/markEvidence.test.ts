import { describe, it, expect } from 'vitest'
import {
  evidenceFor, evidenceForKind, resolveQuestionMarks,
  MIN_OBSERVATIONS, DIFFICULTY_SPREAD,
} from './markEvidence'
import { BY_SKILL_KIND, BY_KIND, OVERALL } from './markEvidence.data'

describe('generated evidence data', () => {
  it('carries the coded series', () => {
    // 30 papers (2023 + 2024 + June 2025), 1095 parts, 2400 marks.
    expect(OVERALL.n).toBe(1095)
    expect(OVERALL.mean).toBeCloseTo(2.19, 2)
    expect(OVERALL.min).toBe(1)
    expect(OVERALL.max).toBe(5)
  })

  it('reproduces the kind split that motivated this change', () => {
    // Synthesis parts really are worth ~2x a single-skill part.
    //
    // All thirty coded papers now use one definition of `kind`: the authoring
    // rule, where a part is `exam` only if ONE answer fuses 2+ INDEPENDENT
    // skills — independence checked against the prerequisite graph in
    // data/skills.ts. (The 2024 papers were originally coded structurally, as
    // any standalone multi-mark question, and were re-tagged to match.)
    //
    // The stricter rule leaves far fewer exam parts (135 of 1095) but separates
    // the two kinds more sharply, which is the whole point of conditioning on
    // it: 3.47 against 2.01 is a real difference in what a part is worth.
    expect(BY_KIND.mastery.mean).toBeCloseTo(2.01, 2)
    expect(BY_KIND.exam.mean).toBeCloseTo(3.47, 2)
    expect(BY_KIND.exam.mean).toBeGreaterThan(BY_KIND.mastery.mean * 1.5)
  })

  it('is keyed skill|kind', () => {
    expect(Object.keys(BY_SKILL_KIND).every(k => k.includes('|'))).toBe(true)
  })
})

describe('evidenceFor', () => {
  it('returns stats for a well-evidenced skill', () => {
    const s = evidenceFor(['simple_arithmetic'], 'mastery')
    expect(s).not.toBeNull()
    expect(s!.n).toBeGreaterThanOrEqual(MIN_OBSERVATIONS)
  })

  it('returns null for an unknown skill', () => {
    expect(evidenceFor(['not_a_real_skill'], 'mastery')).toBeNull()
  })

  it('returns null when the only evidence is too thin to trust', () => {
    // Find a skill+kind bucket below the threshold and confirm it is rejected.
    const thin = Object.entries(BY_SKILL_KIND).find(([, v]) => v.n < MIN_OBSERVATIONS)
    expect(thin).toBeDefined()
    const [key] = thin!
    const [skill, kind] = key.split('|')
    expect(evidenceFor([skill], kind as 'mastery' | 'exam')).toBeNull()
  })

  it('prefers the best-evidenced skill when a question has several', () => {
    const solo = evidenceFor(['simple_arithmetic'], 'mastery')!
    const pair = evidenceFor(['not_a_real_skill', 'simple_arithmetic'], 'mastery')!
    expect(pair.n).toBe(solo.n)
  })

  it('separates the two kinds', () => {
    expect(evidenceForKind('exam').mean).not.toBe(evidenceForKind('mastery').mean)
  })
})

describe('resolveQuestionMarks — fallback chain', () => {
  it('an explicit author-set value always wins', () => {
    const r = resolveQuestionMarks({ marks: 5, skill_ids: ['simple_arithmetic'], kind: 'mastery', difficulty: 1 })
    expect(r).toEqual({ marks: 5, source: 'explicit' })
  })

  it('ignores a nonsense explicit value and falls through', () => {
    for (const bad of [0, -2, NaN, null, undefined]) {
      const r = resolveQuestionMarks({ marks: bad as number, skill_ids: ['simple_arithmetic'], kind: 'mastery', difficulty: 2 })
      expect(r.source).not.toBe('explicit')
      expect(r.marks).toBeGreaterThanOrEqual(1)
    }
  })

  it('uses skill evidence when there is enough of it', () => {
    const r = resolveQuestionMarks({ skill_ids: ['simple_arithmetic'], kind: 'mastery', difficulty: 2 })
    expect(r.source).toBe('skill')
  })

  it('falls back to the kind average for an unknown skill', () => {
    const r = resolveQuestionMarks({ skill_ids: ['not_a_real_skill'], kind: 'exam', difficulty: 3 })
    expect(r.source).toBe('kind')
    // exam-kind centres near 3.47, so a mid-difficulty synthesis question is 3ish
    expect(r.marks).toBeGreaterThanOrEqual(2)
  })

  it('handles a question with no skills at all', () => {
    const r = resolveQuestionMarks({ skill_ids: null, kind: null, difficulty: null })
    expect(r.marks).toBeGreaterThanOrEqual(1)
  })

  it('THE POINT: synthesis questions are worth more than single-skill ones', () => {
    const mastery = resolveQuestionMarks({ skill_ids: ['not_a_real_skill'], kind: 'mastery', difficulty: 3 })
    const exam = resolveQuestionMarks({ skill_ids: ['not_a_real_skill'], kind: 'exam', difficulty: 3 })
    expect(exam.marks).toBeGreaterThan(mastery.marks)
  })
})

describe('resolveQuestionMarks — shape of the result', () => {
  const q = (difficulty: number) => resolveQuestionMarks({ skill_ids: ['not_a_real_skill'], kind: 'mastery', difficulty })

  it('is always a whole number of at least 1', () => {
    for (let d = 1; d <= 5; d++) {
      const { marks } = q(d)
      expect(Number.isInteger(marks)).toBe(true)
      expect(marks).toBeGreaterThanOrEqual(1)
    }
  })

  it('does not fall with difficulty (the blueprint ramp must survive)', () => {
    const seq = [1, 2, 3, 4].map(d => q(d).marks)
    for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeGreaterThanOrEqual(seq[i - 1])
    // and it must actually discriminate, or the ramp is flat in marks
    expect(seq[3]).toBeGreaterThan(seq[0])
    expect(DIFFICULTY_SPREAD).toBeGreaterThan(0)
  })

  it('never leaves the range real papers award for that skill', () => {
    const stats = evidenceFor(['function_machines'], 'mastery')
    if (!stats) return
    for (let d = 1; d <= 5; d++) {
      const { marks } = resolveQuestionMarks({ skill_ids: ['function_machines'], kind: 'mastery', difficulty: d })
      expect(marks).toBeGreaterThanOrEqual(Math.max(1, stats.min))
      expect(marks).toBeLessThanOrEqual(stats.max)
    }
  })
})
