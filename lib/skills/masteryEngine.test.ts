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

describe('calculateMastery — fast-track (first three, before a full window)', () => {
  it('first three all correct → mastered early, at 3 attempts', () => {
    const m = calculateMastery([at(['s'], true), at(['s'], true), at(['s'], true)])
    expect(m.s.status).toBe('mastered')
  })
  it('stays mastered through a single later slip (4th wrong, still under 5)', () => {
    const m = calculateMastery([at(['s'], true), at(['s'], true), at(['s'], true), at(['s'], false)])
    expect(m.s.status).toBe('mastered')
  })
  it('a SECOND slip demotes it once the rolling window kicks in (5th attempt, 3/5)', () => {
    const m = calculateMastery([
      at(['s'], true), at(['s'], true), at(['s'], true), at(['s'], false), at(['s'], false),
    ])
    expect(m.s.status).toBe('needs_practice')
  })
  it('one slip among the first five keeps it mastered (4/5)', () => {
    const m = calculateMastery([
      at(['s'], true), at(['s'], true), at(['s'], true), at(['s'], false), at(['s'], true),
    ])
    expect(m.s.status).toBe('mastered')
  })
  it('a miss WITHIN the first three blocks the fast-track — it is one-shot', () => {
    // first attempt wrong
    expect(calculateMastery([at(['s'], false), at(['s'], true), at(['s'], true)]).s.status).toBe('in_progress')
    // or the middle of the first three
    expect(calculateMastery([at(['s'], true), at(['s'], false), at(['s'], true)]).s.status).toBe('in_progress')
  })
  it('two correct is not yet enough — the fast-track needs three', () => {
    expect(calculateMastery([at(['s'], true), at(['s'], true)]).s.status).toBe('in_progress')
  })
  it('a skill that missed the fast-track can still master later via the rolling window', () => {
    // C W C C C → first three (C W C) blocked the fast-track, but recent 4/5 masters
    const m = calculateMastery([
      at(['s'], true), at(['s'], false), at(['s'], true), at(['s'], true), at(['s'], true),
    ])
    expect(m.s.status).toBe('mastered')
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

  it('an UNTESTED prerequisite gets only 2 credits → in_progress, never mastered from inference alone', () => {
    // 2 credits is below both the fast-track's first-three and the window's 5.
    const m = mastery([at(['hard'], true)])
    expect(m.mid.status).toBe('in_progress')
    expect(m.mid.recentCorrect).toBe(2)
    expect(m.easy.status).toBe('in_progress')
  })

  it('one real correct + a downstream correct → mastered via the fast-track', () => {
    // easy answered once directly, then hard (which has easy as a prerequisite)
    // correct → easy has [real C, syn C, syn C] = first three all correct.
    const m = mastery([at(['easy'], true), at(['hard'], true)])
    expect(m.easy.status).toBe('mastered')
    // but a still-untested prerequisite of hard stays in_progress (2 credits)
    expect(m.mid.status).toBe('in_progress')
  })

  it('does NOT rescue a prerequisite with a real struggling history', () => {
    // easy has 5 real attempts, mostly wrong → the rolling window governs, and 2
    // synthetic credits cannot lift it to 4/5. Direct struggle is respected.
    const m = mastery([
      at(['easy'], false), at(['easy'], false), at(['easy'], false), at(['easy'], true), at(['easy'], false),
      at(['hard'], true),
    ])
    expect(m.easy.status).toBe('needs_practice')
  })

  it('ripples through the WHOLE transitive tree, deduped to one batch each', () => {
    // hard → mid → easy and hard → easy. One correct hard credits both mid and
    // easy exactly once (2 each), at every depth.
    const m = mastery([at(['hard'], true)])
    expect(m.mid.recentCorrect).toBe(2)
    expect(m.easy.recentCorrect).toBe(2) // not 4, despite two paths reaching it
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
  it('weights needs_practice 3×, in_progress/untested 1×, and gives mastered a spaced-review slot', () => {
    const pool = getWeightedSkillPool(mastery, ['weak', 'fresh', 'done', 'new'])
    expect(pool.filter(s => s === 'weak')).toHaveLength(3)
    expect(pool.filter(s => s === 'fresh')).toHaveLength(1)
    expect(pool.filter(s => s === 'new')).toHaveLength(1)   // untested → weight 1
    expect(pool.filter(s => s === 'done')).toHaveLength(1)  // mastered → spaced review, not excluded
  })
  it('keeps mastered skills a small minority of the pool (~10%, not the focus)', () => {
    const many: Record<string, import('./masteryEngine').SkillMastery> = {}
    const ids: string[] = []
    for (let i = 0; i < 18; i++) {
      const id = `ip${i}`; ids.push(id)
      many[id] = { skillId: id, status: 'in_progress', recentAttempts: 1, recentCorrect: 1 }
    }
    ids.push('m'); many.m = { skillId: 'm', status: 'mastered', recentAttempts: 5, recentCorrect: 5 }
    const pool = getWeightedSkillPool(many, ids)
    const share = pool.filter(s => s === 'm').length / pool.length
    expect(share).toBeGreaterThan(0)
    expect(share).toBeLessThan(0.2)
  })
  it('falls back to the full pool when everything is mastered', () => {
    const allDone = { a: { skillId: 'a', status: 'mastered' as const, recentAttempts: 5, recentCorrect: 5 } }
    expect(getWeightedSkillPool(allDone, ['a'])).toEqual(['a'])
  })
})
