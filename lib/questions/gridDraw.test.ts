import { describe, it, expect } from 'vitest'
import {
  checkGridDraw, serialiseGridAnswer, parseGridAnswer, formatGridPoints,
  type RenderedGridElement, type GridPoint,
} from './gridDraw'

const el = (x: number, y: number, marks = 1): RenderedGridElement => ({ x, y, marks })
const pt = (x: number, y: number): GridPoint => ({ x, y })

describe('checkGridDraw — points mode', () => {
  const canonical = [el(1, 2), el(3, 4), el(5, 1)]

  it('exact match in any order → correct, full marks', () => {
    const res = checkGridDraw([pt(5, 1), pt(1, 2), pt(3, 4)], canonical, 'points', 0)
    expect(res.correct).toBe(true)
    expect(res.marksEarned).toBe(3)
    expect(res.perElement.every(e => e.correct)).toBe(true)
  })

  it('one wrong point → partial marks, not correct', () => {
    const res = checkGridDraw([pt(1, 2), pt(3, 4), pt(0, 0)], canonical, 'points', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(2)
    expect(res.perElement.map(e => e.correct)).toEqual([true, true, false])
  })

  it('tolerance admits near misses, measured in grid units', () => {
    const near = checkGridDraw([pt(1.4, 2)], [el(1, 2)], 'points', 0.5)
    expect(near.correct).toBe(true)
    const far = checkGridDraw([pt(1.6, 2)], [el(1, 2)], 'points', 0.5)
    expect(far.correct).toBe(false)
  })

  it('grid-unit distance respects step sizes', () => {
    // On a step-2 x axis, an x-difference of 1 is only half a grid unit.
    const res = checkGridDraw([pt(3, 4)], [el(2, 4)], 'points', 0.5, { xStep: 2, yStep: 1 })
    expect(res.correct).toBe(true)
  })

  it('too few or too many points → not correct (count must match)', () => {
    expect(checkGridDraw([pt(1, 2)], canonical, 'points', 0).correct).toBe(false)
    expect(checkGridDraw([pt(1, 2), pt(3, 4), pt(5, 1), pt(0, 0)], canonical, 'points', 0).correct).toBe(false)
  })

  it('duplicate student points cannot double-match one canonical element', () => {
    const res = checkGridDraw([pt(1, 2), pt(1, 2)], [el(1, 2), el(3, 4)], 'points', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(1)
  })

  it('two student points near one canonical: deterministic single match', () => {
    const res = checkGridDraw([pt(1, 2), pt(1.2, 2)], [el(1, 2), el(9, 9)], 'points', 0.5)
    expect(res.perElement[0].correct).toBe(true)
    expect(res.perElement[1].correct).toBe(false)
    expect(res.marksEarned).toBe(1)
  })

  it('zero canonical elements is never correct', () => {
    expect(checkGridDraw([], [], 'points', 0).correct).toBe(false)
  })

  it('perStudent verdicts align to the DRAWN order, not canonical order', () => {
    // Student places the wrong point first, then two right ones out of order.
    const res = checkGridDraw([pt(0, 0), pt(3, 4), pt(1, 2)], canonical, 'points', 0)
    expect(res.perStudent).toEqual([false, true, true])
  })
})

describe('checkGridDraw — polyline mode', () => {
  const canonical = [el(0, 1), el(1, 3), el(2, 2)]

  it('forward order → correct', () => {
    expect(checkGridDraw([pt(0, 1), pt(1, 3), pt(2, 2)], canonical, 'polyline', 0).correct).toBe(true)
  })

  it('reversed order accepted (same polyline traced backwards)', () => {
    const res = checkGridDraw([pt(2, 2), pt(1, 3), pt(0, 1)], canonical, 'polyline', 0)
    expect(res.correct).toBe(true)
    expect(res.marksEarned).toBe(3)
  })

  it('scrambled (non-path) order is NOT accepted', () => {
    expect(checkGridDraw([pt(1, 3), pt(0, 1), pt(2, 2)], canonical, 'polyline', 0).correct).toBe(false)
  })

  it('one vertex off → partial marks', () => {
    const res = checkGridDraw([pt(0, 1), pt(1, 4), pt(2, 2)], canonical, 'polyline', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(2)
  })

  it('length mismatch → aligned prefix only, not correct', () => {
    const res = checkGridDraw([pt(0, 1), pt(1, 3)], canonical, 'polyline', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(2)
  })
})

describe('checkGridDraw — line mode', () => {
  // y = 2x + 3 from (0,3) to (4,11), 1 mark per endpoint.
  const canonical = [el(0, 3), el(4, 11)]

  it('both points on the line, well separated → correct, full marks', () => {
    const res = checkGridDraw([pt(0, 3), pt(4, 11)], canonical, 'line', 0)
    expect(res.correct).toBe(true)
    expect(res.marksEarned).toBe(2)
  })

  it('different on-line points also earn full marks (the line is the answer)', () => {
    // (1,5) and (3,9) are on y=2x+3, span 2 grid units = the floor exactly.
    const res = checkGridDraw([pt(1, 5), pt(3, 9)], canonical, 'line', 0)
    expect(res.correct).toBe(true)
  })

  it('one point off the line → capped at total − 1 (method-mark style)', () => {
    const res = checkGridDraw([pt(0, 3), pt(4, 10)], canonical, 'line', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(1)
  })

  it('adjacent on-line points earn full marks (intercept + one gradient step)', () => {
    // (0,3) and (1,5): the standard plotting method — two distinct on-line
    // lattice points define y=2x+3 correctly regardless of separation.
    const res = checkGridDraw([pt(0, 3), pt(1, 5)], canonical, 'line', 0)
    expect(res.correct).toBe(true)
    expect(res.marksEarned).toBe(2)
  })

  it('identical points → not correct (no line drawn)', () => {
    const res = checkGridDraw([pt(2, 7), pt(2, 7)], canonical, 'line', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(1) // both "on line" but not distinct → capped
  })

  it('vertical canonical line', () => {
    const vert = [el(3, 0), el(3, 4)]
    expect(checkGridDraw([pt(3, 0), pt(3, 4)], vert, 'line', 0).correct).toBe(true)
    expect(checkGridDraw([pt(2, 0), pt(3, 4)], vert, 'line', 0).correct).toBe(false)
  })

  it('tolerance admits vertical deviation', () => {
    const res = checkGridDraw([pt(0, 3.4), pt(4, 11)], canonical, 'line', 0.5)
    expect(res.correct).toBe(true)
  })

  it('wrong drawn count → zero', () => {
    expect(checkGridDraw([pt(0, 3)], canonical, 'line', 0).marksEarned).toBe(0)
  })
})

describe('serialise / parse / format', () => {
  it('round-trips points', () => {
    const pts = [pt(1, 3), pt(2, 5)]
    expect(parseGridAnswer(serialiseGridAnswer(pts))).toEqual(pts)
  })
  it('empty → empty string → empty array', () => {
    expect(serialiseGridAnswer([])).toBe('')
    expect(parseGridAnswer('')).toEqual([])
  })
  it('garbage parses to []', () => {
    expect(parseGridAnswer('not json')).toEqual([])
    expect(parseGridAnswer('{"x":1}')).toEqual([])
    expect(parseGridAnswer('[{"x":"a","y":2}]')).toEqual([])
  })
  it('formats for review text', () => {
    expect(formatGridPoints([pt(1, 3), pt(2, 5)])).toBe('(1, 3), (2, 5)')
  })
})
