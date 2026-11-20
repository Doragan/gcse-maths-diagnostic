// ─────────────────────────────────────────────────────────────────────────────
// Diagram builders for exam briefings.
//
// Some skills are diagram skills. Every coded Foundation part of tree_diagrams
// is bare — the tree is printed on the paper and partly filled in — and the
// inequalities number line is a mark in its own right. Describing those in a
// sentence teaches the wrong thing: the student has to RECOGNISE the diagram,
// which they cannot do from prose.
//
// The rules these builders keep, enforced by briefingFigures.test.ts and by the
// registry test over every authored figure:
//
//  • `currentColor` only. The page has one theme today, but a figure that
//    hard-codes #111 becomes invisible the moment that changes. Inheriting the
//    surrounding text colour is free and survives it.
//  • A viewBox and no fixed width/height, so the figure scales to its column on
//    a phone. Fixed pixel sizes are how diagrams end up clipped.
//  • Nothing fetched. No <image>, no external href, no <script>. These are
//    authored strings rendered as raw markup, so the safety rule is that they
//    can only ever draw shapes and text.
//  • Every figure carries `alt`. The diagram is doing teaching work, so a
//    student using a screen reader needs the same content in words.
//
// Diagrams are ORIGINAL, in the style of the paper — the same rule the stems
// follow. Nothing is traced from a real exam.
// ─────────────────────────────────────────────────────────────────────────────

export type Figure = {
  /** Inline SVG markup. Authored here, never from the database or a student. */
  svg: string
  /** What the diagram shows, for screen readers. */
  alt: string
}

/** Shared attributes: scales to the column, inherits the text colour. */
// font-style is reset because a figure usually sits inside a specimen box,
// which is italic, and a length such as "8 cm" printed in italics is not how a
// paper labels a diagram. Labels meant to be italic — a line's name, the axis
// letters — say so themselves.
const OPEN = (viewBox: string) =>
  `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" fill="none" `
  + `stroke="currentColor" stroke-width="1.5" font-size="12" font-family="inherit" `
  + `font-style="normal">`

/**
 * A number line with one marked boundary — the inequalities diagram.
 *
 * `closed` fills the circle (≤ or ≥, the boundary is included); open leaves it
 * hollow. That circle is the whole point: it is usually worth a mark on its
 * own, and open-vs-closed is a coded trap on both tiers.
 */
export function numberLine(opts: {
  from: number
  to: number
  boundary: number
  closed: boolean
  /** Which way the arrow runs from the boundary. */
  direction: 'left' | 'right'
  alt: string
}): Figure {
  const { from, to, boundary, closed, direction, alt } = opts
  const W = 320, H = 54, PAD = 16
  const x = (n: number) => PAD + ((n - from) / (to - from)) * (W - 2 * PAD)

  const ticks = []
  for (let n = from; n <= to; n++) {
    ticks.push(`<line x1="${x(n)}" y1="20" x2="${x(n)}" y2="28" />`)
    ticks.push(
      `<text x="${x(n)}" y="44" text-anchor="middle" stroke="none" fill="currentColor">${n}</text>`,
    )
  }

  const end = direction === 'left' ? PAD : W - PAD
  // The ray starts at the EDGE of the circle, not its centre. Drawn from the
  // centre, a 3px ray fills an open circle in and the diagram then says the
  // opposite of what it means — and open-vs-closed is the whole point of it.
  const R = 5.5
  const rayStart = x(boundary) + (direction === 'right' ? R + 1 : -(R + 1))
  const ray = `<line x1="${rayStart}" y1="24" x2="${end}" y2="24" stroke-width="3" />`
  const head = direction === 'left'
    ? `<polyline points="${PAD + 7},19 ${PAD},24 ${PAD + 7},29" />`
    : `<polyline points="${W - PAD - 7},19 ${W - PAD},24 ${W - PAD - 7},29" />`
  const circle = `<circle cx="${x(boundary)}" cy="24" r="${R}" `
    + `fill="${closed ? 'currentColor' : 'none'}" />`

  return {
    svg: OPEN(`0 0 ${W} ${H}`)
      + `<line x1="${PAD}" y1="24" x2="${W - PAD}" y2="24" />`
      + ticks.join('')
      + ray + head + circle
      + `</svg>`,
    alt,
  }
}

/**
 * A two-stage probability tree.
 *
 * Labels are passed in rather than computed, because the teaching value is in
 * what the branches SAY — a second stage whose denominators have dropped is the
 * without-replacement case, and that is the most frequent coded trap on the
 * skill.
 */
export function probabilityTree(opts: {
  /** The two first-stage branches, top then bottom. */
  first: [{ label: string; prob: string }, { label: string; prob: string }]
  /** Second-stage probabilities: [topTop, topBottom, bottomTop, bottomBottom]. */
  second: [string, string, string, string]
  alt: string
}): Figure {
  const { first, second, alt } = opts
  const W = 340, H = 200
  const x0 = 14, x1 = 120, x2 = 250
  const yMid = 100, yTop = 46, yBot = 154
  const y2 = [20, 72, 128, 180]

  const branch = (ax: number, ay: number, bx: number, by: number) =>
    `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" />`
  const label = (tx: number, ty: number, t: string, anchor = 'middle') =>
    `<text x="${tx}" y="${ty}" text-anchor="${anchor}" stroke="none" fill="currentColor">${t}</text>`

  /**
   * The probability, placed clear of the branch it belongs to.
   *
   * Sitting it at the midpoint puts the line straight through the text, which
   * is what the first version did. An upward branch takes its label above,
   * a downward one below, so nothing is ever struck through.
   */
  const branchLabel = (ax: number, ay: number, bx: number, by: number, t: string) =>
    label((ax + bx) / 2, (ay + by) / 2 + (by < ay ? -6 : 14), t)

  const parts = [
    branch(x0, yMid, x1, yTop), branch(x0, yMid, x1, yBot),
    branchLabel(x0, yMid, x1, yTop, first[0].prob),
    branchLabel(x0, yMid, x1, yBot, first[1].prob),
    label(x1 + 6, yTop + 4, first[0].label, 'start'),
    label(x1 + 6, yBot + 4, first[1].label, 'start'),

    branch(x1 + 34, yTop, x2, y2[0]), branch(x1 + 34, yTop, x2, y2[1]),
    branch(x1 + 34, yBot, x2, y2[2]), branch(x1 + 34, yBot, x2, y2[3]),
    branchLabel(x1 + 34, yTop, x2, y2[0], second[0]),
    branchLabel(x1 + 34, yTop, x2, y2[1], second[1]),
    branchLabel(x1 + 34, yBot, x2, y2[2], second[2]),
    branchLabel(x1 + 34, yBot, x2, y2[3], second[3]),

    label(x2 + 6, y2[0] + 4, first[0].label, 'start'),
    label(x2 + 6, y2[1] + 4, first[1].label, 'start'),
    label(x2 + 6, y2[2] + 4, first[0].label, 'start'),
    label(x2 + 6, y2[3] + 4, first[1].label, 'start'),
  ]

  return { svg: OPEN(`0 0 ${W} ${H}`) + parts.join('') + `</svg>`, alt }
}

// ── Shape and Space ──────────────────────────────────────────────────────────
//
// Geometry questions ARE the diagram: the figure carries the information and
// the prose only says what to find. These three cover what the coded traps
// turn on — which angle sum applies, interior versus exterior, and whether the
// unknown side is the hypotenuse.
//
// Like a real paper, the diagrams are schematic. An angle labelled 2x is not
// drawn twice the size of one labelled x, which is exactly why papers print
// "not accurately drawn" — and why measuring with a protractor earns nothing.

/** Degrees to a point on a circle, in SVG coordinates (y grows downward). */
const onCircle = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const rad = (deg * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
}

const pt = ([x, y]: [number, number]) => `${x.toFixed(1)},${y.toFixed(1)}`

/**
 * Angles meeting at a point, either on a straight line (summing to 180) or all
 * the way round (360).
 *
 * `angle_sum_choice`, `use_360_not_180` and `use_180_not_360` are all coded
 * traps on this skill, and they are the same mistake: not looking at what the
 * angles sit on. The figure exists to make that visible.
 */
export function anglesAtAPoint(opts: {
  /** 'line' sums to 180 and draws the baseline; 'point' sums to 360. */
  mode: 'line' | 'point'
  /** One label per angle, in order. Two or more. */
  labels: string[]
  alt: string
}): Figure {
  const { mode, labels, alt } = opts
  const W = 320, H = mode === 'line' ? 120 : 200
  const cx = W / 2, cy = mode === 'line' ? 92 : H / 2
  const R = 62
  const span = mode === 'line' ? 180 : 360

  // Sector sizes follow the labels where the labels are numbers. A diagram
  // showing four equal quarters while one of them is labelled 110° contradicts
  // itself, and the student is being taught to read the diagram. Labels that
  // are not numbers — x, 2x, y — share whatever is left over.
  // Only a PURE number counts — "140" or "140°". An algebraic label like "2x"
  // or "x + 40" is an unknown, not a size: reading a digit out of it drew "2x"
  // as a two-degree slice, which is nonsense and looked it.
  const known = labels.map(t => {
    const m = /^\s*(\d+(?:\.\d+)?)\s*°?\s*$/.exec(String(t))
    const n = m ? Number(m[1]) : NaN
    return Number.isFinite(n) && n > 0 && n < span ? n : null
  })
  const knownSum = known.reduce((a: number, n) => a + (n ?? 0), 0)
  const unknowns = known.filter(n => n === null).length
  const share = unknowns ? Math.max((span - knownSum) / unknowns, span * 0.12) : 0
  const raw = known.map(n => n ?? share)
  const total = raw.reduce((a, b) => a + b, 0)
  const sizes = raw.map(n => (n / total) * span)

  // Angles run the way they are read: left to right along a line, and
  // anticlockwise from the right around a point.
  const edges: number[] = []
  let at = mode === 'line' ? 180 : 0
  for (const s of sizes) {
    edges.push(at)
    at += mode === 'line' ? -s : s
  }
  edges.push(at)

  const parts: string[] = []

  if (mode === 'line') {
    parts.push(`<line x1="18" y1="${cy}" x2="${W - 18}" y2="${cy}" />`)
  }

  // On a line the two outer edges ARE the baseline, so only the dividers are
  // drawn; around a point every ray is drawn.
  const rayEdges = mode === 'line' ? edges.slice(1, -1) : edges.slice(0, -1)
  for (const deg of rayEdges) {
    const [x, y] = onCircle(cx, cy, R, deg)
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`)
  }

  // The arc is what says WHICH angle a label names. Without one the figure is
  // numbers floating between rays, and the student has to guess whether 2x is
  // the slice to the left of the ray or the right of it.
  //
  // Neighbouring sectors alternate radius on purpose: at a single radius the
  // four arcs round a point meet end to end and read as a plain circle drawn
  // around the vertex, not as four angles each marked separately.
  sizes.forEach((_, i) => {
    const from = edges[i], to = edges[i + 1]
    const r = i % 2 ? 27 : 20
    // Degrees grow anticlockwise on screen while SVG's sweep flag of 1 turns
    // clockwise, so a sector whose edge angle DROPS sweeps 1.
    const sweep = to < from ? 1 : 0
    const large = Math.abs(to - from) > 180 ? 1 : 0
    parts.push(
      `<path d="M ${pt(onCircle(cx, cy, r, from))} A ${r} ${r} 0 ${large} ${sweep} `
      + `${pt(onCircle(cx, cy, r, to))}" />`,
    )
  })

  // Each label sits on the bisector of its own sector, outside its own arc and
  // close enough to the vertex to be unambiguous about which angle it names.
  labels.forEach((t, i) => {
    const mid = (edges[i] + edges[i + 1]) / 2
    const [x, y] = onCircle(cx, cy, R * 0.74, mid)
    parts.push(
      `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" `
      + `stroke="none" fill="currentColor">${t}</text>`,
    )
  })

  parts.push(`<circle cx="${cx}" cy="${cy}" r="2.5" fill="currentColor" stroke="none" />`)

  return { svg: OPEN(`0 0 ${W} ${H}`) + parts.join('') + `</svg>`, alt }
}

/**
 * A right-angled triangle with the right angle marked and the three sides
 * labelled.
 *
 * `unknown` decides which side is the one to find, and that is the whole
 * teaching point: the hypotenuse means ADD the squares, a shorter side means
 * SUBTRACT. `add_vs_subtract_squares` is the top coded trap on both tiers.
 */
export function rightTriangle(opts: {
  /** Labels as they appear on the paper, e.g. '8 cm' or 'x'. */
  base: string
  height: string
  hypotenuse: string
  /** Which one the question asks for — drawn the same, named in the alt text. */
  unknown: 'base' | 'height' | 'hypotenuse'
  alt: string
}): Figure {
  const { base, height, hypotenuse, alt } = opts
  const W = 280, H = 170
  // Right angle at the bottom left, hypotenuse rising to the right.
  const ax = 34, ay = 136       // right angle
  const bx = 240, by = 136      // along the base
  const cxx = 34, cyy = 28      // up the height

  const sq = 13 // the right-angle square, drawn inside the corner

  return {
    svg: OPEN(`0 0 ${W} ${H}`)
      + `<polygon points="${ax},${ay} ${bx},${by} ${cxx},${cyy}" />`
      + `<polyline points="${ax + sq},${ay} ${ax + sq},${ay - sq} ${ax},${ay - sq}" />`
      + `<text x="${(ax + bx) / 2}" y="${ay + 22}" text-anchor="middle" stroke="none" `
      + `fill="currentColor">${base}</text>`
      + `<text x="${ax - 10}" y="${(ay + cyy) / 2}" text-anchor="end" stroke="none" `
      + `fill="currentColor">${height}</text>`
      + `<text x="${(bx + cxx) / 2 + 16}" y="${(by + cyy) / 2 - 8}" text-anchor="middle" `
      + `stroke="none" fill="currentColor">${hypotenuse}</text>`
      + `</svg>`,
    alt,
  }
}

/**
 * A regular polygon with the interior angle marked at one vertex and, where
 * asked for, the exterior angle shown as the turn past the extended side.
 *
 * `interior_vs_exterior_angle` and `divide_360_to_get_the_interior_angle` are
 * the two traps that decide these questions, and neither survives seeing the
 * exterior angle sitting OUTSIDE the shape, between the side extended and the
 * next side.
 */
export function regularPolygon(opts: {
  sides: number
  mark: 'interior' | 'exterior' | 'both'
  alt: string
}): Figure {
  const { sides, mark, alt } = opts
  const W = 300, H = 210
  const cx = 112, cy = 100, R = 70

  // Vertex 0 at the right, going anticlockwise, so the extended side runs out
  // to the right of the shape where there is room to label it.
  const v = (i: number) => onCircle(cx, cy, R, (360 / sides) * i)
  const points = Array.from({ length: sides }, (_, i) => pt(v(i))).join(' ')

  const parts = [`<polygon points="${points}" />`]

  if (mark === 'interior' || mark === 'both') {
    const [x, y] = onCircle(cx, cy, R - 15, 0)
    parts.push(
      `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" stroke="none" `
      + `fill="currentColor">interior</text>`,
    )
  }

  if (mark === 'exterior' || mark === 'both') {
    // Extend the side arriving at vertex 0 (from vertex 1) out past it. The
    // exterior angle is the turn between that extension and the next side.
    const [x1, y1] = v(1)
    const [x0, y0] = v(0)
    const [xl, yl] = v(sides - 1)   // the other side meeting this vertex

    const unit = (dx: number, dy: number): [number, number] => {
      const len = Math.hypot(dx, dy) || 1
      return [dx / len, dy / len]
    }
    const [ux, uy] = unit(x0 - x1, y0 - y1)       // along the extension
    const ex = x0 + ux * 48, ey = y0 + uy * 48

    // The exterior angle is the turn BETWEEN the extension and the next side,
    // so the label goes on the bisector of those two directions. Placed beside
    // the extension it sat outside that angle entirely, naming the wrong region.
    const [vx, vy] = unit(xl - x0, yl - y0)        // along the next side
    const [bx, by] = unit(ux + vx, uy + vy)
    const lx = x0 + bx * 40, ly = y0 + by * 40

    parts.push(
      `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${ex.toFixed(1)}" `
      + `y2="${ey.toFixed(1)}" stroke-dasharray="4 3" />`,
    )
    parts.push(
      `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" stroke="none" `
      + `fill="currentColor">exterior</text>`,
    )
  }

  return { svg: OPEN(`0 0 ${W} ${H}`) + parts.join('') + `</svg>`, alt }
}

/**
 * A number line with a range marked between two boundaries.
 *
 * The single-boundary version covers "x > 1"; this covers "−3 < n ≤ 2", where
 * the whole point is that the two ends are treated DIFFERENTLY — one included,
 * one not. Showing both circles on one line is the only way that contrast is
 * visible rather than described.
 */
export function numberLineRange(opts: {
  from: number
  to: number
  lower: number
  lowerClosed: boolean
  upper: number
  upperClosed: boolean
  alt: string
}): Figure {
  const { from, to, lower, lowerClosed, upper, upperClosed, alt } = opts
  const W = 320, H = 54, PAD = 16
  const x = (n: number) => PAD + ((n - from) / (to - from)) * (W - 2 * PAD)
  const R = 5.5

  const ticks: string[] = []
  for (let n = from; n <= to; n++) {
    ticks.push(`<line x1="${x(n)}" y1="20" x2="${x(n)}" y2="28" />`)
    ticks.push(
      `<text x="${x(n)}" y="44" text-anchor="middle" stroke="none" fill="currentColor">${n}</text>`,
    )
  }

  // The band stops at each circle's edge, for the same reason the ray does in
  // numberLine: drawn through the middle it fills an open circle in and the
  // diagram then says the opposite of what it means.
  const band = `<line x1="${(x(lower) + R + 1).toFixed(1)}" y1="24" `
    + `x2="${(x(upper) - R - 1).toFixed(1)}" y2="24" stroke-width="3" />`

  const circle = (at: number, closed: boolean) =>
    `<circle cx="${x(at).toFixed(1)}" cy="24" r="${R}" fill="${closed ? 'currentColor' : 'none'}" />`

  return {
    svg: OPEN(`0 0 ${W} ${H}`)
      + `<line x1="${PAD}" y1="24" x2="${W - PAD}" y2="24" />`
      + ticks.join('')
      + band
      + circle(lower, lowerClosed)
      + circle(upper, upperClosed)
      + `</svg>`,
    alt,
  }
}

/**
 * A straight line drawn on a numbered grid — the form this skill is actually
 * set in.
 *
 * Every coded board sets "find the equation of the line" against a printed
 * grid, and the traps are things you can only do to a PICTURE:
 * `gradient_computed_upside_down`, `read_the_wrong_axis`,
 * `scale_in_the_wrong_direction`. A prose description of a line asks the
 * student to recognise something they cannot see.
 *
 * `unitsPerSquare` is the scale trap made drawable: a y-axis climbing in 2s
 * looks identical to one climbing in 1s until you read the numbers, and a
 * gradient counted in SQUARES rather than units is then wrong by a factor of
 * two. Default 1 on both axes.
 */
export function lineGraph(opts: {
  /** Axis range, in graph units. */
  xRange: [number, number]
  yRange: [number, number]
  /** y = mx + c, or a vertical line at x = k, which has no gradient. */
  line: { m: number; c: number } | { verticalAt: number }
  /** Points to ring. Labelled with their coordinates unless `label` says otherwise. */
  points?: { x: number; y: number; label?: string }[]
  /** The rise-and-run step between the first two points, as the gradient is read. */
  step?: boolean
  /** Graph units per ruled square. Set it where the question's grid is not 1. */
  unitsPerSquare?: { x: number; y: number }
  /** A name for the line itself, printed beside it — "L" on most papers. */
  lineLabel?: string
  alt: string
}): Figure {
  const { xRange, yRange, line, points = [], step, lineLabel, alt } = opts
  const per = opts.unitsPerSquare ?? { x: 1, y: 1 }
  const [xMin, xMax] = xRange
  const [yMin, yMax] = yRange

  // Squares are drawn SQUARE. A gradient read off a stretched grid looks like
  // a different gradient, which is the one thing this figure must not do, so
  // the cell size is chosen from the width and the height follows from it.
  const W = 320
  const PAD = { top: 10, right: 12, bottom: 26, left: 30 }
  const across = (xMax - xMin) / per.x
  const down = (yMax - yMin) / per.y
  const cell = (W - PAD.left - PAD.right) / across
  const plotH = cell * down
  const H = plotH + PAD.top + PAD.bottom

  const px = (v: number) => PAD.left + ((v - xMin) / per.x) * cell
  const py = (v: number) => PAD.top + plotH - ((v - yMin) / per.y) * cell
  const n = (v: number) => v.toFixed(1)

  const parts: string[] = []

  // The ruled squares, faint. At full strength they compete with the line,
  // and the line is the thing being read.
  for (let v = xMin; v <= xMax + 1e-9; v += per.x) {
    parts.push(`<line x1="${n(px(v))}" y1="${n(PAD.top)}" x2="${n(px(v))}" `
      + `y2="${n(PAD.top + plotH)}" stroke-opacity="0.18" />`)
  }
  for (let v = yMin; v <= yMax + 1e-9; v += per.y) {
    parts.push(`<line x1="${n(PAD.left)}" y1="${n(py(v))}" x2="${n(PAD.left + cell * across)}" `
      + `y2="${n(py(v))}" stroke-opacity="0.18" />`)
  }

  // The axes sit at zero when zero is on the grid, and on the edge when it is
  // not — the same choice the printed paper makes.
  const axisY = yMin <= 0 && 0 <= yMax ? py(0) : PAD.top + plotH
  const axisX = xMin <= 0 && 0 <= xMax ? px(0) : PAD.left
  parts.push(`<line x1="${n(PAD.left)}" y1="${n(axisY)}" x2="${n(PAD.left + cell * across)}" y2="${n(axisY)}" />`)
  parts.push(`<line x1="${n(axisX)}" y1="${n(PAD.top)}" x2="${n(axisX)}" y2="${n(PAD.top + plotH)}" />`)

  // Numerals. Zero is labelled once, at the origin, rather than on both axes.
  for (let v = xMin; v <= xMax + 1e-9; v += per.x) {
    if (v === 0 && yMin <= 0 && 0 <= yMax) continue
    parts.push(`<text x="${n(px(v))}" y="${n(axisY + 14)}" text-anchor="middle" `
      + `stroke="none" fill="currentColor" font-size="10">${v}</text>`)
  }
  for (let v = yMin; v <= yMax + 1e-9; v += per.y) {
    parts.push(`<text x="${n(axisX - 6)}" y="${n(py(v) + 3.5)}" text-anchor="end" `
      + `stroke="none" fill="currentColor" font-size="10">${v}</text>`)
  }
  parts.push(`<text x="${n(PAD.left + cell * across)}" y="${n(axisY - 6)}" text-anchor="end" `
    + `stroke="none" fill="currentColor" font-style="italic">x</text>`)
  parts.push(`<text x="${n(axisX + 6)}" y="${n(PAD.top + 9)}" stroke="none" `
    + `fill="currentColor" font-style="italic">y</text>`)

  // The line, clipped to the grid. Drawn heavier than the rules so it reads as
  // the subject rather than as one more grid line.
  let ends: [number, number, number, number]
  if ('verticalAt' in line) {
    ends = [line.verticalAt, yMin, line.verticalAt, yMax]
  } else {
    const { m, c } = line
    const at = (x: number) => m * x + c
    let [ax, ay] = [xMin, at(xMin)]
    let [bx, by] = [xMax, at(xMax)]
    // Where the line leaves the top or bottom of the grid, walk the end back
    // along the line to the edge instead of letting it overshoot the axes.
    if (m !== 0) {
      if (ay < yMin) { ax = (yMin - c) / m; ay = yMin } else if (ay > yMax) { ax = (yMax - c) / m; ay = yMax }
      if (by < yMin) { bx = (yMin - c) / m; by = yMin } else if (by > yMax) { bx = (yMax - c) / m; by = yMax }
    }
    ends = [ax, ay, bx, by]
  }
  parts.push(`<line x1="${n(px(ends[0]))}" y1="${n(py(ends[1]))}" x2="${n(px(ends[2]))}" `
    + `y2="${n(py(ends[3]))}" stroke-width="2.2" />`)

  if (lineLabel) {
    // Three quarters along the line, not at its end: a steep line leaves
    // through the TOP of the grid, and a label hung off that end is drawn
    // outside the viewBox and clipped away.
    const lx = px(ends[0]) + 0.75 * (px(ends[2]) - px(ends[0]))
    const ly = py(ends[1]) + 0.75 * (py(ends[3]) - py(ends[1]))
    parts.push(`<text x="${n(lx - 7)}" y="${n(ly - 7)}" text-anchor="end" `
      + `stroke="none" fill="currentColor" font-style="italic">${lineLabel}</text>`)
  }

  // The step between the two points: along, then up. Dashed, because it is
  // working the student adds, not part of the printed question.
  if (step && points.length >= 2) {
    const [a, b] = points
    const corner = { x: b.x, y: a.y }
    parts.push(`<path d="M ${n(px(a.x))},${n(py(a.y))} L ${n(px(corner.x))},${n(py(corner.y))} `
      + `L ${n(px(b.x))},${n(py(b.y))}" stroke-dasharray="4 3" />`)
    parts.push(`<text x="${n((px(a.x) + px(b.x)) / 2)}" y="${n(py(a.y) + (a.y <= b.y ? 13 : -6))}" `
      + `text-anchor="middle" stroke="none" fill="currentColor" font-size="10">`
      + `${b.x - a.x} across</text>`)
    parts.push(`<text x="${n(px(b.x) + 5)}" y="${n((py(a.y) + py(b.y)) / 2)}" `
      + `stroke="none" fill="currentColor" font-size="10">${Math.abs(b.y - a.y)} `
      + `${b.y >= a.y ? 'up' : 'down'}</text>`)
  }

  for (const pt of points) {
    parts.push(`<circle cx="${n(px(pt.x))}" cy="${n(py(pt.y))}" r="3" fill="currentColor" stroke="none" />`)
    const label = pt.label ?? `(${pt.x}, ${pt.y})`
    if (label) {
      // Above the point normally, below it when the point sits under the
      // x-axis — up there the label lands on the axis numerals.
      const dy = pt.y < 0 ? 14 : -7
      parts.push(`<text x="${n(px(pt.x) + 6)}" y="${n(py(pt.y) + dy)}" stroke="none" `
        + `fill="currentColor" font-size="10">${label}</text>`)
    }
  }

  return { svg: OPEN(`0 0 ${W} ${n(H)}`) + parts.join('') + `</svg>`, alt }
}

/** Text at a point, upright, in the figure's own colour. */
const label = (x: number, y: number, t: string, anchor: 'start' | 'middle' | 'end' = 'middle') =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" stroke="none" `
  + `fill="currentColor">${t}</text>`

/**
 * A straight-sided shape with its sides labelled — a rectangle, or the
 * L-shapes and steps that areas of rectangles are set on.
 *
 * Drawn to the proportions of the corners given, because on these questions
 * the SHAPE is the information: which sides to split along, and which length
 * is missing. `inner` is a rectangle cut out of the shape, and `shadeOuter`
 * shades what is left — the "find the shaded area" question, where the trap
 * is working out the area of the wrong region.
 */
export function rectilinear(opts: {
  /** Corners in the shape's own units, in order round the outline. */
  points: [number, number][]
  /** Label for the side running from corner i to corner i + 1. */
  sides?: Record<number, string>
  /** A rectangle inside the shape, with its own side labels. */
  inner?: { x: number; y: number; w: number; h: number; across?: string; down?: string }
  /** Shade the shape with the inner rectangle cut out of it. */
  shadeOuter?: boolean
  alt: string
}): Figure {
  const { points, sides = {}, inner, shadeOuter, alt } = opts
  const W = 300
  const PAD = 34
  const maxX = Math.max(...points.map(p => p[0]))
  const maxY = Math.max(...points.map(p => p[1]))
  const k = Math.min((W - 2 * PAD) / maxX, 160 / maxY)
  const H = maxY * k + 2 * PAD
  // y grows UP in the shape's units and DOWN on screen.
  const px = (x: number) => PAD + x * k
  const py = (y: number) => H - PAD - y * k
  const outline = points.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')

  const parts: string[] = []

  if (inner && shadeOuter) {
    // One path, two loops, even-odd fill: the inner rectangle becomes a hole
    // without needing a background colour to paint over it.
    const o = points.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')
    const [ix, iy, iw, ih] = [px(inner.x), py(inner.y + inner.h), inner.w * k, inner.h * k]
    parts.push(
      `<path d="${o} Z M${ix.toFixed(1)},${iy.toFixed(1)} h${iw.toFixed(1)} v${ih.toFixed(1)} `
      + `h${(-iw).toFixed(1)} Z" fill="currentColor" fill-opacity="0.16" fill-rule="evenodd" stroke="none" />`,
    )
  }

  parts.push(`<polygon points="${outline}" />`)

  // Side labels sit just outside the middle of each side. "Outside" comes
  // from the direction the outline is drawn in, not from the centre of the
  // shape: measured from the centre, the inside edges of an L's notch point
  // the wrong way and their labels land in the notch, on the shape.
  const area2 = points.reduce((s, [x, y], i) => {
    const [x2, y2] = points[(i + 1) % points.length]
    return s + x * y2 - x2 * y
  }, 0)
  const ccw = area2 > 0   // in the shape's own units, y up
  for (const [i, t] of Object.entries(sides)) {
    const a = points[Number(i)]
    const b = points[(Number(i) + 1) % points.length]
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
    // Going round anticlockwise the inside is on the left, so outside is the
    // right-hand normal (dy, −dx); clockwise, the other way.
    const sx = Math.sign(b[1] - a[1]) * (ccw ? 1 : -1)
    const sy = Math.sign(a[0] - b[0]) * (ccw ? 1 : -1)
    if (a[1] === b[1]) {
      // Horizontal: outside is below (sy < 0) or above, in the shape's y-up.
      parts.push(label(px(mx), py(my) + (sy < 0 ? 18 : -8), t))
    } else {
      parts.push(label(px(mx) + (sx > 0 ? 7 : -7), py(my) + 4, t, sx > 0 ? 'start' : 'end'))
    }
  }

  if (inner) {
    const x0 = px(inner.x), y0 = py(inner.y + inner.h)
    parts.push(
      `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${(inner.w * k).toFixed(1)}" `
      + `height="${(inner.h * k).toFixed(1)}" />`,
    )
    if (inner.across) parts.push(label(x0 + (inner.w * k) / 2, y0 + 15, inner.across))
    if (inner.down) parts.push(label(x0 + 6, y0 + (inner.h * k) / 2 + 4, inner.down, 'start'))
  }

  return { svg: OPEN(`0 0 ${W} ${H.toFixed(1)}`) + parts.join('') + `</svg>`, alt }
}

/**
 * A circle with its radius or its diameter drawn and labelled — or a
 * semicircle or quarter circle, which are set on the same skill.
 *
 * The labelled line is the whole point. `use_diameter_for_radius` is the trap
 * on both tiers, and the only defence is seeing which length you have been
 * given: a line from the centre to the edge, or one right across.
 */
export function circle(opts: {
  /** The length drawn: centre to edge, or edge to edge through the centre. */
  show: 'radius' | 'diameter'
  /** What the drawn length is labelled, e.g. '7 cm'. */
  label: string
  /** How much of the circle: all of it, half, or a quarter. Default 1. */
  part?: 1 | 0.5 | 0.25
  alt: string
}): Figure {
  const { show, part = 1, alt } = opts
  const W = 260
  const R = 70
  const parts: string[] = []
  let H: number, cx: number, cy: number

  if (part === 1) {
    H = 2 * R + 30; cx = W / 2; cy = R + 14
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${R}" />`)
  } else if (part === 0.5) {
    // Flat side at the bottom: the diameter IS an edge of the shape.
    H = R + 44; cx = W / 2; cy = R + 14
    parts.push(`<path d="M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy} Z" />`)
  } else {
    // The right angle at the bottom left, both straight sides radii.
    H = R + 44; cx = W / 2 - R / 2; cy = R + 14
    parts.push(`<path d="M${cx},${cy} L${cx + R},${cy} A${R},${R} 0 0 0 ${cx},${cy - R} Z" />`)
    parts.push(`<polyline points="${cx + 11},${cy} ${cx + 11},${cy - 11} ${cx},${cy - 11}" />`)
  }

  parts.push(`<circle cx="${cx}" cy="${cy}" r="2.5" fill="currentColor" stroke="none" />`)

  if (show === 'diameter') {
    // On a semicircle the diameter is already drawn as the flat edge.
    if (part === 1) parts.push(`<line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" />`)
    parts.push(label(cx, cy + (part === 1 ? -8 : 20), opts.label))
  } else if (part === 1) {
    parts.push(`<line x1="${cx}" y1="${cy}" x2="${cx + R}" y2="${cy}" />`)
    parts.push(label(cx + R / 2, cy - 8, opts.label))
  } else {
    // A semicircle or quarter's radius is its straight edge from the centre.
    parts.push(label(cx + R / 2, cy + 20, opts.label))
  }

  return { svg: OPEN(`0 0 ${W} ${H}`) + parts.join('') + `</svg>`, alt }
}

/**
 * A prism drawn the way the paper draws one: the cross-section face on, and
 * its length running back at an angle, hidden edges dashed.
 *
 * `assume_the_solid_is_a_full_cuboid` and `use_the_slant_edge_as_a_height`
 * are traps you can only fall into looking at a picture, so the triangular
 * prism shows BOTH the slanted edge and the dashed perpendicular height,
 * labelled, and leaves the student to pick.
 */
export function prism(opts: {
  kind: 'cuboid' | 'triangular' | 'cylinder'
  /**
   * cuboid: [across, up, back]. triangular: [base, perpendicular height,
   * slant edge, length]. cylinder: [radius, height].
   */
  labels: string[]
  alt: string
}): Figure {
  const { kind, labels, alt } = opts
  const W = 300
  const parts: string[] = []
  const dash = ' stroke-dasharray="4 3"'
  const line = (x1: number, y1: number, x2: number, y2: number, hidden = false) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${hidden ? dash : ''} />`

  if (kind === 'cylinder') {
    // Standing up: an ellipse on top, its back half of the base hidden.
    const cx = 130, top = 34, bot = 156, rx = 62, ry = 18
    const H = 196
    parts.push(`<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" />`)
    parts.push(`<path d="M${cx - rx},${bot} A${rx},${ry} 0 0 0 ${cx + rx},${bot}" />`)
    parts.push(`<path d="M${cx - rx},${bot} A${rx},${ry} 0 0 1 ${cx + rx},${bot}"${dash} />`)
    parts.push(line(cx - rx, top, cx - rx, bot), line(cx + rx, top, cx + rx, bot))
    parts.push(`<circle cx="${cx}" cy="${top}" r="2.5" fill="currentColor" stroke="none" />`)
    parts.push(line(cx, top, cx + rx, top))
    // Under the radius, inside the top face: above it the label sat on the rim.
    parts.push(label(cx + rx / 2, top + 13, labels[0] ?? ''))
    parts.push(label(cx + rx + 8, (top + bot) / 2 + 4, labels[1] ?? '', 'start'))
    return { svg: OPEN(`0 0 ${W} ${H}`) + parts.join('') + `</svg>`, alt }
  }

  // The length runs back and up to the right.
  const dx = 70, dy = -38
  const H = 200

  if (kind === 'cuboid') {
    // Room on the left for the height label, which ran off the edge at 30.
    const x0 = 50, y0 = 170, w = 150, h = 92
    // Front face, then the back face where it shows, then the joining edges.
    parts.push(`<rect x="${x0}" y="${y0 - h}" width="${w}" height="${h}" />`)
    parts.push(
      line(x0, y0 - h, x0 + dx, y0 - h + dy),
      line(x0 + w, y0 - h, x0 + w + dx, y0 - h + dy),
      line(x0 + w, y0, x0 + w + dx, y0 + dy),
      line(x0 + dx, y0 - h + dy, x0 + w + dx, y0 - h + dy),
      line(x0 + w + dx, y0 - h + dy, x0 + w + dx, y0 + dy),
      line(x0, y0, x0 + dx, y0 + dy, true),
      line(x0 + dx, y0 + dy, x0 + w + dx, y0 + dy, true),
      line(x0 + dx, y0 + dy, x0 + dx, y0 - h + dy, true),
    )
    parts.push(label(x0 + w / 2, y0 + 18, labels[0] ?? ''))
    parts.push(label(x0 - 7, y0 - h / 2 + 4, labels[1] ?? '', 'end'))
    parts.push(label(x0 + w + dx / 2 + 10, y0 + dy / 2 + 14, labels[2] ?? '', 'start'))
    return { svg: OPEN(`0 0 ${W} ${H}`) + parts.join('') + `</svg>`, alt }
  }

  // Triangular: an isosceles triangle face on, apex up. The perpendicular
  // height is drawn dashed down the middle, and one slanted side labelled, so
  // the figure carries both the length the student needs and the one they
  // are tempted by.
  //
  // No hidden edges on this one. They are dashed too, and the back corner of
  // the base falls exactly on the height line, so the two dashed systems
  // crossed at the one label the figure exists to show.
  const x0 = 30, y0 = 172, b = 140, h = 100
  const apex: [number, number] = [x0 + b / 2, y0 - h]
  parts.push(`<polygon points="${x0},${y0} ${x0 + b},${y0} ${apex[0]},${apex[1]}" />`)
  parts.push(
    line(apex[0], apex[1], apex[0] + dx, apex[1] + dy),
    line(x0 + b, y0, x0 + b + dx, y0 + dy),
    line(apex[0] + dx, apex[1] + dy, x0 + b + dx, y0 + dy),
    // The perpendicular height, with its right angle at the foot.
    line(apex[0], apex[1], apex[0], y0, true),
    `<polyline points="${apex[0]},${y0 - 9} ${apex[0] + 9},${y0 - 9} ${apex[0] + 9},${y0}" />`,
  )
  parts.push(label(x0 + b / 2, y0 + 18, labels[0] ?? ''))
  parts.push(label(apex[0] + 6, y0 - h / 2 + 10, labels[1] ?? '', 'start'))
  parts.push(label(x0 + b / 4 - 8, y0 - h / 2 - 2, labels[2] ?? '', 'end'))
  parts.push(label(x0 + b + dx / 2 + 10, y0 + dy / 2 + 14, labels[3] ?? '', 'start'))
  return { svg: OPEN(`0 0 ${W} ${H}`) + parts.join('') + `</svg>`, alt }
}
