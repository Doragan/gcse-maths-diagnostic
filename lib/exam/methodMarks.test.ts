import { describe, it, expect } from 'vitest'
import { buildItem, gradeUnits, type QuestionRow } from './examPaper'
import { methodMarkShare } from './markEvidence'

/**
 * Three-state marks: a wrong final answer is not automatically worth zero.
 *
 * Across the coded 2024 series 232 of 960 marks (24%) are METHOD marks, awarded
 * for a sound approach behind a wrong answer. Auto-grading cannot read working,
 * so those marks are split three ways: confirmed (a trap proves the method),
 * unknown (we cannot tell), or lost.
 */

/** A single-part question worth `marks`, optionally with a method-marked trap. */
const q = (over: Partial<QuestionRow> = {}): QuestionRow => ({
  id: 'q1',
  skill_ids: ['simple_arithmetic'],
  difficulty: 2,
  calculator: 'na',
  kind: 'mastery',
  marks: 3,
  question_type: 'numeric',
  question_template: 'Work out the answer.',
  answer_template: '100',
  answer_type: 'numeric',
  tolerance: null,
  requires_simplest: false,
  traps: [],
  explanation: '',
  image_url: null,
  parameters: {} as never,
  parts: null,
  ...over,
})

const grade = (row: QuestionRow, answer: string) =>
  gradeUnits([buildItem(row, 1)], { [`${row.id}:0`]: answer })

describe('methodMarkShare', () => {
  it('is zero for a one-mark part', () => {
    // Not a rounding artefact: across 149 coded 1-mark parts, not one carried a
    // method mark. When the only mark IS the answer there is no method to buy.
    expect(methodMarkShare(1)).toBe(0)
    expect(methodMarkShare(0)).toBe(0)
  })

  it('grows with the part, because more marks means more creditable steps', () => {
    expect(methodMarkShare(2)).toBeGreaterThan(0)
    expect(methodMarkShare(3)).toBeGreaterThan(methodMarkShare(2))
    expect(methodMarkShare(5)).toBeGreaterThan(methodMarkShare(3))
  })

  it('never claims every mark, since one always needs the right answer', () => {
    for (const m of [2, 3, 4, 5, 8]) {
      expect(methodMarkShare(m)).toBeLessThanOrEqual(m - 1)
    }
  })

  it('is an expectation, not a ceiling — well below the marks-minus-one maximum', () => {
    // A 3-mark part could be M2 A1, but plenty are B3 with no method at all.
    // Using the maximum would inflate a bad paper into a good-looking one.
    expect(methodMarkShare(3)).toBeLessThan(2)
  })

  it('holds the top rate rather than extrapolating past the coded range', () => {
    expect(methodMarkShare(9)).toBe(methodMarkShare(5))
  })
})

describe('three-state marks', () => {
  it('pays a correct answer in full, with nothing left uncertain', () => {
    const { earned, unknown } = grade(q(), '100')
    expect(earned).toBe(3)
    expect(unknown).toBe(0)
  })

  it('leaves method unknown when the answer is wrong and no trap fires', () => {
    const { results, earned, unknown } = grade(q(), '57')
    expect(earned).toBe(0)               // the floor stays honest
    expect(unknown).toBeCloseTo(methodMarkShare(3))
    expect(results['q1:0'].marksUnknown).toBeCloseTo(methodMarkShare(3))
    expect(results['q1:0'].marksEarned).toBe(0)
  })

  it('gives a blank answer nothing at all, not even uncertainty', () => {
    // No work means no method. This is what keeps attempting worthwhile: a
    // guess can earn method marks, an empty box cannot.
    const { results, earned, unknown } = grade(q(), '')
    expect(earned).toBe(0)
    expect(unknown).toBe(0)
    expect(results['q1:0'].marksUnknown).toBeUndefined()
  })

  it('gives a wrong one-mark answer nothing, since it has no method to credit', () => {
    const { earned, unknown } = grade(q({ marks: 1 }), '57')
    expect(earned).toBe(0)
    expect(unknown).toBe(0)
  })
})

describe('traps that prove the method', () => {
  const withTrap = (method_marks?: number) => q({
    traps: [{ answer_template: '50', response: 'You halved instead of doubling.', ...(method_marks != null ? { method_marks } : {}) }],
  })

  it('converts unknown marks into CONFIRMED marks when the trap is marked up', () => {
    const { results, earned, unknown } = grade(withTrap(2), '50')
    expect(earned).toBe(2)     // confirmed, not merely possible
    expect(unknown).toBe(0)    // the trap resolved the uncertainty
    expect(results['q1:0'].methodAwarded).toBe(2)
  })

  it('leaves an UNMARKED trap uncertain rather than guessing', () => {
    // Half the bank's traps are wrong-method ("that is the area, not the
    // perimeter") and deserve nothing. Absent an author's judgement we must not
    // invent credit — the marks stay unknown.
    const { results, earned, unknown } = grade(withTrap(), '50')
    expect(earned).toBe(0)
    expect(unknown).toBeCloseTo(methodMarkShare(3))
    expect(results['q1:0'].methodAwarded).toBeUndefined()
  })

  it('honours an explicit zero as "this trap earns nothing"', () => {
    // Distinct from unset: the author has ruled, so there is no uncertainty.
    const { earned, unknown } = grade(withTrap(0), '50')
    expect(earned).toBe(0)
    expect(unknown).toBe(0)
  })

  it('never pays more than the part can bear, however the trap is authored', () => {
    // A mis-authored 9 on a 3-mark question must not manufacture marks, and can
    // never cover the accuracy mark that needs the right answer.
    const { earned } = grade(withTrap(9), '50')
    expect(earned).toBe(2)
    const negative = grade(withTrap(-4), '50')
    expect(negative.earned).toBe(0)
  })

  it('cannot award method marks on a one-mark part even when marked up', () => {
    const one = q({ marks: 1, traps: [{ answer_template: '50', response: 'Halved.', method_marks: 1 }] })
    const { earned, unknown } = grade(one, '50')
    expect(earned).toBe(0)
    expect(unknown).toBe(0)
  })

  it('is inert on a correct answer — no trap fires, so nothing is added', () => {
    const { earned } = grade(withTrap(2), '100')
    expect(earned).toBe(3)
  })
})

describe('the confirmed floor', () => {
  it('never exceeds the paper total, even with every question trapped', () => {
    const row = q({ traps: [{ answer_template: '50', response: 'x', method_marks: 2 }] })
    const item = buildItem(row, 1)
    const { earned } = grade(row, '50')
    expect(earned).toBeLessThan(item.marks)
  })

  it('keeps unknown marks OUT of the earned total', () => {
    // The score written to exam_sessions is `earned`. If unknowns leaked into
    // it, every stored score and every point on the trend would shift.
    const { earned, unknown } = grade(q(), 'wrong')
    expect(earned).toBe(0)
    expect(unknown).toBeGreaterThan(0)
  })
})
