import { describe, it, expect } from 'vitest'
import { demandedRounding } from './rounding'

/** Unit size for a demand, resolved against a representative answer. */
const unit = (text: string, answer = 100) => demandedRounding(text)?.unit(answer) ?? null
const phrase = (text: string) => demandedRounding(text)?.phrase ?? null

describe('demandedRounding', () => {
  it('reads decimal places', () => {
    expect(unit('Give your answer to 2 decimal places.')).toBeCloseTo(0.01, 12)
    expect(unit('Give your answer to 1 decimal place.')).toBeCloseTo(0.1, 12)
    expect(unit('Give your answer to 3 d.p.')).toBeCloseTo(0.001, 12)
    expect(phrase('Give your answer to 2 decimal places.')).toBe('2 d.p.')
  })

  it('reads "nearest" units it can size without knowing the answer’s unit', () => {
    expect(unit('Give your answer to the nearest penny.')).toBeCloseTo(0.01, 12)
    expect(unit('Give your answer to the nearest whole number.')).toBe(1)
    expect(unit('Give your answer to the nearest 5.')).toBe(5)
    expect(unit('Give your answer to the nearest £100.')).toBe(100)
  })

  it('sizes significant figures against the answer’s magnitude', () => {
    // 3 s.f. is a 0.01 place at 1.23 and a 100 place at 12300.
    expect(unit('Give your answer to 3 significant figures.', 1.23)).toBeCloseTo(0.01, 12)
    expect(unit('Give your answer to 3 significant figures.', 12300)).toBeCloseTo(100, 9)
    expect(unit('Give your answer to 3 s.f.', -45.6)).toBeCloseTo(0.1, 12)
  })

  it('ignores rounding that describes the DATA rather than the answer', () => {
    // The bug this window exists to prevent: reading "nearest kilometre" (which
    // is about the given distance) as the precision required of the answer, and
    // so passing a 0.5 tolerance on a question that wants 0.1.
    const bounds =
      'A car travels 80 km, measured to the nearest kilometre. ' +
      'The journey takes 2.5 hours, measured to the nearest 0.1 of an hour. ' +
      'Work out the upper bound for the average speed. Give your answer in km/h, to 1 decimal place.'
    expect(unit(bounds)).toBeCloseTo(0.1, 12)
  })

  it('returns null when the answer carries no rounding instruction', () => {
    expect(demandedRounding('Solve 3x + 4 = 19')).toBeNull()
    expect(demandedRounding('The price is given to the nearest pound. What is 10% of it?')).toBeNull()
  })

  it('returns null rather than guess a unit it cannot size', () => {
    // "nearest cm" is only meaningful if the answer is in cm, which the wording
    // does not establish — a guess here would invent findings.
    expect(demandedRounding('Give your answer to the nearest cm.')).toBeNull()
  })

  it('sees through HTML markup', () => {
    expect(unit('<p>Give your answer to <strong>2 decimal places</strong>.</p>')).toBeCloseTo(0.01, 12)
  })
})
