import { describe, it, expect } from 'vitest'
import { computeMasteryProgress, type Attempt } from './masteryProgress'

/**
 * The card exists to answer "what did this paper move", which is a DIFFERENCE.
 * Computing mastery from the paper alone — as the review did before — could
 * only restate the paper's own correctness.
 */

/** No prerequisite credit, so these tests isolate the comparison itself. */
const noTree = () => []

let clock = 0
const at = (correct: boolean, skill = 'fractions'): Attempt => ({
  skill_ids: [skill],
  correct,
  attempted_at: new Date(1_700_000_000_000 + clock++ * 60_000).toISOString(),
})

describe('movement', () => {
  it('reports a skill that moved up, with where it came from', () => {
    // Two right then a slip leaves it short of the fast-track; a further two
    // correct carry it to mastered.
    const prior = [at(true), at(true), at(false)]
    const paper = [at(true), at(true)]
    const p = computeMasteryProgress(prior, paper, noTree)

    const move = p.moves.find(m => m.skillId === 'fractions')!
    expect(move.from).not.toBe('mastered')
    expect(move.to).toBe('mastered')
    expect(move.direction).toBe('up')
    expect(p.movedUp).toHaveLength(1)
    expect(p.newlyMastered).toHaveLength(1)
  })

  it('reports no movement when a skill simply held its level', () => {
    const prior = [at(true), at(true), at(true)]   // already mastered
    const p = computeMasteryProgress(prior, [at(true)], noTree)
    expect(p.moves[0].direction).toBe('same')
    expect(p.movedUp).toHaveLength(0)
    expect(p.newlyMastered).toHaveLength(0)
  })

  it('reports a fall as movement DOWN rather than hiding it', () => {
    const prior = [at(true), at(true), at(true), at(true), at(true)]
    const paper = [at(false), at(false)]
    const p = computeMasteryProgress(prior, paper, noTree)
    expect(p.movedDown.length).toBeGreaterThan(0)
    expect(p.moves[0].direction).toBe('down')
  })

  it('counts a never-seen skill as forward movement, from null', () => {
    const p = computeMasteryProgress([], [at(true, 'surds')], noTree)
    const move = p.moves[0]
    expect(move.from).toBeNull()
    expect(move.direction).toBe('up')
    expect(p.firstTime).toHaveLength(1)
  })
})

describe('what each row carries', () => {
  it('separates THIS paper from the standing behind it', () => {
    // The old card could only ever show "1/1" — the paper's own tally. A row
    // now shows that alongside the real window it produced.
    const prior = [at(true), at(true), at(true)]
    const p = computeMasteryProgress(prior, [at(false)], noTree)
    const move = p.moves[0]
    expect(move.paperCorrect).toBe(0)
    expect(move.paperTotal).toBe(1)
    expect(move.recentAttempts).toBeGreaterThan(move.paperTotal)
  })

  it('tallies several units on one skill into a single row', () => {
    const p = computeMasteryProgress([], [at(true), at(true), at(false)], noTree)
    expect(p.moves).toHaveLength(1)
    expect(p.moves[0].paperCorrect).toBe(2)
    expect(p.moves[0].paperTotal).toBe(3)
  })

  it('puts movement before the skills that stayed put', () => {
    const prior = [
      ...[at(true, 'a'), at(true, 'a'), at(true, 'a')],       // already mastered
      ...[at(true, 'b'), at(true, 'b'), at(false, 'b')],      // short of it
    ]
    const paper = [at(true, 'a'), at(true, 'b'), at(true, 'b')]
    const p = computeMasteryProgress(prior, paper, noTree)
    expect(p.moves[0].direction).toBe('up')
  })
})

describe('the overall standing', () => {
  it('reports mastered totals either side of the paper', () => {
    const prior = [at(true, 'a'), at(true, 'a'), at(true, 'a')]
    const paper = [at(true, 'b'), at(true, 'b'), at(true, 'b')]
    const p = computeMasteryProgress(prior, paper, noTree)
    expect(p.masteredBefore).toBe(1)
    expect(p.masteredAfter).toBe(2)
  })

  it('knows when there is no history to compare against', () => {
    expect(computeMasteryProgress([], [at(true)], noTree).hasPrior).toBe(false)
    expect(computeMasteryProgress([at(true)], [at(true)], noTree).hasPrior).toBe(true)
  })

  it('counts prerequisites credited without being tested directly', () => {
    // A correct answer on 'ratio' credits its prerequisite 'fractions', which
    // the paper never asked about.
    const tree = (s: string) => (s === 'ratio' ? ['fractions'] : [])
    const p = computeMasteryProgress([], [at(true, 'ratio')], tree)
    expect(p.moves.map(m => m.skillId)).toEqual(['ratio'])
    expect(p.reinforced).toBeGreaterThan(0)
  })
})

describe('unanswered questions never reach here', () => {
  it('ignores skills with no attempt in the paper', () => {
    // The caller filters blanks out; nothing in the paper means nothing moved.
    const p = computeMasteryProgress([at(true, 'a')], [], noTree)
    expect(p.moves).toHaveLength(0)
    expect(p.movedUp).toHaveLength(0)
  })
})
