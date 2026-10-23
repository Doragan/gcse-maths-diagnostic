import { describe, it, expect } from 'vitest'
import { rollupMisconception } from './attemptMisconception'

const right = { correct: true, misconception: null }
const wrong = (m: string | null) => ({ correct: false, misconception: m })

describe('rollupMisconception', () => {
  it('is null when every part was right', () => {
    expect(rollupMisconception([right, right, right])).toBeNull()
  })

  it('takes the misconception of the one wrong part', () => {
    expect(rollupMisconception([right, wrong('sign_dropped'), right])).toBe('sign_dropped')
  })

  it('takes the EARLIEST wrong part, since the later ones follow from it', () => {
    expect(rollupMisconception([wrong('wrong_operation'), wrong('sign_dropped')]))
      .toBe('wrong_operation')
  })

  it('skips an untagged wrong part rather than reporting nothing', () => {
    // 280 of 620 traps carry an id, so an untagged first error is common.
    expect(rollupMisconception([wrong(null), wrong('sign_dropped')])).toBe('sign_dropped')
  })

  it('ignores a tagged part that was CORRECT', () => {
    // A trap id on a right answer would be a bug upstream, but reporting it
    // would tell a teacher a pupil holds a misconception they just disproved.
    expect(rollupMisconception([{ correct: true, misconception: 'sign_dropped' }, wrong(null)]))
      .toBeNull()
  })

  it('is null when every wrong part is untagged', () => {
    expect(rollupMisconception([wrong(null), wrong(undefined as unknown as null)])).toBeNull()
  })

  it('handles a question with no parts recorded yet', () => {
    expect(rollupMisconception([])).toBeNull()
  })
})
