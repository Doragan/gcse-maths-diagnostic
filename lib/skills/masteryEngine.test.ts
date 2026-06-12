import { describe, it, expect } from 'vitest'
import {
  calculateMastery, inferPrerequisiteMastery, getAccessibleSkillIds,
  getNeedsPracticeSkillIds, getWeightedSkillPool, applyPrerequisiteCredit,
} from './masteryEngine'

// Helper to build attempts with increasing timestamps (oldest first).
let t = 0
const at = (skill_ids: string[], correct: boolean, kind?: 'mastery' | 'exam') => ({
  skill_ids, correct, kind, attempted_at: new Date(2026, 0, 1, 0, 0, t++).toISOString(),
})

describe('calculateMastery — window thresholds', () => {
  it('5 attempts with 4+ correct → mastered', () => {
    const m = calculateMastery([
      at(['s'], true), at(['s'], true), at(['s'], true), at(['s'], false), at(['s'], true),
    ])
    expect(m.s.status).toBe('mastered')
    expect(m.s.recentCorrect).toBe(4)
  })
  it('5 attempts with <4 correct → needs_practice', () => {
    const m = calculateMastery([
      at(['s'], true), at(['s'], false), at(['s'], true), at(['s'], false), at(['s'], true),
    ])
    expect(m.s.status).toBe('needs_practice')
  })
  it('fewer than 5 attempts → in_progress', () => {
    const m = calculateMastery([at(['s'], true), at(['s'], true)])
    expect(m.s.status).toBe('in_progress')
  })
  it('considers only the most recent 5 (old failures drop out of the window)', () => {
    // 3 old wrong, then 5 correct → window is the 5 correct → mastered
    const m = calculateMastery([
      at(['s'], false), at(['s'], false), at(['s'], false),
      at(['s'], true), at(['s'], true), at(['s'], true), at(['s'], true), at(['s'], true),
    ])
    expect(m.s.status).toBe('mastered')
    expect(m.s.recentAttempts).toBe(5)
  })
  it('credits every skill on a multi-skill attempt', () => {
    const m = calculateMastery([at(['a', 'b'], true)])
    expect(m.a.recentCorrect).toBe(1)
    expect(m.b.recentCorrect).toBe(1)
  })
})

describe('calculateMastery — exam-kind positive-only attribution', () => {
  it('a wrong exam answer never enters the window', () => {
    const m = calculateMastery([at(['s'], false, 'exam')])
    expect(m.s).toBeUndefined() // no window entry at all
  })
  it('a correct exam answer credits normally', () => {
    const m = calculateMastery([at(['s'], true, 'exam')])
    expect(m.s.recentCorrect).toBe(1)
  })
  it('exam failures cannot drag a skill down', () => {
    // 5 correct mastery + 3 wrong exam → still mastered (exam wrongs excluded)
    const m = calculateMastery([
      at(['s'], true), at(['s'], true), at(['s'], true), at(['s'], true), at(['s'], true),
      at(['s'], false, 'exam'), at(['s'], false, 'exam'), at(['s'], false, 'exam'),
    ])
    expect(m.s.status).toBe('mastered')
  })
})

describe('inferPrerequisiteMastery', () => {
  const prereqs: Record<string, string[]> = { hard: ['mid', 'easy'], mid: ['easy'], easy: [] }
  const tree = (id: string) => prereqs[id] ?? []

  it('a correct answer credits all transitive prerequisites as inferred-mastered', () => {
    const base = calculateMastery([at(['hard'], true)])
    const out = inferPrerequisiteMastery(base, tree)
    expect(out.mid.status).toBe('mastered')
    expect(out.mid.inferred).toBe(true)
    expect(out.easy.status).toBe('mastered')
  })
  it('no inference without at least one correct answer', () => {
    const base = calculateMastery([at(['hard'], false)])
    const out = inferPrerequisiteMastery(base, tree)
    expect(out.mid).toBeUndefined()
  })
  it('does not overwrite a prerequisite already mastered from real data', () => {
    const base = calculateMastery([
      at(['mid'], true), at(['mid'], true), at(['mid'], true), at(['mid'], true), at(['mid'], true),
      at(['hard'], true),
    ])
    const out = inferPrerequisiteMastery(base, tree)
    expect(out.mid.inferred).toBeUndefined() // stayed real-mastered, not flagged inferred
  })
})

describe('applyPrerequisiteCredit (practice-context, L2)', () => {
  const prereqs: Record<string, string[]> = { hard: ['mid', 'easy'], mid: ['easy'], easy: [] }
  const tree = (id: string) => prereqs[id] ?? []
  const mastery = (attempts: any[]) => calculateMastery(applyPrerequisiteCredit(attempts, tree))

  it('does nothing when there are no correct answers', () => {
    const attempts = [at(['hard'], false)]
    expect(applyPrerequisiteCredit(attempts, tree)).toBe(attempts) // same array
  })

  it('credits an UNTESTED prerequisite to in_progress only (3 of 5), never mastered', () => {
    const m = mastery([at(['hard'], true)])
    expect(m.mid.status).toBe('in_progress')
    expect(m.mid.recentCorrect).toBe(3)
    expect(m.easy.status).toBe('in_progress')
  })

  it('blends with a struggling prerequisite rather than overriding it', () => {
    // easy has a real history of 1/5 (needs_practice). A correct `hard` adds 3
    // synthetic correct as the most-recent slots → window 4/5 → mastered.
    const m = mastery([
      at(['easy'], false), at(['easy'], false), at(['easy'], false), at(['easy'], false), at(['easy'], true),
      at(['hard'], true),
    ])
    expect(m.easy.status).toBe('mastered')
  })

  it('does NOT rescue a prerequisite the student keeps getting wrong recently', () => {
    // easy: 5 recent wrong (after the hard credit, window = 3 synth-correct + 2
    // most-recent real wrong = 3/5 → not mastered). Direct struggle is respected.
    const m = mastery([
      at(['easy'], false), at(['easy'], false), at(['easy'], false), at(['easy'], false), at(['easy'], false),
      at(['hard'], true),
    ])
    expect(m.easy.status).not.toBe('mastered')
  })
})

describe('getAccessibleSkillIds', () => {
  const tree: Record<string, string[]> = { top: ['base'], base: [], lone: [] }
  it('a skill with no prerequisites is always accessible', () => {
    expect(getAccessibleSkillIds({}, ['lone'], id => tree[id] ?? [])).toEqual(['lone'])
  })
  it('excludes a skill whose prerequisite is needs_practice or untested', () => {
    const needs = { base: { skillId: 'base', status: 'needs_practice' as const, recentAttempts: 5, recentCorrect: 1 } }
    expect(getAccessibleSkillIds(needs, ['top'], id => tree[id] ?? [])).toEqual([])
    expect(getAccessibleSkillIds({}, ['top'], id => tree[id] ?? [])).toEqual([]) // untested prereq
  })
  it('includes a skill whose prerequisite is mastered or in_progress', () => {
    const ok = { base: { skillId: 'base', status: 'in_progress' as const, recentAttempts: 2, recentCorrect: 2 } }
    expect(getAccessibleSkillIds(ok, ['top'], id => tree[id] ?? [])).toEqual(['top'])
  })
})

describe('getNeedsPracticeSkillIds + getWeightedSkillPool', () => {
  const mastery = {
    weak:  { skillId: 'weak',  status: 'needs_practice' as const, recentAttempts: 5, recentCorrect: 1 },
    fresh: { skillId: 'fresh', status: 'in_progress' as const,    recentAttempts: 1, recentCorrect: 1 },
    done:  { skillId: 'done',  status: 'mastered' as const,       recentAttempts: 5, recentCorrect: 5 },
  }
  it('needs-practice filter returns only weak skills', () => {
    expect(getNeedsPracticeSkillIds(mastery, ['weak', 'fresh', 'done'])).toEqual(['weak'])
  })
  it('weights needs_practice 3×, in_progress/untested 1×, mastered 0×', () => {
    const pool = getWeightedSkillPool(mastery, ['weak', 'fresh', 'done', 'new'])
    expect(pool.filter(s => s === 'weak')).toHaveLength(3)
    expect(pool.filter(s => s === 'fresh')).toHaveLength(1)
    expect(pool.filter(s => s === 'new')).toHaveLength(1)   // untested → weight 1
    expect(pool).not.toContain('done')
  })
  it('falls back to the full pool when everything is mastered', () => {
    const allDone = { a: { skillId: 'a', status: 'mastered' as const, recentAttempts: 5, recentCorrect: 5 } }
    expect(getWeightedSkillPool(allDone, ['a'])).toEqual(['a'])
  })
})
