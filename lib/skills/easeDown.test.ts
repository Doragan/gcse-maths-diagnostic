import { describe, it, expect } from 'vitest'
import {
  isEaseDown, losingStreakLength, correctBaseline, difficultyDelta,
  shouldOfferEaseDown, pickEaseDown,
  LOSING_STREAK, MAX_OFFERS_PER_SESSION,
  type EaseDownCandidate, type SessionAnswer,
} from './easeDown'

const q = (over: Partial<EaseDownCandidate> & { id: string }): EaseDownCandidate => ({
  difficulty: 2,
  skillIds: ['percentages'],
  partCount: 1,
  kind: 'mastery',
  ...over,
})

/** A session answer, defaulting to a correct difficulty-2 percentages question. */
const a = (over: Partial<SessionAnswer> = {}): SessionAnswer => ({
  questionId: `a${Math.random()}`,
  correct: true,
  difficulty: 2,
  skillId: 'percentages',
  ...over,
})

const wrong = (over: Partial<SessionAnswer> = {}) => a({ correct: false, ...over })

describe('isEaseDown', () => {
  it('accepts a single-part mastery question', () => {
    expect(isEaseDown(q({ id: 'x' }))).toBe(true)
  })

  it('rejects a multi-part question however easy it is rated', () => {
    // Shape, not just the number: more parts is more to hold in your head.
    expect(isEaseDown(q({ id: 'x', partCount: 3, difficulty: 1 }))).toBe(false)
  })

  it('rejects a synthesis question', () => {
    expect(isEaseDown(q({ id: 'x', kind: 'exam', difficulty: 1 }))).toBe(false)
  })
})

describe('losingStreakLength', () => {
  it('counts only the run at the end', () => {
    expect(losingStreakLength([wrong(), a(), wrong(), wrong()])).toBe(2)
  })

  it('is zero when the last answer was right', () => {
    expect(losingStreakLength([wrong(), wrong(), a()])).toBe(0)
  })

  it('is zero for an empty session', () => {
    expect(losingStreakLength([])).toBe(0)
  })
})

describe('correctBaseline', () => {
  it('averages the correct answers only', () => {
    // The failures must not drag the baseline toward the question we react to.
    expect(correctBaseline([a({ difficulty: 1 }), a({ difficulty: 2 }), wrong({ difficulty: 5 })])).toBe(1.5)
  })

  it('is null below two correct answers', () => {
    expect(correctBaseline([a({ difficulty: 1 }), wrong()])).toBeNull()
    expect(correctBaseline([])).toBeNull()
  })

  it('ignores correct answers whose difficulty is missing', () => {
    expect(correctBaseline([a({ difficulty: null }), a({ difficulty: 3 })])).toBeNull()
  })
})

describe('difficultyDelta', () => {
  it('measures the last question against the baseline before it', () => {
    // The plan's worked example: prior-correct avg 1.5, failed on a 4.
    const answers = [a({ difficulty: 1 }), a({ difficulty: 2 }), wrong({ difficulty: 4 })]
    expect(difficultyDelta(answers)).toBe(2.5)
  })

  it('is null without a usable baseline, rather than guessing at zero', () => {
    expect(difficultyDelta([a({ difficulty: 1 }), wrong({ difficulty: 4 })])).toBeNull()
  })

  it('is null when the last question has no difficulty', () => {
    expect(difficultyDelta([a(), a(), wrong({ difficulty: null })])).toBeNull()
  })
})

describe('shouldOfferEaseDown', () => {
  it('fires on the answer that completes the streak', () => {
    expect(shouldOfferEaseDown([a(), wrong(), wrong()], 0)).toBe(true)
  })

  it('does not fire on a single wrong answer', () => {
    // A wrong answer is ordinary practice, not a wall.
    expect(shouldOfferEaseDown([a(), wrong()], 0)).toBe(false)
  })

  it('does not re-fire deeper into the same streak', () => {
    // They already declined once; asking again about the same wall is nagging.
    expect(shouldOfferEaseDown([wrong(), wrong(), wrong()], 0)).toBe(false)
  })

  it('fires again on a fresh streak after a correct answer', () => {
    expect(shouldOfferEaseDown([wrong(), wrong(), a(), wrong(), wrong()], 1)).toBe(true)
  })

  it('stops at the session cap', () => {
    expect(shouldOfferEaseDown([a(), wrong(), wrong()], MAX_OFFERS_PER_SESSION)).toBe(false)
  })

  it('takes the streak length from the constant', () => {
    expect(LOSING_STREAK).toBe(2)
  })
})

describe('pickEaseDown', () => {
  const failed = { id: 'hard', difficulty: 4, skillIds: ['percentages'] }
  const baseline = [a({ difficulty: 2 }), a({ difficulty: 2 }), wrong({ difficulty: 4 })]

  it('returns null when nothing in the pool is easier', () => {
    const pool = [q({ id: 'x', difficulty: 4 }), q({ id: 'y', difficulty: 5 })]
    expect(pickEaseDown(failed, pool, baseline)).toBeNull()
  })

  it('never offers the question just failed, or one already answered', () => {
    const pool = [q({ id: 'hard', difficulty: 4 }), q({ id: 'seen', difficulty: 1 })]
    expect(pickEaseDown(failed, pool, baseline, ['seen'])).toBeNull()
  })

  it('prefers the same skill over an easier question elsewhere', () => {
    const same  = q({ id: 'same',  difficulty: 2, skillIds: ['percentages'] })
    const other = q({ id: 'other', difficulty: 1, skillIds: ['vectors'] })
    expect(pickEaseDown(failed, [other, same], baseline)?.id).toBe('same')
  })

  it('falls back to a skill they have already got right this session', () => {
    // 60% of the time the same skill has nothing easier — this tier is what
    // stops the feature declining to fire in three moments out of five.
    const answers = [a({ difficulty: 2, skillId: 'fractions' }), a({ difficulty: 2, skillId: 'fractions' }), wrong({ difficulty: 4 })]
    const won     = q({ id: 'won',     difficulty: 2, skillIds: ['fractions'] })
    const unknown = q({ id: 'unknown', difficulty: 1, skillIds: ['vectors'] })
    expect(pickEaseDown(failed, [unknown, won], answers)?.id).toBe('won')
  })

  it('takes an untouched skill when there is nothing closer to home', () => {
    const only = q({ id: 'only', difficulty: 1, skillIds: ['vectors'] })
    expect(pickEaseDown(failed, [only], baseline)?.id).toBe('only')
  })

  it('offers the hardest question still at or below the baseline', () => {
    // As gentle as it needs to be and no gentler: dropping to a 1 after failing
    // a 4 they were clearing 2s before is its own kind of insult.
    const pool = [
      q({ id: 'one',   difficulty: 1 }),
      q({ id: 'two',   difficulty: 2 }),
      q({ id: 'three', difficulty: 3 }),
    ]
    expect(pickEaseDown(failed, pool, baseline)?.id).toBe('two')
  })

  it('takes the easiest available when nothing sits at or below the baseline', () => {
    const answers = [a({ difficulty: 1 }), a({ difficulty: 1 }), wrong({ difficulty: 5 })]
    const pool = [q({ id: 'four', difficulty: 4 }), q({ id: 'three', difficulty: 3 })]
    expect(pickEaseDown({ id: 'hard', difficulty: 5, skillIds: ['percentages'] }, pool, answers)?.id).toBe('three')
  })

  it('takes the easiest available when there is no baseline at all', () => {
    const answers = [wrong({ difficulty: 4 }), wrong({ difficulty: 4 })]
    const pool = [q({ id: 'three', difficulty: 3 }), q({ id: 'one', difficulty: 1 })]
    expect(pickEaseDown(failed, pool, answers)?.id).toBe('one')
  })

  it('breaks ties by id so the same moment always makes the same offer', () => {
    const pool = [q({ id: 'b', difficulty: 2 }), q({ id: 'a', difficulty: 2 })]
    expect(pickEaseDown(failed, pool, baseline)?.id).toBe('a')
  })

  it('skips multi-part and synthesis questions even inside the preferred tier', () => {
    const multi = q({ id: 'multi', difficulty: 2, partCount: 2 })
    const exam  = q({ id: 'exam',  difficulty: 2, kind: 'exam' })
    const plain = q({ id: 'plain', difficulty: 1, skillIds: ['vectors'] })
    expect(pickEaseDown(failed, [multi, exam, plain], baseline)?.id).toBe('plain')
  })
})
