import { describe, it, expect } from 'vitest'
import {
  judgedCorrectly, showThisOneFirst, orderedPair, methodOptions, firstUnansweredStep,
} from './briefingQuiz'
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

describe('method step options', () => {
  const step = {
    do: 'Decide whether the side you want is the hypotenuse.',
    nextMoveDistractors: ['Square the two sides you are given.', 'Write down a² + b² = c².'] as const,
  }

  it('leaves an ungated step alone', () => {
    expect(methodOptions('pythagoras_theorem', 0, { do: 'anything' })).toBeNull()
  })

  it('offers the real move and both distractors, exactly one correct', () => {
    const options = methodOptions('pythagoras_theorem', 0, step)!
    expect(options).toHaveLength(3)
    expect(options.filter(o => o.isCorrect)).toHaveLength(1)
    expect(options.find(o => o.isCorrect)!.text).toBe(step.do)
    expect(options.map(o => o.text).sort())
      .toEqual([step.do, ...step.nextMoveDistractors].sort())
  })

  it('is stable for the same step', () => {
    // A re-render must not move the options under the student mid-choice.
    const a = methodOptions('pythagoras_theorem', 1, step)!.map(o => o.text)
    const b = methodOptions('pythagoras_theorem', 1, step)!.map(o => o.text)
    expect(a).toEqual(b)
  })

  it('does not put the answer in the same slot on every step', () => {
    // Otherwise a student answers the second question from the position of the
    // first, which is the one thing a gated reveal must not teach.
    const slots = new Set<number>()
    for (const g of Object.values(skillBriefings)) {
      const steps = [...g.steps, ...(g.higher?.steps ?? [])]
      steps.forEach((s, i) => {
        const options = methodOptions(g.skillId, i, s)
        if (options) slots.add(options.findIndex(o => o.isCorrect))
      })
    }
    // Only assert a spread once more than one step is actually gated.
    if (slots.size > 0) expect(slots.size).toBeGreaterThan(1)
  })

  it('stops at the first unanswered question and not before', () => {
    const steps = [{ do: 'one' }, step, step, { do: 'four' }]
    expect(firstUnansweredStep('s', steps, {})).toBe(1)
    expect(firstUnansweredStep('s', steps, { 1: 0 })).toBe(2)
    expect(firstUnansweredStep('s', steps, { 1: 0, 2: 1 })).toBe(-1)
  })

  it('never stops on a step with no question', () => {
    expect(firstUnansweredStep('s', [{ do: 'a' }, { do: 'b' }], {})).toBe(-1)
  })
})
