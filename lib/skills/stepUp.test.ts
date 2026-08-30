import { describe, it, expect } from 'vitest'
import { isStepUp, pickStepUp, type StepUpCandidate } from './stepUp'

const q = (over: Partial<StepUpCandidate> & { id: string }): StepUpCandidate => ({
  difficulty: 3,
  skillIds: ['percentages'],
  partKinds: ['mastery', 'mastery'],
  partCount: 2,
  ...over,
})

describe('isStepUp', () => {
  it('accepts a multi-part question whose parts are all single-skill', () => {
    expect(isStepUp(q({ id: 'a' }))).toBe(true)
  })

  it('rejects a single-part question, however hard', () => {
    // The step up is about the multi-step SHAPE. Another single-answer question
    // is just more of what they were already doing.
    expect(isStepUp(q({ id: 'a', partCount: 1, partKinds: ['mastery'], difficulty: 5 }))).toBe(false)
    expect(isStepUp(q({ id: 'a', partCount: 0, partKinds: [] }))).toBe(false)
  })

  it('rejects a question containing a synthesis part', () => {
    // That part is precisely the cliff this exists to avoid.
    expect(isStepUp(q({ id: 'a', partKinds: ['mastery', 'exam'], partCount: 2 }))).toBe(false)
  })
})

describe('pickStepUp', () => {
  it('returns null when nothing touches the mastered skill', () => {
    expect(pickStepUp('percentages', [q({ id: 'a', skillIds: ['vectors'] })], [])).toBeNull()
  })

  it('returns null when the only candidates are not step ups', () => {
    const singles = [q({ id: 'a', partCount: 1, partKinds: ['mastery'] })]
    expect(pickStepUp('percentages', singles, [])).toBeNull()
  })

  it('prefers a question that drags in no unfamiliar skill', () => {
    const known = q({ id: 'known', skillIds: ['percentages', 'fractions'], difficulty: 2 })
    const wall  = q({ id: 'wall',  skillIds: ['percentages', 'vectors'],   difficulty: 1 })
    // `wall` is EASIER, and still loses — an unmet skill is worse than a harder
    // question, because it is a wall wearing a different hat.
    const pick = pickStepUp('percentages', [wall, known], ['fractions'])
    expect(pick?.id).toBe('known')
  })

  it('falls back to fewest unfamiliar skills when none is perfectly familiar', () => {
    const one = q({ id: 'one', skillIds: ['percentages', 'vectors'] })
    const two = q({ id: 'two', skillIds: ['percentages', 'vectors', 'surds'], difficulty: 1 })
    expect(pickStepUp('percentages', [two, one], [])?.id).toBe('one')
  })

  it('breaks a tie on difficulty, then deterministically on id', () => {
    const hard = q({ id: 'b', difficulty: 5 })
    const easy = q({ id: 'c', difficulty: 2 })
    expect(pickStepUp('percentages', [hard, easy], [])?.id).toBe('c')

    const same1 = q({ id: 'z', difficulty: 3 })
    const same2 = q({ id: 'a', difficulty: 3 })
    // Same rank on every real criterion — the pick must not depend on the order
    // the database happened to return them in.
    expect(pickStepUp('percentages', [same1, same2], [])?.id).toBe('a')
    expect(pickStepUp('percentages', [same2, same1], [])?.id).toBe('a')
  })

  it('never offers an excluded question', () => {
    // The one they just answered, above all.
    const only = q({ id: 'just-did' })
    expect(pickStepUp('percentages', [only], [], ['just-did'])).toBeNull()
  })

  it('treats the mastered skill itself as familiar', () => {
    // Otherwise a single-skill multi-part question would score as "unfamiliar"
    // against a student who has demonstrably just mastered it.
    const solo = q({ id: 'solo', skillIds: ['percentages'] })
    expect(pickStepUp('percentages', [solo], [])?.id).toBe('solo')
  })
})
