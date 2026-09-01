import { describe, it, expect } from 'vitest'
import {
  isCheckpoint, questionsToCheckpoint, closestToMastery, SESSION_LENGTH,
  type SessionSkill,
} from './session'

const skill = (o: Partial<SessionSkill> = {}): SessionSkill => ({
  masteredThisSession: false,
  beforeCorrect: 0, beforeTotal: 0,
  correctInWindow: 0, totalInWindow: 5,
  ...o,
})

describe('isCheckpoint', () => {
  it('fires on the tenth answer', () => {
    expect(isCheckpoint(10)).toBe(true)
    expect(SESSION_LENGTH).toBe(10)
  })

  it('does not fire before it, or one past it', () => {
    for (const n of [1, 5, 9, 11, 19]) expect(isCheckpoint(n)).toBe(false)
  })

  it('recurs, so a long sitting gets another checkpoint rather than one ending', () => {
    for (const n of [20, 30, 100]) expect(isCheckpoint(n)).toBe(true)
  })

  it('never fires at zero — an untouched session has nothing to summarise', () => {
    expect(isCheckpoint(0)).toBe(false)
  })

  it('falls back to the default on a nonsense length, never to every answer', () => {
    for (const bad of [0, -1]) {
      expect(isCheckpoint(3, bad)).toBe(false)
      expect(isCheckpoint(10, bad)).toBe(true) // falls back to the default, not 1
    }
  })
})

describe('questionsToCheckpoint', () => {
  it('counts down through a session', () => {
    expect(questionsToCheckpoint(0)).toBe(10)
    expect(questionsToCheckpoint(3)).toBe(7)
    expect(questionsToCheckpoint(9)).toBe(1)
  })

  it('is 0 exactly on a checkpoint, and resets past it', () => {
    expect(questionsToCheckpoint(10)).toBe(0)
    expect(questionsToCheckpoint(11)).toBe(9)
    expect(questionsToCheckpoint(20)).toBe(0)
  })

  it('agrees with isCheckpoint at every point in three sessions', () => {
    for (let n = 0; n <= 30; n++) {
      expect(questionsToCheckpoint(n) === 0).toBe(isCheckpoint(n))
    }
  })
})

describe('closestToMastery', () => {
  it('picks the skill needing fewest more answers', () => {
    const out = closestToMastery({
      far:   skill({ correctInWindow: 1 }), // 3 more
      close: skill({ correctInWindow: 3 }), // 1 more
    })
    expect(out).toEqual({ skillId: 'close', remaining: 1 })
  })

  it('ignores skills mastered this session — those are the celebration', () => {
    const out = closestToMastery({
      done:  skill({ masteredThisSession: true, correctInWindow: 4 }),
      other: skill({ correctInWindow: 2 }),
    })
    expect(out).toEqual({ skillId: 'other', remaining: 2 })
  })

  it('ignores skills without a full window — the fast-track governs there', () => {
    // 2 of 3 correct is NOT "2 more to master": under five attempts the rule is
    // the first-three fast-track, so a countdown would be a different number.
    expect(closestToMastery({ young: skill({ correctInWindow: 2, totalInWindow: 3 }) })).toBeNull()
  })

  it('returns null when there is nothing honest to promise', () => {
    expect(closestToMastery({})).toBeNull()
    expect(closestToMastery({ a: skill({ masteredThisSession: true }) })).toBeNull()
    // Already at 4/5 — mastered by the window rule, so nothing remains.
    expect(closestToMastery({ a: skill({ correctInWindow: 4 }) })).toBeNull()
  })

  it('is deterministic when two skills tie', () => {
    const skills = { zebra: skill({ correctInWindow: 3 }), alpha: skill({ correctInWindow: 3 }) }
    expect(closestToMastery(skills)).toEqual({ skillId: 'alpha', remaining: 1 })
    // Same answer whichever order the object was built in.
    expect(closestToMastery({ alpha: skills.alpha, zebra: skills.zebra }))
      .toEqual({ skillId: 'alpha', remaining: 1 })
  })
})
