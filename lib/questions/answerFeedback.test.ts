import { describe, it, expect } from 'vitest'
import { checkAnswer } from './answerChecker'
import type { ScalarAnswerType } from './answerTypes'

/**
 * Four grading faults found by sitting a real mini-exam (2026-07-31).
 *
 * Three of them were one root cause: for a numeric answer the value comparison
 * reads the first number and stops, so everything written after it — a unit, the
 * rest of a fraction — was invisible to the grader.
 */
const check = (s: string, c: string, ty: ScalarAnswerType, traps: { answer: string; response: string }[] = []) =>
  checkAnswer(s, c, ty, null, traps, false)

describe('a fraction is one value, not a number followed by noise', () => {
  it('reads "3/15" as 0.2, not as 3', () => {
    // The bug: a pie-chart answer of "3/15" was truncated to "3", which then
    // matched the trap written for "3 people" and fed back a misconception the
    // student never had.
    const trap = [{ answer: '3', response: 'That is the number of people, not the angle.' }]
    const r = check('3/15', '72', 'numeric', trap)
    expect(r.correct).toBe(false)
    expect(r.trap).toBeNull()
    expect(r.message).not.toMatch(/number of people/)
  })

  it('still accepts a fraction that genuinely equals the answer', () => {
    expect(check('3/4', '0.75', 'numeric').correct).toBe(true)
  })

  it('leaves a plain number with a trailing unit alone', () => {
    expect(check('15 cm', '15 cm', 'numeric').correct).toBe(true)
  })
})

describe('wrong units are flagged, but never block progress', () => {
  it('stays CORRECT so the skill map credits the maths', () => {
    // The unit is almost never the skill under test, so a student who did the
    // work must not be held back by mislabelling it. Only exam MARKS suffer,
    // and that deduction lives in gradeUnits, not here.
    const r = check('400cm^3', '400 litres', 'numeric')
    expect(r.correct).toBe(true)
    expect(r.wrongUnits).toBe(true)
    // Names the unit as the question writes it, not an internal key.
    expect(r.message).toMatch(/litres/)
  })

  it('catches it for a length too', () => {
    const r = check('15mm', '15 cm', 'numeric')
    expect(r.wrongUnits).toBe(true)
    expect(r.correct).toBe(true)
  })

  it('accepts units merely omitted, with the existing reminder', () => {
    const r = check('400', '400 litres', 'numeric')
    expect(r.correct).toBe(true)
    expect(r.wrongUnits).toBeUndefined()
    expect(r.message).toMatch(/units/i)
  })

  it('treats spelling variants of the same unit as equal', () => {
    for (const [s, c] of [['400 litre', '400 litres'], ['3 metres', '3 m'], ['5 secs', '5 seconds']]) {
      expect(check(s, c, 'numeric').correct).toBe(true)
    }
  })

  it('does not mistake letters in the VALUE for a unit', () => {
    // "9pi cm²" must not read as unit "picm" and fail against "9π cm²".
    expect(check('9pi cm^2', '9π cm²', 'exact').correct).toBe(true)
  })

  it('is silent when neither side names a unit', () => {
    expect(check('72', '72', 'numeric').wrongUnits).toBeUndefined()
  })
})

describe('a power written without its ^ symbol', () => {
  it('stays wrong, but names the key and how to type it', () => {
    // "x5" genuinely reads as 5 × x; accepting it would train a notation that
    // loses marks in a real exam. So explain rather than accept — and say
    // "^ symbol", not "caret", which a 15-year-old has no reason to know.
    const r = check('X5', 'x^5', 'exact')
    expect(r.correct).toBe(false)
    expect(r.message).toMatch(/\^/)
    expect(r.message).toMatch(/shift/i)
    expect(r.message).not.toMatch(/caret/i)
  })

  it('leaves a genuinely different answer with the ordinary message', () => {
    expect(check('x^4', 'x^5', 'exact').message).not.toMatch(/Shift/i)
  })

  it('does not fire when the answer has no power at all', () => {
    expect(check('12', '15', 'numeric').message).not.toMatch(/Shift/i)
  })
})
