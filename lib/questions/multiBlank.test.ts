import { describe, it, expect } from 'vitest'
import { checkMultiBlank, type BlankCheck } from './multiBlank'

const blank = (over: Partial<BlankCheck>): BlankCheck => ({
  label: 'A',
  student: '',
  answer: '10',
  answer_type: 'numeric',
  tolerance: 0,
  requires_simplest: false,
  traps: [],
  ...over,
})

describe('checkMultiBlank', () => {
  it('all blanks correct → correct with full count', () => {
    const res = checkMultiBlank([
      blank({ label: 'A', student: '10', answer: '10' }),
      blank({ label: 'B', student: '36', answer: '36' }),
    ])
    expect(res.correct).toBe(true)
    expect(res.correctCount).toBe(2)
    expect(res.blanks.every(b => b.correct)).toBe(true)
  })

  it('one wrong → aggregate false, count and per-blank flags right', () => {
    const res = checkMultiBlank([
      blank({ label: 'A', student: '10', answer: '10' }),
      blank({ label: 'B', student: '5', answer: '36' }),
      blank({ label: 'C', student: '7', answer: '7' }),
    ])
    expect(res.correct).toBe(false)
    expect(res.correctCount).toBe(2)
    expect(res.blanks.map(b => b.correct)).toEqual([true, false, true])
  })

  it('a trap fires on its own blank only, surfacing that blank\'s message', () => {
    const res = checkMultiBlank([
      blank({ label: 'A', student: '33', answer: '15', traps: [{ answer: '33', response: 'You added instead of subtracting.' }] }),
      blank({ label: 'B', student: '33', answer: '33' }),
    ])
    expect(res.blanks[0].correct).toBe(false)
    expect(res.blanks[0].trap).not.toBeNull()
    expect(res.blanks[0].message).toBe('You added instead of subtracting.')
    expect(res.blanks[1].correct).toBe(true)
    expect(res.blanks[1].trap).toBeNull()
  })

  it('empty input → "Not answered." without a trap, and never calls the grader', () => {
    const res = checkMultiBlank([
      blank({ label: 'A', student: '   ', answer: '10', traps: [{ answer: '', response: 'should never fire' }] }),
    ])
    expect(res.blanks[0].correct).toBe(false)
    expect(res.blanks[0].trap).toBeNull()
    expect(res.blanks[0].message).toBe('Not answered.')
  })

  it('respects per-blank tolerance independently', () => {
    const res = checkMultiBlank([
      blank({ label: 'A', student: '10.4', answer: '10', tolerance: 0.5 }),
      blank({ label: 'B', student: '10.4', answer: '10', tolerance: 0 }),
    ])
    expect(res.blanks[0].correct).toBe(true)
    expect(res.blanks[1].correct).toBe(false)
  })

  it('mixes answer types in one call (numeric + fraction)', () => {
    const res = checkMultiBlank([
      blank({ label: 'A', student: '12', answer: '12' }),
      blank({ label: 'B', student: '2/4', answer: '1/2', answer_type: 'fraction', tolerance: null, requires_simplest: true }),
    ])
    expect(res.blanks[0].correct).toBe(true)
    // Unsimplified with requires_simplest → rejected by the existing grader rules.
    expect(res.blanks[1].correct).toBe(false)
  })

  it('zero blanks is never correct (degenerate guard)', () => {
    expect(checkMultiBlank([]).correct).toBe(false)
  })
})
