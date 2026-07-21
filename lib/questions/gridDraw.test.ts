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

describe('checkGridDraw — cells mode', () => {
  // Shaded cells identified by bottom-left corner; exact set match.
  const canonical = [el(2, 3), el(5, 3), el(2, 6)]

  it('exact set in any order → correct, full marks', () => {
    const res = checkGridDraw([pt(2, 6), pt(2, 3), pt(5, 3)], canonical, 'cells', 0)
    expect(res.correct).toBe(true)
    expect(res.marksEarned).toBe(3)
  })

  it('one wrong cell → partial, not correct', () => {
    const res = checkGridDraw([pt(2, 3), pt(5, 3), pt(0, 0)], canonical, 'cells', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(2)
  })

  it('count mismatch → not correct', () => {
    expect(checkGridDraw([pt(2, 3), pt(5, 3)], canonical, 'cells', 0).correct).toBe(false)
  })

  it('adjacent cells never match (tolerance forced to 0 even if declared)', () => {
    // A declared tolerance of 1 would let (3,3) "match" (2,3) — cells must not.
    const res = checkGridDraw([pt(3, 3)], [el(2, 3)], 'cells', 1)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(0)
  })

  it('duplicate student cells cannot double-match', () => {
    const res = checkGridDraw([pt(2, 3), pt(2, 3)], [el(2, 3), el(5, 3)], 'cells', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(1)
  })
})

describe('checkGridDraw — polygon mode', () => {
  // A right triangle: (1,1) → (3,1) → (1,4), 1 mark per vertex.
  const canonical = [el(1, 1), el(3, 1), el(1, 4)]

  it('same starting vertex, same winding → correct', () => {
    expect(checkGridDraw([pt(1, 1), pt(3, 1), pt(1, 4)], canonical, 'polygon', 0).correct).toBe(true)
  })

  it('different starting vertex → still correct (cyclic rotation)', () => {
    const res = checkGridDraw([pt(3, 1), pt(1, 4), pt(1, 1)], canonical, 'polygon', 0)
    expect(res.correct).toBe(true)
    expect(res.marksEarned).toBe(3)
  })

  it('reversed winding → still correct', () => {
    expect(checkGridDraw([pt(1, 4), pt(3, 1), pt(1, 1)], canonical, 'polygon', 0).correct).toBe(true)
  })

  it('one vertex off → partial marks, not correct', () => {
    const res = checkGridDraw([pt(1, 1), pt(3, 1), pt(2, 4)], canonical, 'polygon', 0)
    expect(res.correct).toBe(false)
    expect(res.marksEarned).toBe(2)
  })

  it('right shape, wrong position → zero', () => {
    // Same triangle translated by (4,4): no vertex coincides.
    const res = checkGridDraw([pt(5, 5), pt(7, 5), pt(5, 8)], canonical, 'polygon', 0)
    expect(res.marksEarned).toBe(0)
  })

  it('count mismatch (quadrilateral for a triangle) → not correct', () => {
    const res = checkGridDraw([pt(1, 1), pt(3, 1), pt(3, 4), pt(1, 4)], canonical, 'polygon', 0)
    expect(res.correct).toBe(false)
  })

  it('tolerance admits a near vertex', () => {
    const res = checkGridDraw([pt(1, 1), pt(3, 1), pt(1, 4.4)], canonical, 'polygon', 0.5)
    expect(res.correct).toBe(true)
  })

  it('perStudent aligns to the drawn order under the winning rotation', () => {
    // Start at canonical[1], first two right, last wrong.
    const res = checkGridDraw([pt(3, 1), pt(1, 4), pt(0, 0)], canonical, 'polygon', 0)
    expect(res.perStudent).toEqual([true, true, false])
  })

  it('fewer than 3 canonical vertices is never correct', () => {
    expect(checkGridDraw([pt(0, 0), pt(1, 1)], [el(0, 0), el(1, 1)], 'polygon', 0).correct).toBe(false)
  })
})

describe('checkGridDraw — traps', () => {
  const tri = [el(1, 1), el(3, 1), el(1, 4)]
  const wrongTri = [pt(2, 2), pt(4, 2), pt(2, 5)] // the trap drawing
  const trap = { elements: wrongTri, response: 'You used the wrong centre.' }

  it('no traps argument → trap is null', () => {
    expect(checkGridDraw(wrongTri, tri, 'polygon', 0).trap).toBeNull()
  })

  it('a CORRECT drawing never returns a trap', () => {
    const res = checkGridDraw([pt(1, 1), pt(3, 1), pt(1, 4)], tri, 'polygon', 0, undefined, [
      { elements: [pt(1, 1), pt(3, 1), pt(1, 4)], response: 'should never fire' },
    ])
    expect(res.correct).toBe(true)
    expect(res.trap).toBeNull()
  })

  it('drawing the trap exactly fires it', () => {
    const res = checkGridDraw(wrongTri, tri, 'polygon', 0, undefined, [trap])
    expect(res.correct).toBe(false)
    expect(res.trap?.response).toBe('You used the wrong centre.')
  })

  it('a partial match does NOT fire the trap', () => {
    const res = checkGridDraw([pt(2, 2), pt(4, 2), pt(9, 9)], tri, 'polygon', 0, undefined, [trap])
    expect(res.trap).toBeNull()
  })

  it('a superset does NOT fire the trap (counts must match)', () => {
    const res = checkGridDraw([...wrongTri, pt(0, 0)], tri, 'polygon', 0, undefined, [trap])
    expect(res.trap).toBeNull()
  })

  it('polygon trap fires under a rotated + reversed winding', () => {
    // Start at the trap's last vertex, wind the other way.
    const res = checkGridDraw([pt(2, 5), pt(4, 2), pt(2, 2)], tri, 'polygon', 0, undefined, [trap])
    expect(res.trap?.response).toBe('You used the wrong centre.')
  })

  it('polyline trap fires on the reversed traversal', () => {
    const canonical = [el(0, 1), el(1, 3), el(2, 2)]
    const t = { elements: [pt(0, 0), pt(1, 2), pt(2, 1)], response: 'one down' }
    const res = checkGridDraw([pt(2, 1), pt(1, 2), pt(0, 0)], canonical, 'polyline', 0, undefined, [t])
    expect(res.trap?.response).toBe('one down')
  })

  it('line mode: a trap fires for ANY two points on the wrong line', () => {
    // Correct y = x + 2; trap line y = x (the "forgot the + c" slip).
    const canonical = [el(0, 2), el(4, 6)]
    const t = { elements: [pt(0, 0), pt(4, 4)], response: 'You ignored the + 2.' }
    // Student draws two DIFFERENT points that still lie on y = x.
    const res = checkGridDraw([pt(1, 1), pt(3, 3)], canonical, 'line', 0, undefined, [t])
    expect(res.correct).toBe(false)
    expect(res.trap?.response).toBe('You ignored the + 2.')
  })

  it('line mode: points on neither line → no trap', () => {
    const canonical = [el(0, 2), el(4, 6)]
    const t = { elements: [pt(0, 0), pt(4, 4)], response: 'nope' }
    expect(checkGridDraw([pt(0, 5), pt(4, 5)], canonical, 'line', 0, undefined, [t]).trap).toBeNull()
  })

  it('a firing trap leaves marks and verdicts untouched', () => {
    const without = checkGridDraw(wrongTri, tri, 'polygon', 0)
    const withTrap = checkGridDraw(wrongTri, tri, 'polygon', 0, undefined, [trap])
    expect(withTrap.marksEarned).toBe(without.marksEarned)
    expect(withTrap.marksTotal).toBe(without.marksTotal)
    expect(withTrap.perElement).toEqual(without.perElement)
    expect(withTrap.perStudent).toEqual(without.perStudent)
  })

  it('the FIRST matching trap wins', () => {
    const res = checkGridDraw(wrongTri, tri, 'polygon', 0, undefined, [
      { elements: wrongTri, response: 'first' },
      { elements: wrongTri, response: 'second' },
    ])
    expect(res.trap?.response).toBe('first')
  })

  it('a trap with a non-finite element is skipped, not thrown on', () => {
    const res = checkGridDraw(wrongTri, tri, 'polygon', 0, undefined, [
      { elements: [pt(NaN, 2), pt(4, 2), pt(2, 5)], response: 'broken' },
      trap,
    ])
    expect(res.trap?.response).toBe('You used the wrong centre.')
  })

  it('trap matching inherits the tolerance', () => {
    const res = checkGridDraw([pt(2.4, 2), pt(4, 2), pt(2, 5)], tri, 'polygon', 0.5, undefined, [trap])
    expect(res.trap?.response).toBe('You used the wrong centre.')
  })
})

describe("checkGridDraw — 'translated' traps (right shape, wrong place)", () => {
  // Correct enlargement of (1,1),(2,1),(1,3) by k=2 about the origin.
  const correct = [el(2, 2), el(4, 2), el(2, 6)]
  const moved = { elements: [], response: 'Right shape, wrong place.', match: 'translated' as const }

  /** Enlarge the original triangle by k about an arbitrary centre. */
  const enlargeAbout = (cx: number, cy: number, k: number) =>
    [[1, 1], [2, 1], [1, 3]].map(([x, y]) => pt(cx + k * (x - cx), cy + k * (y - cy)))

  it('fires for EVERY wrong centre of enlargement', () => {
    // Enlarging about any centre gives the correct image translated, so one
    // predicate must catch them all.
    for (const [cx, cy] of [[1, 1], [2, 1], [1, 3], [0, 5], [3, 0], [-2, 4]]) {
      const drawn = enlargeAbout(cx, cy, 2)
      const res = checkGridDraw(drawn, correct, 'polygon', 0, undefined, [moved])
      expect(res.correct).toBe(false)
      expect(res.trap?.response, `centre (${cx}, ${cy})`).toBe('Right shape, wrong place.')
    }
  })

  it('does NOT fire for the correct answer (zero offset)', () => {
    const res = checkGridDraw(enlargeAbout(0, 0, 2), correct, 'polygon', 0, undefined, [moved])
    expect(res.correct).toBe(true)
    expect(res.trap).toBeNull()
  })

  it('does NOT fire for the wrong SCALE factor (shape differs, not just place)', () => {
    const res = checkGridDraw(enlargeAbout(0, 0, 3), correct, 'polygon', 0, undefined, [moved])
    expect(res.trap).toBeNull()
  })

  it('does NOT fire for a distorted shape moved elsewhere', () => {
    const res = checkGridDraw([pt(5, 5), pt(8, 5), pt(5, 9)], correct, 'polygon', 0, undefined, [moved])
    expect(res.trap).toBeNull()
  })

  it('fires under a rotated/reversed winding of the moved shape', () => {
    const [a, b, c] = enlargeAbout(1, 1, 2)
    const res = checkGridDraw([c, b, a], correct, 'polygon', 0, undefined, [moved])
    expect(res.trap?.response).toBe('Right shape, wrong place.')
  })

  it('points mode: fires for the set shifted, in any order', () => {
    const canonical = [el(1, 1), el(3, 2), el(5, 1)]
    const shifted = [pt(7, 3), pt(3, 3), pt(5, 4)] // +2,+2 in scrambled order
    const res = checkGridDraw(shifted, canonical, 'points', 0, undefined, [moved])
    expect(res.trap?.response).toBe('Right shape, wrong place.')
  })

  it('line mode: fires for a PARALLEL line (right gradient, wrong intercept)', () => {
    const canonical = [el(0, 2), el(4, 6)] // y = x + 2
    const parallel = [pt(0, 0), pt(4, 4)] // y = x
    expect(checkGridDraw(parallel, canonical, 'line', 0, undefined, [moved]).trap?.response)
      .toBe('Right shape, wrong place.')
    // A different gradient is NOT a translation.
    expect(checkGridDraw([pt(0, 2), pt(1, 4)], canonical, 'line', 0, undefined, [moved]).trap).toBeNull()
  })

  it('line mode: fires for ANY wrong intercept, not just the origin', () => {
    const canonical = [el(0, 2), el(4, 6)] // y = x + 2
    // A student who is off by a DIFFERENT amount (not through the origin)
    // must still be caught — a fixed 'exact' trap at one wrong intercept
    // would miss this.
    const offByThree = [pt(0, 5), pt(4, 9)] // y = x + 5
    expect(checkGridDraw(offByThree, canonical, 'line', 0, undefined, [moved]).trap?.response)
      .toBe('Right shape, wrong place.')
  })

  it("line mode: doesn't cross-fire with an exact wrong-gradient trap", () => {
    const canonical = [el(0, 2), el(4, 6)] // y = x + 2
    const wrongGradientTrap = { elements: [pt(0, 2), pt(1, 4)], response: 'wrong gradient' }
    // Right intercept, wrong gradient (y = 2x + 2) should hit the exact trap,
    // not the translated one — the two traps must not overlap.
    const res = checkGridDraw([pt(0, 2), pt(2, 6)], canonical, 'line', 0, undefined, [moved, wrongGradientTrap])
    expect(res.trap?.response).toBe('wrong gradient')
  })

  it('wrong element count never fires', () => {
    const res = checkGridDraw([pt(5, 5), pt(7, 5)], correct, 'polygon', 0, undefined, [moved])
    expect(res.trap).toBeNull()
  })

  it('leaves marks untouched, like any trap', () => {
    const drawn = enlargeAbout(1, 1, 2)
    const without = checkGridDraw(drawn, correct, 'polygon', 0)
    const withTrap = checkGridDraw(drawn, correct, 'polygon', 0, undefined, [moved])
    expect(withTrap.marksEarned).toBe(without.marksEarned)
    expect(withTrap.perElement).toEqual(without.perElement)
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
