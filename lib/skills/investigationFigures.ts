import type { RenderedGrid, RenderedAxis } from '../questions/gridDraw'

// ─────────────────────────────────────────────────────────────────────────────
// Figure builders for investigations.
//
// Every figure an investigation draws is a RenderedGrid, so the student, the
// verification harness and anything that later puts one on paper all see the
// same geometry — the same reason briefingFigures exists for the briefings,
// except that these are built per student value rather than authored once.
//
// The layering is the whole trick, and it is already in RenderedGrid
// (docs/audit/31 §6.2):
//
//   background  every line drawn so far, as plain shapes. Display only, so
//               several of them coexist happily. Shapes ONLY — axisCoordGroup
//               flips Y, which mirrors text.
//   elements    the one line that is live, in a real GridDrawMode, so the
//               canvas and checkGridDraw can both read it.
//
// Without the ghosts there is no investigation: a figure that erases the last
// value as it draws the next one shows a student four pictures and no pattern.
// ─────────────────────────────────────────────────────────────────────────────

/** Where a straight line enters and leaves the axes box, or null if it misses. */
export function clipLine(
  m: number,
  c: number,
  x: RenderedAxis,
  y: RenderedAxis,
): [[number, number], [number, number]] | null {
  const E = 1e-9
  const pts: [number, number][] = []
  const add = (px: number, py: number) => {
    if (px < x.min - E || px > x.max + E || py < y.min - E || py > y.max + E) return
    if (pts.some(p => Math.abs(p[0] - px) < 1e-6 && Math.abs(p[1] - py) < 1e-6)) return
    pts.push([px, py])
  }
  add(x.min, m * x.min + c)
  add(x.max, m * x.max + c)
  if (m !== 0) {
    add((y.min - c) / m, y.min)
    add((y.max - c) / m, y.max)
  }
  if (pts.length < 2) return null

  // The two furthest apart: a line through a corner produces three or four
  // candidates, and any closer pair would draw a stub.
  let best: [[number, number], [number, number]] = [pts[0], pts[1]]
  let far = -1
  for (let a = 0; a < pts.length; a++) {
    for (let b = a + 1; b < pts.length; b++) {
      const d = (pts[a][0] - pts[b][0]) ** 2 + (pts[a][1] - pts[b][1]) ** 2
      if (d > far) { far = d; best = [pts[a], pts[b]] }
    }
  }
  return best
}

/**
 * Line attributes. Widths are in AXIS units because the fragment is placed
 * inside axisCoordGroup, which scales by cells-per-step — a width in pixels
 * would be scaled with it and come out as a smear on a fine grid or invisible
 * on a coarse one.
 */
const GHOST = 'stroke="currentColor" stroke-opacity="0.3" stroke-width="0.05" fill="none"'
const LIVE = 'stroke="currentColor" stroke-opacity="0.95" stroke-width="0.1" fill="none" stroke-linecap="round"'

const drawLine = (
  p: [[number, number], [number, number]],
  attrs: string,
) => `<line x1="${p[0][0]}" y1="${p[0][1]}" x2="${p[1][0]}" y2="${p[1][1]}" ${attrs}/>`

/**
 * A straight-line figure: the drawn history ghosted, one value live.
 *
 * EVERY line goes in `background`, the live one included, and `elements` is
 * left empty. That is not an oversight — GridCanvas draws `grid.elements` only
 * when `showCanonical` is set, because elements are the ANSWER to a grid_draw
 * part rather than part of the picture. A display figure has no answer, so a
 * live line left in `elements` renders as nothing at all: the ghosts appear,
 * the line the student just drew does not, and the figure silently loses the
 * one thing they changed.
 */
export function straightLineGrid(opts: {
  x: RenderedAxis
  y: RenderedAxis
  /** [m, c] per ghosted line. */
  ghosts: readonly (readonly [number, number])[]
  /** The live line, or null to draw none. */
  live: readonly [number, number] | null
}): RenderedGrid {
  const { x, y, ghosts, live } = opts

  const parts = ghosts
    .map(([m, c]) => clipLine(m, c, x, y))
    .filter((p): p is [[number, number], [number, number]] => p !== null)
    .map(p => drawLine(p, GHOST))

  if (live) {
    const p = clipLine(live[0], live[1], x, y)
    // Last, so it sits over the ghosts rather than under them.
    if (p) parts.push(drawLine(p, LIVE))
  }

  return {
    mode: 'points',
    x,
    y,
    background: parts.join(''),
    elements: [],
    tolerance: 0.25,
  }
}

/**
 * A grid carrying nothing but points — the shape a grid prediction is marked
 * against.
 *
 * `points` mode rather than `line`, because the student is placing one marker
 * (where the line will cross), not drawing the line itself.
 */
export function pointsGrid(opts: {
  x: RenderedAxis
  y: RenderedAxis
  ghosts?: readonly (readonly [number, number])[]
  expect: readonly { x: number; y: number }[]
  tolerance?: number
}): RenderedGrid {
  const { x, y, expect } = opts
  const background = (opts.ghosts ?? [])
    .map(([m, c]) => clipLine(m, c, x, y))
    .filter((p): p is [[number, number], [number, number]] => p !== null)
    .map(p => drawLine(p, GHOST))
    .join('')

  return {
    mode: 'points',
    x,
    y,
    background,
    elements: expect.map(p => ({ x: p.x, y: p.y, marks: 1 })),
    // Lattice-exact: the student taps an intersection, so anything looser
    // would accept the square next door and tell them they were right.
    tolerance: opts.tolerance ?? 0.25,
  }
}

/** 'y = 2x − 3', 'y = x', 'y = −x + 4'. */
export function lineEquation(m: number, c: number): string {
  const mPart = m === 1 ? 'x' : m === -1 ? '−x' : `${fmt(m)}x`
  if (c === 0) return `y = ${mPart}`
  return `y = ${mPart} ${c > 0 ? '+' : '−'} ${Math.abs(c)}`
}

/** A number with a real minus sign, not a hyphen. */
export function fmt(n: number): string {
  return String(n).replace('-', '−')
}

/** The right-angle tick and the two legs of a measuring triangle. */
const LEG = 'stroke="currentColor" stroke-opacity="0.85" stroke-width="0.07" fill="none" '
  + 'stroke-dasharray="0.3 0.2"'

/**
 * A line with a right-angled triangle on it, showing the run across and the
 * rise up — how a gradient is actually measured.
 *
 * The triangle is what makes "m is a rate" visible rather than asserted. A
 * student can read the two legs off the grid squares and divide, which is the
 * method the exam expects, and varying the run while the quotient stays put is
 * the whole argument that the gradient belongs to the LINE and not to the
 * triangle you happened to draw on it.
 *
 * Legs are dashed so they read as measurement rather than as part of the
 * figure; the line itself stays solid.
 */
export function riseRunGrid(opts: {
  x: RenderedAxis
  y: RenderedAxis
  /** The line being measured. */
  m: number
  c: number
  /** Where the triangle starts, on the line. */
  from: number
  /** How far across it goes. */
  run: number
  /** Label the legs. Needs GridCanvas to draw author labels. */
  label?: boolean
}): RenderedGrid {
  const { x, y, m, c, from, run } = opts
  const parts: string[] = []

  const p0 = clipLine(m, c, x, y)
  if (p0) parts.push(drawLine(p0, LIVE))

  const y0 = m * from + c
  const x1 = from + run
  const y1 = m * x1 + c

  // Across, then up (or down) to meet the line again.
  parts.push(drawLine([[from, y0], [x1, y0]], LEG))
  parts.push(drawLine([[x1, y0], [x1, y1]], LEG))

  // The right angle, drawn a fifth of a square in from the corner so it reads
  // at any grid size.
  const t = 0.2
  const up = y1 > y0 ? t : -t
  parts.push(
    `<path d="M ${x1 - t} ${y0} L ${x1 - t} ${y0 + up} L ${x1} ${y0 + up}" `
    + 'stroke="currentColor" stroke-opacity="0.85" stroke-width="0.05" fill="none"/>',
  )

  const rise = y1 - y0
  const labels = opts.label === false ? undefined : [
    { x: from + run / 2, y: y0, text: `across ${fmt(run)}`, dy: 16 },
    { x: x1, y: (y0 + y1) / 2, text: `${rise >= 0 ? 'up' : 'down'} ${fmt(Math.abs(rise))}`, dx: 34 },
  ]

  return {
    mode: 'points',
    x,
    y,
    background: parts.join(''),
    elements: [],
    tolerance: 0.25,
    ...(labels ? { labels } : {}),
  }
}
