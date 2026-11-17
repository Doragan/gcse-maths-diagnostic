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

})

// ── and a missing currency sign, for the same reason ─────────────────────────

describe('an amount of money written without its £', () => {
  it('is correct, with a reminder naming the sign — and nothing for an exam to take off', () => {
    const r = check('102.30', '£102.30', 'numeric', 0.01)
    expect(r.correct).toBe(true)
    expect(r.unitsIssue).toBeUndefined()
    expect(r.message).toMatch(/£ sign/)
    expect(r.message).not.toMatch(/units|final mark/)
  })

  it('names whichever sign the answer uses', () => {
    expect(check('20', '$20', 'numeric', 0.01).message).toMatch(/\$ sign/)
    expect(check('20', '€20', 'numeric', 0.01).message).toMatch(/€ sign/)
  })

  it('says nothing about the sign when it is there', () => {
    expect(check('£102.30', '£102.30', 'numeric', 0.01).message).toBe('Correct!')
  })

  it('still wants a real unit that comes with the money', () => {
    // "£12 per kg": the £ is notation, the kg is not.
    expect(check('12', '£12 per kg', 'numeric', 0.01).unitsIssue).toBe('missing')
  })
})
