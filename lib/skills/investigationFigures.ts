import type { RenderedGrid, RenderedAxis, GridLabel } from '../questions/gridDraw'
import { CELL, PAD } from '../questions/gridSvg'
import { colors } from '../styles'

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
  /**
   * Which legs to label.
   *
   * 'run' exists because a figure can be the QUESTION: "across 1, the line
   * rises by…" above a triangle whose vertical leg reads "up 3" has already
   * answered itself.
   */
  label?: 'both' | 'run' | 'none'
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
  const mode = opts.label ?? 'both'
  // Above the horizontal leg, inside the triangle: below it the label lands on
  // the axis tick numerals and the two sets of numbers collide.
  // Centred on the leg and lifted clear of it. Both offsets are forced by the
  // figure now carrying the student's OWN points: they sit on the ENDS of this
  // leg, so the label has to clear a point's radius vertically, and "across 1"
  // is wider than a single cell, so it has to be pulled back from the corner
  // or its last character disappears behind the right-angle mark.
  const runLabel = {
    x: from + run / 2,
    y: y0,
    text: `across ${fmt(run)}`,
    dx: -14,
    dy: rise >= 0 ? -17 : 27,
  }
  const riseLabel = {
    x: x1,
    y: (y0 + y1) / 2,
    text: `${rise >= 0 ? 'up' : 'down'} ${fmt(Math.abs(rise))}`,
    dx: 34,
  }
  const labels = mode === 'none' ? undefined
    : mode === 'run' ? [runLabel]
    : [runLabel, riseLabel]

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

// ─── Bar models ──────────────────────────────────────────────────────────────
//
// The picture GCSE uses for percentages, fractions and ratio: one long bar for
// the whole amount, cut into parts. A RenderedGrid on plain paper — no axes, no
// squares — so it rides the same canvas, harness and layering as every other
// figure here, with its shapes in `background` and its words in `labels`.
//
// One rule the shapes depend on: a bar model's x and y steps must MATCH. The
// canvas scales each axis by cells-per-step, and stroke widths are given in
// axis units, so with unequal steps every vertical edge would come out a
// different thickness from every horizontal one.

/** How a piece of a bar is drawn. Each is named by a label, never by colour alone. */
export type BarFill =
  /** Outlined only: part of the whole, not yet the part being talked about. */
  | 'empty'
  /** Lightly filled: the amount you started with, under what happens to it. */
  | 'light'
  /** Filled: the part the question is about. */
  | 'shaded'
  /** Dashed outline, no fill: taken away. */
  | 'removed'

export type BarPiece = {
  from: number
  to: number
  fill: BarFill
  /**
   * Act out the change when the figure appears: the piece's width runs from
   * `from` to its own between `start` and `end` seconds — up for a bar that
   * grows, down for one that shrinks. Its left edge stays put.
   */
  grow?: { from: number; start: number; end: number }
  /** Fade in at this many seconds: a piece that only makes sense once the rest has moved. */
  appear?: number
}

export type BarModel = {
  /** Bottom edge and height, in axis units. */
  y: number
  height: number
  pieces: readonly BarPiece[]
  /**
   * Thin dividers across the bar, at these x values — every 10%, so the parts
   * can be counted. Only those strictly inside the bar are drawn.
   */
  dividers?: readonly number[]
  /** Fade the whole bar in at this many seconds, for a bar that follows another. */
  appear?: number
}

/**
 * One SMIL animation, every one starting at 0 with any wait written into its
 * key times. A delayed `begin` would leave the element in its FINISHED state
 * until the wait was over, so the end of the change would flash up first.
 *
 * The element's own attributes stay its finished state, which is what anything
 * that does not run animations — the PNG harness, a print, a student who has
 * asked for less motion — sees.
 */
function animate(attr: string, frames: readonly [number, number][]): string {
  const total = frames[frames.length - 1][0]
  return `<animate attributeName="${attr}" dur="${+total.toFixed(4)}s" fill="freeze" `
    + `values="${frames.map(f => +f[1].toFixed(4)).join(';')}" `
    + `keyTimes="${frames.map(f => +(f[0] / total).toFixed(4)).join(';')}"/>`
}

/** Opacity 0 until `at`, then a quick fade to 1. */
const fadeIn = (at: number) => animate('opacity', at > 0 ? [[0, 0], [at, 0], [at + 0.25, 1]] : [[0, 0], [0.25, 1]])

/** Average width of a label character at the canvas's font size, in viewBox units. */
const LABEL_CHAR = 6.2

/**
 * An x for a centred label that keeps every character on the figure.
 *
 * A label is drawn centred on its x, so one naming a sliver at the end of a
 * bar — 1%, or 99% — would hang half off the edge. Clamped instead, using the
 * canvas's own padding as room, since a bar model has no tick numerals there.
 */
export function fitLabel(x: number, text: string, axis: RenderedAxis): number {
  const k = axis.step / CELL
  const half = (text.length * LABEL_CHAR / 2) * k
  const lo = axis.min - (PAD.left - 4) * k + half
  const hi = axis.max + (PAD.right - 4) * k - half
  return Math.min(Math.max(x, lo), hi)
}

/** Half a label's width in viewBox units, for tests and for placing one beside a line. */
export function labelHalfWidth(text: string): number {
  return text.length * LABEL_CHAR / 2
}

export function barModelGrid(opts: {
  x: RenderedAxis
  y: RenderedAxis
  bars: readonly BarModel[]
  /**
   * Dashed vertical guides — "where you started" — from `from` to `to` in y.
   * Not the full height: a guide running through the labels above and below
   * the bars cut straight through their words.
   */
  guides?: readonly { x: number; from: number; to: number }[]
  labels?: GridLabel[]
}): RenderedGrid {
  const { x, y, bars } = opts
  if (x.step !== y.step) {
    throw new Error(`a bar model needs matching steps, got x ${x.step} and y ${y.step}`)
  }
  /** viewBox units → axis units, so every stroke is the same thickness on screen. */
  const u = (vb: number) => +(vb * x.step / CELL).toFixed(4)
  const ink = `stroke="currentColor" stroke-width="${u(1.3)}"`
  const fills: Record<BarFill, string> = {
    empty: `fill="none" ${ink} stroke-opacity="0.85"`,
    light: `fill="${colors.primary}" fill-opacity="0.14" ${ink} stroke-opacity="0.85"`,
    shaded: `fill="${colors.primary}" fill-opacity="0.5" ${ink} stroke-opacity="0.9"`,
    removed: `fill="none" ${ink} stroke-opacity="0.55" stroke-dasharray="${u(4)} ${u(3)}"`,
  }

  const parts: string[] = []
  for (const bar of bars) {
    for (const p of bar.pieces) {
      const w = p.to - p.from
      // An empty piece is skipped — unless it is animating, like what is left
      // after a 100% decrease, which shrinks all the way to nothing rather
      // than vanishing before it has moved.
      if (w <= 1e-9 && !p.grow) continue
      const anims: string[] = []
      if (p.grow) {
        const { from, start, end } = p.grow
        anims.push(animate('width', start > 0
          ? [[0, from], [start, from], [end, w]]
          : [[0, from], [end, w]]))
      }
      const at = Math.max(bar.appear ?? -1, p.appear ?? -1)
      if (at >= 0) anims.push(fadeIn(at))
      const open = `<rect x="${p.from}" y="${bar.y}" width="${+w.toFixed(4)}" `
        + `height="${bar.height}" ${fills[p.fill]}`
      parts.push(anims.length ? `${open}>${anims.join('')}</rect>` : `${open}/>`)
    }
    const lo = Math.min(...bar.pieces.map(p => p.from))
    const hi = Math.max(...bar.pieces.map(p => p.to))
    for (const d of bar.dividers ?? []) {
      if (d <= lo + 1e-9 || d >= hi - 1e-9) continue
      // A divider inside a piece that is still growing turns up as the edge
      // passes it, not before: tenths floating beyond the end of the bar read
      // as the bar being longer than it is.
      // Unless a piece that does NOT move already shows it — section 1's shading
      // grows over a bar whose tenths are there from the start.
      const covered = bar.pieces.some(p => !p.grow && p.appear === undefined
        && d > p.from + 1e-9 && d < p.to - 1e-9)
      const growing = covered ? undefined : bar.pieces.find(p => p.grow && p.grow.from < p.to - p.from
        && d > p.from + p.grow.from + 1e-9 && d < p.to - 1e-9)
      let anim = ''
      if (growing?.grow) {
        const { from, start, end } = growing.grow
        const t = start + ((end - start) * (d - growing.from - from)) / (growing.to - growing.from - from)
        anim = animate('opacity', [[0, 0], [t, 0], [t + 0.05, 1]])
      } else if (bar.appear !== undefined) {
        anim = fadeIn(bar.appear)
      }
      const open = `<line x1="${+d.toFixed(4)}" y1="${bar.y}" x2="${+d.toFixed(4)}" `
        + `y2="${bar.y + bar.height}" stroke="currentColor" stroke-opacity="0.3" stroke-width="${u(0.8)}"`
      parts.push(anim ? `${open}>${anim}</line>` : `${open}/>`)
    }
  }
  for (const g of opts.guides ?? []) {
    parts.push(
      `<line x1="${g.x}" y1="${g.from}" x2="${g.x}" y2="${g.to}" stroke="currentColor" `
      + `stroke-opacity="0.6" stroke-width="${u(1.1)}" stroke-dasharray="${u(5)} ${u(4)}"/>`,
    )
  }

  return {
    mode: 'points',
    x,
    y,
    background: parts.join(''),
    labels: opts.labels ?? [],
    // Plain paper: a bar model is not a coordinate diagram, and squares behind
    // it would read as a grid to count on.
    showAxes: false,
    showGrid: false,
    elements: [],
    tolerance: 0.25,
  }
}
