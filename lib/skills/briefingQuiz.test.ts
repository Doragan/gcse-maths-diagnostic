import { describe, it, expect } from 'vitest'
import { judgedCorrectly, showThisOneFirst, orderedPair } from './briefingQuiz'
import { skillBriefings } from '../../data/skillBriefings'

describe('judgedCorrectly', () => {
  it('agrees when the student says yes to the skill', () => {
    expect(judgedCorrectly('yes', true)).toBe(true)
    expect(judgedCorrectly('no', false)).toBe(true)
  })

  it('disagrees when they call it wrongly', () => {
    expect(judgedCorrectly('yes', false)).toBe(false)
    expect(judgedCorrectly('no', true)).toBe(false)
  })
})

describe('pair ordering', () => {
  it('is stable for the same comparison', () => {
    // A re-render must not reshuffle the options under the student mid-choice.
    const a = showThisOneFirst('ratio', 'proportion')
    for (let i = 0; i < 20; i++) expect(showThisOneFirst('ratio', 'proportion')).toBe(a)
  })

  it('does not always put this skill first', () => {
    // If the answer were always the top option, a student would learn the
    // position within two cards and stop reading the questions.
    const orders = Object.values(skillBriefings).flatMap(g =>
      [...g.confusableWith, ...(g.higher?.confusableWith ?? [])]
        .map(c => showThisOneFirst(g.skillId, c.skillId)))

    expect(orders.length).toBeGreaterThan(20)
    expect(orders.some(Boolean), 'this skill is never shown first').toBe(true)
    expect(orders.some(o => !o), 'this skill is always shown first').toBe(true)

    // Not a strict 50/50, but it must not be lopsided enough to be guessable.
    const firstShare = orders.filter(Boolean).length / orders.length
    expect(firstShare).toBeGreaterThan(0.25)
    expect(firstShare).toBeLessThan(0.75)
  })

  it('returns both questions, exactly one of them the skill', () => {
    for (const g of Object.values(skillBriefings)) {
      for (const c of [...g.confusableWith, ...(g.higher?.confusableWith ?? [])]) {
        const options = orderedPair(g.skillId, c.skillId, c.pair!)
        expect(options).toHaveLength(2)
        expect(options.filter(o => o.isThisSkill)).toHaveLength(1)
        expect(options.map(o => o.question).sort())
          .toEqual([c.pair!.thisOne, c.pair!.theOther].sort())
      }
    }
  })

  it('keeps each question with its own side', () => {
    const pair = { thisOne: 'mine', theOther: 'theirs' }
    for (const [a, b] of [['ratio', 'proportion'], ['mean', 'compound_units']]) {
      const options = orderedPair(a, b, pair)
      expect(options.find(o => o.isThisSkill)!.question).toBe('mine')
      expect(options.find(o => !o.isThisSkill)!.question).toBe('theirs')
    }
  })
})
