import { describe, it, expect } from 'vitest'
import {
  generateValues, evaluateTemplate, renderQuestion, renderMultiPartQuestion, isPrime,
} from './paramEngine'

describe('isPrime', () => {
  it('classifies small numbers', () => {
    expect([0, 1, 4, 9].map(isPrime)).toEqual([false, false, false, false])
    expect([2, 3, 5, 7, 11, 97].map(isPrime)).toEqual([true, true, true, true, true, true])
  })
})

describe('generateValues — ranges & constraints (invariants over many draws)', () => {
  const draws = (params: any, n = 200) => Array.from({ length: n }, () => generateValues(params))

  it('integers land within [min, max]', () => {
    for (const v of draws({ a: { type: 'integer', min: 3, max: 7 } })) {
      expect(v.a).toBeGreaterThanOrEqual(3)
      expect(v.a).toBeLessThanOrEqual(7)
      expect(Number.isInteger(v.a)).toBe(true)
    }
  })

  it('decimals respect decimal_places', () => {
    for (const v of draws({ a: { type: 'decimal', min: 1, max: 2, decimal_places: 1 } })) {
      expect(v.a).toBeGreaterThanOrEqual(1)
      expect(v.a).toBeLessThanOrEqual(2)
      expect(Number.isInteger(Math.round(v.a * 10))).toBe(true) // ≤1 dp
    }
  })

  it('honours is_even / is_prime / not_zero', () => {
    for (const v of draws({ a: { type: 'integer', min: 1, max: 20, constraint: { type: 'is_even' } } }))
      expect(v.a % 2).toBe(0)
    for (const v of draws({ a: { type: 'integer', min: 2, max: 30, constraint: { type: 'is_prime' } } }))
      expect(isPrime(v.a)).toBe(true)
    for (const v of draws({ a: { type: 'integer', min: -3, max: 3, constraint: { type: 'not_zero' } } }))
      expect(v.a).not.toBe(0)
  })

  it('honours neq against a fixed value and multiple_of', () => {
    for (const v of draws({ a: { type: 'integer', min: 1, max: 3, constraint: { type: 'neq', target: 2, target_type: 'value' } } }))
      expect(v.a).not.toBe(2)
    for (const v of draws({ a: { type: 'integer', min: 1, max: 30, constraint: { type: 'multiple_of', target: 5, target_type: 'value' } } }))
      expect(v.a % 5).toBe(0)
  })

  it('supports a cross-parameter neq constraint', () => {
    for (const v of draws({
      a: { type: 'integer', min: 1, max: 4 },
      b: { type: 'integer', min: 1, max: 4, constraint: { type: 'neq', target: 'a', target_type: 'parameter' } },
    })) expect(v.b).not.toBe(v.a)
  })
})

describe('evaluateTemplate — substitution, helpers, cleanup', () => {
  it('substitutes params and evaluates arithmetic', () => {
    expect(evaluateTemplate('{{a}} + {{b}} = {{a + b}}', { a: 2, b: 3 })).toBe('2 + 3 = 5')
  })
  it('exposes round() with IEEE-safe rounding', () => {
    expect(evaluateTemplate('{{round(4.45, 1)}}', {})).toBe('4.5') // not 4.4
  })
  it('exposes gcd() and fracStr() (auto-simplifying)', () => {
    expect(evaluateTemplate('{{gcd(12, 8)}}', {})).toBe('4')
    expect(evaluateTemplate('{{fracStr(6, 8)}}', {})).toBe('3/4')
    expect(evaluateTemplate('{{fracStr(6, 2)}}', {})).toBe('3') // whole number collapses
  })
  it('exposes frac() as stacked HTML', () => {
    const out = evaluateTemplate('{{frac(3, 4)}}', {})
    expect(out).toContain('<span')
    expect(out).toContain('3')
    expect(out).toContain('4')
  })
  it('cleans double signs, unit coefficients and zero terms', () => {
    expect(evaluateTemplate('{{a}}n + {{b}}', { a: 2, b: -5 })).toBe('2n - 5')
    expect(evaluateTemplate('{{a}}n - {{b}}', { a: 2, b: -5 })).toBe('2n + 5')
    expect(evaluateTemplate('{{a}}x', { a: 1 })).toBe('x')
    expect(evaluateTemplate('{{a}}n + {{b}}', { a: 5, b: 0 })).toBe('5n')
  })
  it('falls back to [error: …] on a bad expression rather than throwing', () => {
    expect(evaluateTemplate('{{nope()}}', {})).toBe('[error: nope()]')
  })
})

describe('renderQuestion / renderMultiPartQuestion', () => {
  it('renders question, answer, traps and explanation against fixed values', () => {
    const r = renderQuestion(
      'What is {{a}}×{{b}}?', '{{a * b}}',
      [{ answer_template: '{{a + b}}', response: 'You added.' }],
      'Because {{a}}×{{b}}={{a * b}}.',
      {}, { a: 3, b: 4 },
    )
    expect(r.answer).toBe('12')
    expect(r.traps[0]).toEqual({ answer: '7', response: 'You added.' })
    expect(r.explanation).toContain('12')
    expect(r.generatedValues).toEqual({ a: 3, b: 4 })
  })
  it('renders every part against ONE shared value set so later parts can reuse values', () => {
    const r = renderMultiPartQuestion(
      'Stem with {{a}}.',
      [
        { prompt: '(a) double {{a}}', answer_template: '{{a * 2}}', traps: [], explanation: null },
        { prompt: '(b) use {{a}} again', answer_template: '{{a + 1}}', traps: [], explanation: null },
      ],
      {}, { a: 5 },
    )
    expect(r.stem).toBe('Stem with 5.')
    expect(r.parts.map(p => p.answer)).toEqual(['10', '6'])
  })
})
