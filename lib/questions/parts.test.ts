import { describe, it, expect } from 'vitest'
import {
  computeSkillUnion, defaultKindForSkills, totalMarks, emptyPart, normalizePart,
} from './parts'

describe('computeSkillUnion', () => {
  it('dedupes and preserves first-seen order', () => {
    expect(computeSkillUnion([
      { skill_ids: ['a', 'b'] },
      { skill_ids: ['b', 'c'] },
      { skill_ids: ['a'] },
    ])).toEqual(['a', 'b', 'c'])
  })
  it('returns [] for no parts / empty skills', () => {
    expect(computeSkillUnion([])).toEqual([])
    expect(computeSkillUnion([{ skill_ids: [] }])).toEqual([])
  })
})

describe('defaultKindForSkills', () => {
  it('one skill → mastery, several → exam, none → mastery', () => {
    expect(defaultKindForSkills(['a'])).toBe('mastery')
    expect(defaultKindForSkills(['a', 'b'])).toBe('exam')
    expect(defaultKindForSkills([])).toBe('mastery')
  })
})

describe('totalMarks', () => {
  it('sums part marks, treating falsy marks as 0', () => {
    expect(totalMarks([{ ...emptyPart(), marks: 2 }, { ...emptyPart(), marks: 3 }])).toBe(5)
    expect(totalMarks([{ ...emptyPart(), marks: 0 as any }])).toBe(0)
  })
})

describe('normalizePart', () => {
  it('keeps a numeric tolerance only for numeric answers, null otherwise', () => {
    expect(normalizePart({ ...emptyPart(), answer_type: 'numeric', tolerance: '0.5' }).tolerance).toBe(0.5)
    expect(normalizePart({ ...emptyPart(), answer_type: 'numeric', tolerance: '' }).tolerance).toBe(0)
    expect(normalizePart({ ...emptyPart(), answer_type: 'exact', tolerance: '0.5' }).tolerance).toBeNull()
  })
  it('drops wholly-empty trap rows', () => {
    const out = normalizePart({
      ...emptyPart(),
      traps: [
        { answer_template: '', response: 'x' },
        { answer_template: '{{a}}', response: 'real' },
      ],
    })
    expect(out.traps).toHaveLength(1)
    expect(out.traps[0].response).toBe('real')
  })
  it('defaults blank marks to 1 and empty explanation to null', () => {
    const out = normalizePart({ ...emptyPart(), marks: '', explanation: '   ' })
    expect(out.marks).toBe(1)
    expect(out.explanation).toBeNull()
  })
  it('defaults a missing requires_simplest to false (lenient)', () => {
    const out = normalizePart({ ...emptyPart(), requires_simplest: undefined as any })
    expect(out.requires_simplest).toBe(false)
  })
})
