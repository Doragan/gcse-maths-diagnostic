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

  it('honours a constraint that references a LATER-generated parameter (jsonb key reorder)', () => {
    // Postgres jsonb sorts object keys, so a stored constraint can be evaluated
    // before its target parameter exists. Here `c` is generated first but is
    // constrained `c < n`; generation must still satisfy it over every draw.
    for (const v of draws({
      c: { type: 'integer', min: 2, max: 15, constraint: { type: 'lt', target: 'n', target_type: 'parameter' } },
      n: { type: 'integer', min: 8, max: 16 },
    })) expect(v.c).toBeLessThan(v.n)
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
  it('renders a part (and blank) with NO traps array without throwing', () => {
    // A multi_blank part carries its traps on the blanks, so the part-level
    // array is legitimately absent. It must not take the whole question down.
    const r = renderMultiPartQuestion(
      'Two-way table, {{n}} students.',
      [{
        prompt: 'Complete the table.',
        answer_template: '',
        explanation: null,
        blanks: [{ label: 'A', answer_template: '{{n - 1}}' }],
      } as any],
      {}, { n: 40 },
    )
    expect(r.parts[0].traps).toEqual([])
    expect(r.parts[0].blanks?.[0].answer).toBe('39')
    expect(r.parts[0].blanks?.[0].traps).toEqual([])
  })
  it('renders multi_blank blanks (answers + traps) against the same shared value set', () => {
    const r = renderMultiPartQuestion(
      'Frequency tree: {{n}} students.',
      [{
        prompt: 'Write down the values of A and B.',
        answer_template: '',
        traps: [],
        explanation: null,
        blanks: [
          { label: 'A', prompt: 'Not walking ({{n}} total)', answer_template: '{{n - w}}', traps: [] },
          {
            label: 'B',
            answer_template: '{{w - l}}',
            traps: [{ answer_template: '{{w + l}}', response: 'You added instead of subtracting.' }],
          },
        ],
      }],
      {}, { n: 60, w: 24, l: 9 },
    )
    const blanks = r.parts[0].blanks!
    expect(blanks.map(b => b.answer)).toEqual(['36', '15'])
    expect(blanks[0].prompt).toBe('Not walking (60 total)')
    expect(blanks[1].prompt).toBe('')
    expect(blanks[1].traps[0]).toEqual({ answer: '33', response: 'You added instead of subtracting.' })
  })
  it('omits the blanks key for parts without blanks (legacy unchanged)', () => {
    const r = renderMultiPartQuestion(
      'Stem.',
      [{ prompt: 'p', answer_template: '{{a}}', traps: [], explanation: null }],
      {}, { a: 1 },
    )
    expect('blanks' in r.parts[0]).toBe(false)
  })
  it('renders grid templates to numbers against the shared value set', () => {
    const r = renderMultiPartQuestion(
      'Draw y = {{m}}x + {{c}}.',
      [{
        prompt: 'p', answer_template: '', traps: [], explanation: null,
        grid: {
          mode: 'line',
          x: { min: 0, max: 4, step: 1, label: 'x' },
          y: { min: 0, max: '{{ymax}}', step: 1, label: 'y' },
          background: '',
          elements: [
            { x: 0, y: '{{c}}', marks: 1 },
            { x: 4, y: '{{4*m + c}}', marks: 1 },
          ],
          tolerance: 0,
        },
      }],
      {}, { m: 2, c: 3, ymax: 12 },
    )
    const g = r.parts[0].grid!
    expect(g.y.max).toBe(12)
    expect(g.elements.map(e => [e.x, e.y])).toEqual([[0, 3], [4, 11]])
    expect(g.x.step).toBe(1)
  })
  it('a bad grid template renders to NaN (detectable), not a crash', () => {
    const r = renderMultiPartQuestion(
      'Stem.',
      [{
        prompt: 'p', answer_template: '', traps: [], explanation: null,
        grid: {
          mode: 'points',
          x: { min: 0, max: 4, step: 1, label: '' },
          y: { min: 0, max: 4, step: 1, label: '' },
          background: '',
          elements: [{ x: '{{nope}}', y: 1, marks: 1 }],
          tolerance: 0,
        },
      }],
      {}, { a: 1 },
    )
    expect(Number.isNaN(r.parts[0].grid!.elements[0].x)).toBe(true)
  })
  it('omits the grid key for parts without one', () => {
    const r = renderMultiPartQuestion(
      'Stem.',
      [{ prompt: 'p', answer_template: '{{a}}', traps: [], explanation: null }],
      {}, { a: 1 },
    )
    expect('grid' in r.parts[0]).toBe(false)
  })
})
