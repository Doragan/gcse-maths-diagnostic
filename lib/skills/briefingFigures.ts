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
