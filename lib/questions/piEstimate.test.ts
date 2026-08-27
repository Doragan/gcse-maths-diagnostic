import { describe, it, expect } from 'vitest'
import { detectPiEstimate, usesSubstitutablePi, PI_ESTIMATES } from './piEstimate'

/** The area of a circle of radius r, computed with p in place of π. */
const area = (r: number, p = Math.PI) => p * r * r
const round2 = (x: number) => Math.round(x * 100) / 100

describe('detectPiEstimate', () => {
  it('recognises 3.14 on an answer asked to 2 d.p.', () => {
    const correct = round2(area(10))            // 314.16
    const student = round2(area(10, 3.14))      // 314.00
    const hit = detectPiEstimate(student, correct, 0.005, String(correct))
    expect(hit?.label).toBe('3.14')
    expect(hit?.acceptable).toBe(false)
  })

  it('recognises 22/7', () => {
    const correct = round2(area(10))
    const student = round2(area(10, 22 / 7))
    expect(detectPiEstimate(student, correct, 0.005, String(correct))?.label).toBe('22/7')
  })

  it('treats 3.142 as acceptable rather than an error', () => {
    const correct = round2(area(10))
    const student = round2(area(10, 3.142))     // 314.20 — outside a 0.005 tolerance
    const hit = detectPiEstimate(student, correct, 0.005, String(correct))
    expect(hit?.label).toBe('3.142')
    expect(hit?.acceptable).toBe(true)
  })

  it('says nothing when the answer is simply wrong', () => {
    const correct = round2(area(10))
    // Radius mistaken for diameter — a different mistake entirely.
    expect(detectPiEstimate(round2(area(20)), correct, 0.005, String(correct))).toBeNull()
    expect(detectPiEstimate(100, correct, 0.005, String(correct))).toBeNull()
  })

  it('stays silent when the estimate makes no visible difference', () => {
    // r = 2: the whole 3.14 effect is 0.006, smaller than the 0.01 the answer
    // is written to. There is nothing here to diagnose, and claiming otherwise
    // would be reading a fault out of noise.
    const correct = round2(area(2))             // 12.57
    const student = round2(area(2, 3.14))       // 12.56
    expect(detectPiEstimate(student, correct, 0.005, String(correct))).toBeNull()
  })

  it('carries no estimate coarser than 22/7', () => {
    // 3.1 and 3 shift the answer by 1.3% and 4.5%, which is an ordinary size
    // for an arithmetic slip — they fired on questions with no π in them when
    // measured against the bank's authored traps. See the note in the module.
    expect(PI_ESTIMATES.map(e => e.label)).toEqual(['3.1416', '3.142', '3.14', '22/7'])
  })

  it('is robust to degenerate inputs', () => {
    expect(detectPiEstimate(NaN, 314.16, 0.005, '314.16')).toBeNull()
    expect(detectPiEstimate(314, NaN, 0.005, 'x')).toBeNull()
    expect(detectPiEstimate(0, 0, 0.005, '0')).toBeNull()
  })

  it('works when the tolerance is finer than the rounding asked for', () => {
    // Volume of a sphere, r = 7, to 2 d.p. but with tol = 0.001. Both sides of
    // the comparison are rounded to 0.01, so each carries half a place of
    // error; a window narrower than a whole place missed these entirely.
    const correct = round2(4 / 3 * Math.PI * 343)          // 1436.76
    const poor    = round2(4 / 3 * 3.14 * 343)             // 1435.03
    const good    = round2(4 / 3 * 3.142 * 343)            // 1436.94
    expect(detectPiEstimate(poor, correct, 0.001, String(correct))?.label).toBe('3.14')
    expect(detectPiEstimate(good, correct, 0.001, String(correct))?.acceptable).toBe(true)
  })
})

describe('usesSubstitutablePi', () => {
  it('sees π the student substitutes a value for', () => {
    expect(usesSubstitutablePi('{{round(Math.PI * r * r, 2)}} cm²')).toBe(true)
    expect(usesSubstitutablePi('{{round(theta / 360 * Math.PI * r * r, 2)}}')).toBe(true)
  })

  it('ignores a degree-to-radian conversion, which is not the student’s π', () => {
    // Every trig template carries one of these because the engine computes in
    // radians. The student never types a value for π there — the calculator
    // holds it — so faulting their π would be feedback on a step they did not
    // take.
    expect(usesSubstitutablePi('{{round(adj / Math.cos(theta * Math.PI / 180), 2)}} cm')).toBe(false)
    expect(usesSubstitutablePi('{{round(Math.asin(opp / hyp) * 180 / Math.PI, 1)}}')).toBe(false)
    expect(usesSubstitutablePi('{{round(0.5 * a * b * Math.sin(30*n * Math.PI / 180), 2)}}')).toBe(false)
  })

  it('still sees π in a formula that also converts', () => {
    // Arc length from a degree angle: the conversion is incidental, the πr is not.
    expect(usesSubstitutablePi('{{round(t/360 * 2*Math.PI*r + Math.cos(a * Math.PI / 180), 2)}}')).toBe(true)
  })

  it('is false when there is no template to judge', () => {
    expect(usesSubstitutablePi(undefined)).toBe(false)
    expect(usesSubstitutablePi('{{round(a * b, 2)}}')).toBe(false)
  })
})
