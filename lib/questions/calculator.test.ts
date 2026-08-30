import { describe, it, expect } from 'vitest'
import { calculatorValuesFor } from './calculator'

describe('calculatorValuesFor', () => {
  it('mixed applies no filter at all', () => {
    expect(calculatorValuesFor('mixed')).toBeNull()
  })

  it('non_calc admits non_calc and na, excludes calc', () => {
    const values = calculatorValuesFor('non_calc')!
    expect(values).toContain('non_calc')
    expect(values).toContain('na')
    expect(values).not.toContain('calc')
  })

  it('calc admits calc and na, excludes non_calc', () => {
    // Deliberately asymmetric from the mini-exam assembler's calcEligible,
    // which never excludes non_calc questions from a calculator PAPER (real
    // papers are built that way). Practice mode is a student-intent filter,
    // not a paper-structure rule, so it excludes in both directions — see the
    // header comment in calculator.ts.
    const values = calculatorValuesFor('calc')!
    expect(values).toContain('calc')
    expect(values).toContain('na')
    expect(values).not.toContain('non_calc')
  })
})
