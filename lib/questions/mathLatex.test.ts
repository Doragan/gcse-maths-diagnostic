import { describe, it, expect } from 'vitest'
import { toLatex } from './mathLatex'

describe('toLatex — the nested cases the old converter broke', () => {
  it('renders sqrt over a fraction (the rearranging-formula answer)', () => {
    expect(toLatex('sqrt((y-5)/3)')).toBe('\\sqrt{\\frac{(y-5)}{3}}')
  })
  it('handles the √ character form identically', () => {
    expect(toLatex('√((y-5)/3)')).toBe('\\sqrt{\\frac{(y-5)}{3}}')
  })
  it('stacks a parenthesised-numerator fraction', () => {
    expect(toLatex('(y-5)/3')).toBe('\\frac{(y-5)}{3}')
  })
  it('keeps a balanced sqrt of a sum', () => {
    expect(toLatex('sqrt(x^2+y^2)')).toBe('\\sqrt{x^{2}+y^{2}}')
  })
})

describe('toLatex — simple inputs must not regress', () => {
  it('digit/digit fraction', () => {
    expect(toLatex('3/4')).toBe('\\frac{3}{4}')
  })
  it('fraction inside an inequality', () => {
    expect(toLatex('x<=4/3')).toBe('x\\leq \\frac{4}{3}')
  })
  it('plain linear expression is unchanged', () => {
    expect(toLatex('3n+5')).toBe('3n+5')
  })
  it('power', () => {
    expect(toLatex('x^2')).toBe('x^{2}')
  })
  it('quadratic in factorised form is unchanged', () => {
    expect(toLatex('(x+2)(x+3)')).toBe('(x+2)(x+3)')
  })
  it('simple bare surd', () => {
    expect(toLatex('sqrt(50)')).toBe('\\sqrt{50}')
  })
  it('pi and times', () => {
    expect(toLatex('2*pi')).toBe('2\\times \\pi ')
  })
})

describe('toLatex — ambiguous slashes are left literal (no breakage)', () => {
  it('1/sqrt(3) leaves the slash rather than mangling the root', () => {
    // root converts first; the slash next to \sqrt is left as-is, same as before
    expect(toLatex('1/sqrt(3)')).toBe('1/\\sqrt{3}')
  })
})
