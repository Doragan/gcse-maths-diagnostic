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
const OPEN = (viewBox: string) =>
  `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" fill="none" `
  + `stroke="currentColor" stroke-width="1.5" font-size="12" font-family="inherit">`

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

  // Each label sits on the bisector of its own sector, close enough to the
  // vertex to be unambiguous about which angle it names.
  labels.forEach((t, i) => {
    const mid = (edges[i] + edges[i + 1]) / 2
    const [x, y] = onCircle(cx, cy, R * 0.58, mid)
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
    const [x, y] = onCircle(cx, cy, R - 26, 0)
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
