import { describe, it, expect } from 'vitest'
import { checkAnswer } from './answerChecker'

const check = (student: string, correct: string, type: 'numeric' | 'exact', tol: number | null = null) =>
  checkAnswer(student, correct, type, tol, [])

// ── a missing % is notation, not a missing unit ──────────────────────────────

describe('a percentage written without its %', () => {
  it('is correct, with a reminder about the % — and nothing for an exam to take off', () => {
    const r = check('20', '20%', 'numeric', 0.01)
    expect(r.correct).toBe(true)
    expect(r.unitsIssue).toBeUndefined()
    expect(r.message).toMatch(/% sign/)
    // Not the units message, which threatens a lost mark this does not cost.
    expect(r.message).not.toMatch(/units|final mark/)
  })

  it('is still correct on an exact answer, which compares again without the %', () => {
    // Briefly broken by this change: the re-compare used to be triggered by
    // the "missing unit" flag, so taking % out of that flag marked "35" wrong.
    const r = check('35', '35%', 'exact')
    expect(r.correct).toBe(true)
    expect(r.unitsIssue).toBeUndefined()
    expect(r.message).toMatch(/% sign/)
  })

  it('says nothing about the % when it is there', () => {
    expect(check('20%', '20%', 'numeric', 0.01).message).toBe('Correct!')
    expect(check('35%', '35%', 'exact').message).toBe('Correct!')
  })

  it('leaves a real unit left off exactly as it was', () => {
    const r = check('25', '25 cm²', 'numeric', 0.01)
    expect(r.correct).toBe(true)
    expect(r.unitsIssue).toBe('missing')
  })

  it('does not touch currency, which is a separate decision', () => {
    // £ is still counted as a unit. It has the same answer-line argument as %,
    // but it was not part of this change.
    expect(check('20', '£20', 'numeric', 0.01).unitsIssue).toBe('missing')
  })
})
