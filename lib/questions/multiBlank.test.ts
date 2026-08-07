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

describe('checkMultiBlank — errors carried forward', () => {
  // A two-way table row: F is a total the student gets wrong, A = F - 4 depends
  // on it. Getting A "wrong" consistently with their own F earns the method mark.
  const ecfPair = (fStudent: string, aStudent: string) => checkMultiBlank([
    blank({ label: 'A', student: aStudent, answer: '14', ecf: '[[F]] - 4' }),
    blank({ label: 'F', student: fStudent, answer: '18' }),
  ])

  it('follows through from a wrong sibling: correct, flagged, with its own message', () => {
    const res = ecfPair('20', '16') // F wrong by 2, A consistent with it
    expect(res.blanks[0].correct).toBe(true)
    expect(res.blanks[0].followThrough).toBe(true)
    expect(res.blanks[0].message).toBe('Correct, following through from your earlier answer.')
    expect(res.blanks[1].correct).toBe(false) // the original error still counts wrong
  })

  it('a follow-through never makes the part all-correct (feeds practice_attempts)', () => {
    const res = ecfPair('20', '16')
    expect(res.correct).toBe(false)
    expect(res.correctCount).toBe(1)
  })

  it('does not rescue an answer inconsistent with the student\'s own working', () => {
    const res = ecfPair('20', '99')
    expect(res.blanks[0].correct).toBe(false)
    expect(res.blanks[0].followThrough).toBeUndefined()
  })

  it('a plainly correct blank is never labelled follow-through', () => {
    const res = ecfPair('18', '14') // both right
    expect(res.blanks[0].correct).toBe(true)
    expect(res.blanks[0].followThrough).toBeUndefined()
    expect(res.correct).toBe(true)
  })

  it('needs a sibling error to follow FROM — right sibling, wrong blank stays wrong', () => {
    // F correct (18), A says 16. 16 ≠ 18-4, so nothing to follow through.
    const res = ecfPair('18', '16')
    expect(res.blanks[0].correct).toBe(false)
  })

  it('skips ECF when the referenced sibling is unanswered or non-numeric', () => {
    expect(ecfPair('', '16').blanks[0].correct).toBe(false)
    expect(ecfPair('dunno', '16').blanks[0].correct).toBe(false)
  })

  it('ignores an unknown or self-referential label rather than crediting it', () => {
    const unknown = checkMultiBlank([
      blank({ label: 'A', student: '16', answer: '14', ecf: '[[Z]] - 4' }),
      blank({ label: 'F', student: '20', answer: '18' }),
    ])
    expect(unknown.blanks[0].correct).toBe(false)
    const selfRef = checkMultiBlank([
      blank({ label: 'A', student: '16', answer: '14', ecf: '[[A]]' }),
      blank({ label: 'F', student: '20', answer: '18' }),
    ])
    expect(selfRef.blanks[0].correct).toBe(false)
  })

  it('handles a negative student answer without operators rebinding', () => {
    // A = F - 4 with the student's F = -3 must follow through to -7.
    const res = checkMultiBlank([
      blank({ label: 'A', student: '-7', answer: '14', ecf: '[[F]] - 4' }),
      blank({ label: 'F', student: '-3', answer: '18' }),
    ])
    expect(res.blanks[0].correct).toBe(true)
    expect(res.blanks[0].followThrough).toBe(true)
  })

  it('combines several sibling refs in one formula', () => {
    // C = (b+e) - B, i.e. 30 - B. Student's B = 12 → C should follow to 18.
    const res = checkMultiBlank([
      blank({ label: 'B', student: '12', answer: '10' }),
      blank({ label: 'C', student: '18', answer: '20', ecf: '30 - [[B]]' }),
    ])
    expect(res.blanks[1].correct).toBe(true)
    expect(res.blanks[1].followThrough).toBe(true)
  })

  it('reports follow-through instead of a trap when the value is legitimately consistent', () => {
    // 16 is both a trap value and the honest consequence of the student's F.
    const res = checkMultiBlank([
      blank({
        label: 'A', student: '16', answer: '14', ecf: '[[F]] - 4',
        traps: [{ answer: '16', response: 'You added instead of subtracting.' }],
      }),
      blank({ label: 'F', student: '20', answer: '18' }),
    ])
    expect(res.blanks[0].correct).toBe(true)
    expect(res.blanks[0].trap).toBeNull()
    expect(res.blanks[0].message).toBe('Correct, following through from your earlier answer.')
  })

  it('does not chain: ECF follows the student\'s raw answers, not another follow-through', () => {
    // F wrong (20 vs 18) → A follows to 16 → B = A - 1. B must follow from the
    // student's A (16), not from any adjusted value, and must not loop.
    const res = checkMultiBlank([
      blank({ label: 'A', student: '16', answer: '14', ecf: '[[F]] - 4' }),
      blank({ label: 'B', student: '15', answer: '13', ecf: '[[A]] - 1' }),
      blank({ label: 'F', student: '20', answer: '18' }),
    ])
    expect(res.blanks[0].correct).toBe(true) // follows from F
    // A was wrong in pass 1, so B legitimately follows through from it.
    expect(res.blanks[1].correct).toBe(true)
    expect(res.blanks[1].followThrough).toBe(true)
    expect(res.correct).toBe(false)
  })
})
