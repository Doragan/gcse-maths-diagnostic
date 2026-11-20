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

// ─── Journeys: a road with a vehicle on it, and its distance–time graph ─────
//
// Two figures for one journey, run on ONE clock: a vehicle driving along a
// road, and a dot drawing that journey's line on a distance–time graph. Every
// keyframe of the vehicle has a matching keyframe on the graph, so the car
// pulling away and the line climbing steeply are visibly the same event — the
// graph stops being a picture about speed and becomes a recording of one.
//
// The two are separate RenderedGrids, drawn by separate canvases, because the
// road is plain paper and the graph is not. They stay in step because every
// animation here starts at 0 with its waits written into its key times (see
// `animate`), and the page mounts both canvases in the same render.

/** What drives along the road. A lorry and a van are drawn as a car here. */
export type Vehicle = 'car' | 'bike'

export type Drive = {
  /** The road it drives on: the y of the bottom of its wheels, in axis units. */
  road: number
  /**
   * [seconds, x] keyframes, the first at 0 seconds. The vehicle's centre moves
   * in straight lines between them, and stays at the last.
   */
  frames: readonly (readonly [number, number])[]
  vehicle?: Vehicle
  /** Faded and dashed: something to compare with, not the one being tried. */
  ghost?: boolean
}

export type Road = {
  y: number
  from: number
  to: number
  /** Marks dropped onto the road, each fading in when `appear` comes round. */
  marks?: readonly { x: number; appear?: number }[]
  /** Faint marks that are there from the start: a scale to read against. */
  faint?: readonly number[]
}

/**
 * A strip under the road that keeps the time, ruled like the graph's time
 * axis: a dot runs along it, filling it in behind, at the same steady rate the
 * graph's time axis is crossed. The road shows how FAR, the strip how LONG —
 * the two things the graph puts on its two axes — so the student can read the
 * horizontal axis of the graph off the picture as well as the vertical one.
 */
export type Clock = {
  y: number
  from: number
  to: number
  /** Where to rule it, in axis x — the graph's time ticks, carried across. */
  ticks: readonly number[]
  /**
   * [seconds, x] keyframes for the dot, the first at 0. Time does not stop
   * while anything is still moving, so it runs until the last vehicle stops.
   */
  run: Drive['frames']
}

/**
 * The shapes of a vehicle, as offsets in VIEWBOX units from the centre of its
 * wheelbase at road level. Upward is positive: the group they land in is
 * flipped so axis y grows upward.
 *
 * Symmetric front to back on purpose, so one that drives out and comes home
 * again does not reverse into town.
 */
type Part =
  | { kind: 'rect'; dx: number; y: number; w: number; h: number; style: 'body' | 'cabin' }
  | { kind: 'wheel'; dx: number; r: number; hollow?: boolean }
  | { kind: 'bar'; x1: number; y1: number; x2: number; y2: number }

const VEHICLES: Record<Vehicle, readonly Part[]> = {
  car: [
    { kind: 'rect', dx: -14, y: 3, w: 28, h: 7.5, style: 'body' },
    { kind: 'rect', dx: -8, y: 9.5, w: 16, h: 6, style: 'cabin' },
    { kind: 'wheel', dx: -8, r: 3.2 },
    { kind: 'wheel', dx: 8, r: 3.2 },
  ],
  bike: [
    { kind: 'wheel', dx: -8, r: 5, hollow: true },
    { kind: 'wheel', dx: 8, r: 5, hollow: true },
    { kind: 'bar', x1: -8, y1: 5, x2: 0, y2: 5 },
    { kind: 'bar', x1: 0, y1: 5, x2: 5, y2: 11 },
    { kind: 'bar', x1: -8, y1: 5, x2: -2, y2: 11 },
    { kind: 'bar', x1: -2, y1: 11, x2: 5, y2: 11 },
    { kind: 'bar', x1: 0, y1: 5, x2: -2, y2: 11 },
    { kind: 'bar', x1: 5, y1: 11, x2: 8, y2: 5 },
    { kind: 'bar', x1: 5, y1: 11, x2: 6, y2: 15 },
    { kind: 'bar', x1: -4, y1: 12.5, x2: 0, y2: 12.5 },
  ],
}

/** Half a vehicle's length in viewBox units — for keeping one on the figure. */
export const VEHICLE_HALF = 14

/** The x keyframes shifted by an offset, as `animate` takes them. */
const shifted = (frames: Drive['frames'], dx: number): [number, number][] =>
  frames.map(([t, x]) => [t, x + dx])

/** A frame list that actually moves — `animate` divides by its last time. */
const moves = (frames: Drive['frames']) => frames.length > 1 && frames[frames.length - 1][0] > 0

export function journeyScene(opts: {
  x: RenderedAxis
  y: RenderedAxis
  roads: readonly Road[]
  drives: readonly Drive[]
  clock?: Clock
  labels?: GridLabel[]
}): RenderedGrid {
  const { x, y } = opts
  if (x.step !== y.step) {
    throw new Error(`a journey scene needs matching steps, got x ${x.step} and y ${y.step}`)
  }
  const u = (vb: number) => +(vb * x.step / CELL).toFixed(4)
  const n = (v: number) => +v.toFixed(4)
  const parts: string[] = []

  for (const r of opts.roads) {
    parts.push(`<line x1="${n(r.from)}" y1="${r.y}" x2="${n(r.to)}" y2="${r.y}" stroke="currentColor" `
      + `stroke-opacity="0.3" stroke-width="${u(3)}" stroke-linecap="round"/>`)
    // A post at each end: where it sets off and where it is going.
    for (const end of [r.from, r.to]) {
      parts.push(`<line x1="${n(end)}" y1="${n(r.y - u(4))}" x2="${n(end)}" y2="${n(r.y + u(4))}" `
        + `stroke="currentColor" stroke-opacity="0.7" stroke-width="${u(1.4)}"/>`)
    }
    for (const f of r.faint ?? []) {
      parts.push(`<line x1="${n(f)}" y1="${n(r.y - u(2.5))}" x2="${n(f)}" y2="${n(r.y + u(2.5))}" `
        + `stroke="currentColor" stroke-opacity="0.3" stroke-width="${u(1)}"/>`)
    }
    for (const m of r.marks ?? []) {
      const open = `<line x1="${n(m.x)}" y1="${n(r.y - u(5))}" x2="${n(m.x)}" y2="${n(r.y + u(5))}" `
        + `stroke="${colors.primary}" stroke-opacity="0.9" stroke-width="${u(1.6)}"`
      parts.push(m.appear && m.appear > 0 ? `${open}>${fadeIn(m.appear)}</line>` : `${open}/>`)
    }
  }

  // After the roads: a reader of the first <line> finds a road, not the clock.
  const c = opts.clock
  if (c) {
    parts.push(`<line data-clock="strip" x1="${n(c.from)}" y1="${c.y}" x2="${n(c.to)}" y2="${c.y}" `
      + `stroke="currentColor" stroke-opacity="0.2" stroke-width="${u(2.5)}" stroke-linecap="round"/>`)
    for (const t of c.ticks) {
      parts.push(`<line x1="${n(t)}" y1="${n(c.y - u(3))}" x2="${n(t)}" y2="${n(c.y + u(3))}" `
        + `stroke="currentColor" stroke-opacity="0.45" stroke-width="${u(1)}"/>`)
    }
    const [, at] = c.run[c.run.length - 1]
    const go = moves(c.run)
    const fill = `<line data-clock="fill" x1="${n(c.from)}" y1="${c.y}" x2="${n(at)}" y2="${c.y}" `
      + `stroke="${colors.primary}" stroke-opacity="0.55" stroke-width="${u(2.5)}" stroke-linecap="round"`
    parts.push(go ? `${fill}>${animate('x2', shifted(c.run, 0))}</line>` : `${fill}/>`)
    const dot = `<circle data-clock="dot" cx="${n(at)}" cy="${c.y}" r="${u(4)}" fill="${colors.primary}"`
    parts.push(go ? `${dot}>${animate('cx', shifted(c.run, 0))}</circle>` : `${dot}/>`)
  }

  for (const d of opts.drives) {
    const [, end] = d.frames[d.frames.length - 1]
    const go = moves(d.frames)
    const who = d.ghost ? 'ghost' : 'live'
    const fillOp = d.ghost ? 0.25 : 0.85
    const cabinOp = d.ghost ? 0.15 : 0.45
    const dash = d.ghost ? ` stroke-dasharray="${u(2.5)} ${u(2)}"` : ''
    const ink = `stroke="currentColor" stroke-opacity="${d.ghost ? 0.6 : 0.9}" stroke-width="${u(1.2)}"${dash}`
    for (const p of VEHICLES[d.vehicle ?? 'car']) {
      if (p.kind === 'rect') {
        const op = p.style === 'body' ? fillOp : cabinOp
        const open = `<rect data-drive="${who}" x="${n(end + u(p.dx))}" `
          + `y="${n(d.road + u(p.y))}" width="${u(p.w)}" height="${u(p.h)}" rx="${u(2)}" `
          + `fill="${colors.primary}" fill-opacity="${op}" ${ink}`
        parts.push(go ? `${open}>${animate('x', shifted(d.frames, u(p.dx)))}</rect>` : `${open}/>`)
      } else if (p.kind === 'wheel') {
        const fill = p.hollow ? 'fill="none"' : `fill="currentColor" fill-opacity="${d.ghost ? 0.3 : 0.85}"`
        const open = `<circle data-drive="${who}" cx="${n(end + u(p.dx))}" cy="${n(d.road + u(p.r))}" r="${u(p.r)}" ${fill} ${ink}`
        parts.push(go ? `${open}>${animate('cx', shifted(d.frames, u(p.dx)))}</circle>` : `${open}/>`)
      } else {
        const open = `<line data-drive="${who}" x1="${n(end + u(p.x1))}" y1="${n(d.road + u(p.y1))}" `
          + `x2="${n(end + u(p.x2))}" y2="${n(d.road + u(p.y2))}" stroke="${colors.primary}" `
          + `stroke-opacity="${d.ghost ? 0.55 : 0.95}" stroke-width="${u(1.6)}" stroke-linecap="round"${dash}`
        parts.push(go
          ? `${open}>${animate('x1', shifted(d.frames, u(p.x1)))}${animate('x2', shifted(d.frames, u(p.x2)))}</line>`
          : `${open}/>`)
      }
    }
  }

  return {
    mode: 'points',
    x,
    y,
    background: parts.join(''),
    labels: opts.labels ?? [],
    showAxes: false,
    showGrid: false,
    elements: [],
    tolerance: 0.25,
  }
}

/** One line on a distance–time graph. */
export type Trace = {
  points: readonly (readonly [number, number])[]
  /**
   * Seconds at which the journey reaches each point. Given, the line is drawn
   * AS the journey happens — on the same clock as the vehicle on the road —
   * with a dot at its leading end. Absent, the line is simply there.
   */
  times?: readonly number[]
  /** live: the journey being tried. ghost: one tried earlier. dashed: a comparison. */
  style: 'live' | 'ghost' | 'dashed'
}

/** A dashed measuring leg — "1 hour across, 40 km up" — fading in when its time comes. */
export type MeasureLeg = {
  from: readonly [number, number]
  to: readonly [number, number]
  appear?: number
}

/**
 * A distance–time graph, ruled and numbered.
 *
 * Its axes have different steps (hours against kilometres), so nothing here
 * can be drawn with widths in axis units the way the bar models are: every
 * stroke is `non-scaling-stroke` in viewBox units, and the dot is an ellipse
 * whose radii undo the two scales so it lands on screen as a circle.
 */
export function distanceTimeGrid(opts: {
  x: RenderedAxis
  y: RenderedAxis
  traces: readonly Trace[]
  legs?: readonly MeasureLeg[]
  /**
   * [seconds, time] keyframes for a line standing up from the time axis at
   * "now" — the scene's clock, on the graph. Where it crosses a line is where
   * that journey is at that moment, faint ones included.
   */
  now?: readonly (readonly [number, number])[]
  labels?: GridLabel[]
}): RenderedGrid {
  const { x, y } = opts
  const n = (v: number) => +v.toFixed(4)
  const NS = 'vector-effect="non-scaling-stroke"'
  const STYLE: Record<Trace['style'], string> = {
    live: `stroke="${colors.primary}" stroke-width="2.5" stroke-linecap="round" fill="none" ${NS}`,
    ghost: `stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5" fill="none" ${NS}`,
    dashed: `stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="5 4" fill="none" ${NS}`,
  }
  const parts: string[] = []

  for (const leg of opts.legs ?? []) {
    const open = `<line x1="${n(leg.from[0])}" y1="${n(leg.from[1])}" x2="${n(leg.to[0])}" y2="${n(leg.to[1])}" `
      + `stroke="currentColor" stroke-opacity="0.8" stroke-width="1.3" stroke-dasharray="3 2.5" ${NS}`
    parts.push(leg.appear && leg.appear > 0 ? `${open}>${fadeIn(leg.appear)}</line>` : `${open}/>`)
  }

  if (opts.now && opts.now.length > 0) {
    const run = opts.now
    const [, at] = run[run.length - 1]
    const open = `<line data-now="" x1="${n(at)}" y1="${n(y.min)}" x2="${n(at)}" y2="${n(y.max)}" `
      + `stroke="${colors.primary}" stroke-opacity="0.4" stroke-width="1.2" ${NS}`
    parts.push(moves(run)
      ? `${open}>${animate('x1', shifted(run, 0))}${animate('x2', shifted(run, 0))}</line>`
      : `${open}/>`)
  }

  // Ghosts first, so the live line is drawn over them.
  const order = { ghost: 0, dashed: 1, live: 2 } as const
  const dots: string[] = []
  for (const tr of [...opts.traces].sort((a, b) => order[a.style] - order[b.style])) {
    const pts = tr.points
    const times = tr.times
    for (let k = 0; k + 1 < pts.length; k++) {
      const [x1, y1] = pts[k]
      const [x2, y2] = pts[k + 1]
      const open = `<line data-trace="${tr.style}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${STYLE[tr.style]}`
      if (!times) { parts.push(`${open}/>`); continue }
      const t0 = times[k]
      const t1 = times[k + 1]
      // Zero length until the journey gets here, then growing with it. A later
      // segment is also hidden until then: a round cap on a zero-length line
      // is a dot, which would mark the turning point before the van got there.
      const grow = (a: number, b: number): [number, number][] => (t0 > 0 ? [[0, a], [t0, a], [t1, b]] : [[0, a], [t1, b]])
      const anims = [animate('x2', grow(x1, x2)), animate('y2', grow(y1, y2))]
      if (t0 > 0) anims.push(animate('opacity', [[0, 0], [t0, 0], [t0 + 0.01, 1]]))
      parts.push(`${open}>${anims.join('')}</line>`)
    }
    if (times) {
      const R = 4.5
      const rx = n(R * x.step / CELL)
      const ry = n(R * y.step / CELL)
      const [ex, ey] = pts[pts.length - 1]
      const keys = (i: 0 | 1): [number, number][] => pts.map((p, k) => [times[k], p[i]])
      const fill = tr.style === 'live'
        ? `fill="${colors.primary}"`
        : 'fill="currentColor" fill-opacity="0.45"'
      dots.push(`<ellipse data-dot="${tr.style}" cx="${n(ex)}" cy="${n(ey)}" rx="${rx}" ry="${ry}" ${fill}>`
        + `${animate('cx', keys(0))}${animate('cy', keys(1))}</ellipse>`)
    }
  }
  // Dots last, over every line; the live one last of all.
  parts.push(...dots)

  return {
    mode: 'points',
    x,
    y,
    background: parts.join(''),
    labels: opts.labels ?? [],
    elements: [],
    tolerance: 0.25,
  }
}
