/**
 * Shared grid-SVG geometry and markup builders. Isomorphic — no React, no
 * DOM — so the SAME code draws the student-facing canvas frame
 * (components/practice/GridCanvas.tsx), the admin preview, and the
 * verification harness's rasterised eyeball PNGs. What the harness verifies
 * is pixel-identical to what the student sees.
 *
 * Coordinate spaces:
 *   axis space   — the question's units (e.g. x 0..4, y 0..12)
 *   viewBox space — fixed SVG units; CELL viewBox units per grid step
 * The SVG renders `viewBox="0 0 W H" width="100%"`, so CSS px scale linearly;
 * pointer input converts clientX/Y → viewBox via a getBoundingClientRect
 * ratio (aspect is preserved, so one ratio per axis is exact).
 */

import { colors } from '../styles'
import type { RenderedAxis, RenderedGrid, GridPoint } from './gridDraw'

export const CELL = 28 // viewBox units per grid step
export const PAD = { top: 14, right: 16, bottom: 34, left: 40 } // room for ticks + labels

export type GridGeometry = {
  W: number
  H: number
  cols: number
  rows: number
  px: (gx: number) => number // axis-x → viewBox x
  py: (gy: number) => number // axis-y → viewBox y (flipped: y grows upward)
  snap: (vx: number, vy: number) => GridPoint | null // viewBox → nearest lattice point
  // viewBox → the CONTAINING cell's bottom-left corner (floor, not round);
  // null outside the plot. Used by cells mode, where an element is a cell.
  snapCell: (vx: number, vy: number) => GridPoint | null
  // bars: viewBox → { x: the containing SLOT's left edge, y: the snapped
  // height }. Slots come from the canonical bars, so this takes them.
  snapBar: (vx: number, vy: number, slots: { x: number; x2?: number }[]) => GridPoint | null
  // viewBox → the nearest x position on the lattice, ignoring vy ENTIRELY.
  // Used by number_line (a 1-D input on a strip only ~14 units tall, where
  // demanding vertical precision would make it unusable) and by the second tap
  // of a bars_free bar, which sets only the far edge — ignoring vy there is
  // what makes that tap forgiving.
  snapLine: (vx: number) => GridPoint | null
}

export function gridGeometry(x: RenderedAxis, y: RenderedAxis): GridGeometry {
  const cols = Math.round((x.max - x.min) / x.step)
  const rows = Math.round((y.max - y.min) / y.step)
  const W = PAD.left + cols * CELL + PAD.right
  const H = PAD.top + rows * CELL + PAD.bottom
  const px = (gx: number) => PAD.left + ((gx - x.min) / x.step) * CELL
  const py = (gy: number) => PAD.top + rows * CELL - ((gy - y.min) / y.step) * CELL
  const snap = (vx: number, vy: number): GridPoint | null => {
    const ci = Math.round((vx - PAD.left) / CELL)
    const ri = Math.round((PAD.top + rows * CELL - vy) / CELL)
    // Reject taps more than half a cell outside the plot rectangle.
    if (vx < PAD.left - CELL / 2 || vx > PAD.left + cols * CELL + CELL / 2) return null
    if (vy < PAD.top - CELL / 2 || vy > PAD.top + rows * CELL + CELL / 2) return null
    const cc = Math.min(Math.max(ci, 0), cols)
    const rc = Math.min(Math.max(ri, 0), rows)
    return { x: x.min + cc * x.step, y: y.min + rc * y.step }
  }
  const snapCell = (vx: number, vy: number): GridPoint | null => {
    // Strictly inside the plot only — a cell is tapped by touching its area.
    if (vx < PAD.left || vx > PAD.left + cols * CELL) return null
    if (vy < PAD.top || vy > PAD.top + rows * CELL) return null
    const ci = Math.min(Math.floor((vx - PAD.left) / CELL), cols - 1)
    const ri = Math.min(Math.floor((PAD.top + rows * CELL - vy) / CELL), rows - 1)
    return { x: x.min + ci * x.step, y: y.min + ri * y.step }
  }
  const snapBar = (vx: number, vy: number, slots: { x: number; x2?: number }[]): GridPoint | null => {
    if (vx < PAD.left || vx > PAD.left + cols * CELL) return null
    if (vy < PAD.top || vy > PAD.top + rows * CELL) return null
    // Which declared bar slot does this x fall inside?
    const gx = x.min + ((vx - PAD.left) / CELL) * x.step
    const slot = slots.find(s => gx >= s.x - 1e-9 && gx < (s.x2 ?? s.x + x.step) - 1e-9)
    if (!slot) return null
    // Height snaps to the y lattice, clamped into the grid.
    const ri = Math.round((PAD.top + rows * CELL - vy) / CELL)
    const height = y.min + Math.min(Math.max(ri, 0), rows) * y.step
    return { x: slot.x, y: height }
  }
  const snapLine = (vx: number): GridPoint | null => {
    if (vx < PAD.left - CELL / 2 || vx > PAD.left + cols * CELL + CELL / 2) return null
    const ci = Math.min(Math.max(Math.round((vx - PAD.left) / CELL), 0), cols)
    return { x: x.min + ci * x.step, y: y.min }
  }
  return { W, H, cols, rows, px, py, snap, snapCell, snapBar, snapLine }
}

/** Format an axis tick value without float noise (0.30000000000000004 → 0.3). */
/**
 * Escape author text before it goes into SVG markup. Category names and axis
 * labels are free text, and an "&" or "<" would otherwise produce invalid XML
 * that silently breaks the whole diagram.
 */
function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function tick(v: number): string {
  return String(Math.round(v * 1e6) / 1e6)
}

/**
 * The static frame: gridlines, axes, tick numerals, axis labels, and the
 * author-supplied background fragment (axis coordinates; paths/shapes only —
 * the flip transform mirrors text).
 */
export function buildGridFrame(grid: RenderedGrid, geo: GridGeometry): string {
  const { x, y } = grid
  const parts: string[] = []

  // Gridlines
  for (let c = 0; c <= geo.cols; c++) {
    const vx = PAD.left + c * CELL
    parts.push(`<line x1="${vx}" y1="${PAD.top}" x2="${vx}" y2="${PAD.top + geo.rows * CELL}" stroke="${colors.border}" stroke-width="1"/>`)
  }
  for (let r = 0; r <= geo.rows; r++) {
    const vy = PAD.top + r * CELL
    parts.push(`<line x1="${PAD.left}" y1="${vy}" x2="${PAD.left + geo.cols * CELL}" y2="${vy}" stroke="${colors.border}" stroke-width="1"/>`)
  }

  // Axes: the zero lines when 0 is in range, else the min edges. A 1-D grid
  // (a number line) has no vertical extent, so it gets no y-axis furniture —
  // a stray vertical line and a lone "0" tick would just be noise.
  const oneDimensional = geo.rows === 0
  const axisX = x.min <= 0 && 0 <= x.max ? geo.px(0) : PAD.left
  const axisY = y.min <= 0 && 0 <= y.max ? geo.py(0) : PAD.top + geo.rows * CELL

  // showAxes: false keeps the SQUARES and drops the furniture. A grid to shade
  // or a figure drawn on squares needs the ruling to count by; numbering its
  // edges 0…6 is a coordinate system the question never asked for, and the
  // exam's own version of such a grid has none.
  if (grid.showAxes !== false) {
  if (!oneDimensional) {
    parts.push(`<line x1="${axisX}" y1="${PAD.top}" x2="${axisX}" y2="${PAD.top + geo.rows * CELL}" stroke="${colors.textSecondary}" stroke-width="1.5"/>`)
  }
  parts.push(`<line x1="${PAD.left}" y1="${axisY}" x2="${PAD.left + geo.cols * CELL}" y2="${axisY}" stroke="${colors.textSecondary}" stroke-width="1.5"/>`)

  /**
   * Tick numerals — x below the x-axis line, y left of the y-axis line.
   *
   * A CATEGORICAL x-axis replaces them: bars occupy the space between
   * gridlines, so a numeral sitting on a gridline names a boundary rather than
   * a bar, and four bars under "0 1 2 3 4" read as an off-by-one. Category
   * names go under the middle of their own bar instead.
   */
  const categories = x.categories ?? []
  if (categories.length > 0) {
    // Bars are one x-step wide on a categorical axis, so category i spans
    // [min + i·step, min + (i+1)·step] and its centre is half a step in.
    categories.forEach((name, i) => {
      const cx = PAD.left + (i + 0.5) * CELL
      parts.push(`<text x="${cx}" y="${PAD.top + geo.rows * CELL + 15}" text-anchor="middle" font-size="10" fill="${colors.textSecondary}">${escXml(name)}</text>`)
    })
  } else {
    for (let c = 0; c <= geo.cols; c++) {
      const v = x.min + c * x.step
      parts.push(`<text x="${PAD.left + c * CELL}" y="${PAD.top + geo.rows * CELL + 14}" text-anchor="middle" font-size="10" fill="${colors.textHint}">${tick(v)}</text>`)
    }
  }
  // A 1-D grid has a single y value, so its lone tick would read as a mystery
  // label floating beside the number line.
  if (!oneDimensional) {
    for (let r = 0; r <= geo.rows; r++) {
      const v = y.min + r * y.step
      parts.push(`<text x="${PAD.left - 6}" y="${geo.py(v) + 3.5}" text-anchor="end" font-size="10" fill="${colors.textHint}">${tick(v)}</text>`)
    }
  }

  // Axis labels
  if (x.label) parts.push(`<text x="${PAD.left + (geo.cols * CELL) / 2}" y="${PAD.top + geo.rows * CELL + 28}" text-anchor="middle" font-size="10" fill="${colors.textSecondary}">${escXml(x.label)}</text>`)
  if (y.label) parts.push(`<text x="${12}" y="${PAD.top + (geo.rows * CELL) / 2}" text-anchor="middle" font-size="10" fill="${colors.textSecondary}" transform="rotate(-90 12 ${PAD.top + (geo.rows * CELL) / 2})">${escXml(y.label)}</text>`)
  } // end showAxes

  // bars: make the columns VISIBLE. The author declares the slots and a tap
  // sets the containing slot's height, but on a plain grid every column looks
  // identical, so the student cannot tell which one a click will land in
  // without clicking to find out. These boundary lines are the fix.
  // bars_free deliberately gets none — there the student defines the edges, so
  // drawn boundaries would be handing them the answer.
  if (grid.mode === 'bars') {
    const bottom = PAD.top + geo.rows * CELL
    const edges = new Set<number>()
    for (const el of grid.elements) {
      edges.add(el.x)
      edges.add(el.x2 ?? el.x + x.step)
    }
    for (const e of edges) {
      parts.push(`<line x1="${geo.px(e)}" y1="${PAD.top}" x2="${geo.px(e)}" y2="${bottom}" stroke="${colors.textHint}" stroke-width="1.5" stroke-dasharray="4 3"/>`)
    }
  }

  // Author background, drawn in axis coordinates (flip transform mirrors
  // text — v1 rule: paths/shapes only).
  if (grid.background) parts.push(axisCoordGroup(grid.background, grid, geo))

  return parts.join('')
}

/**
 * Wrap an author SVG fragment so its coordinates are read in AXIS units:
 * translate to the plot's bottom-left origin, scale by cells-per-step, and
 * flip Y (grids grow upward). Used for both the background and the solution
 * overlay. Paths/shapes only — the flip mirrors any text.
 */
export function axisCoordGroup(fragment: string, grid: RenderedGrid, geo: GridGeometry): string {
  const sx = CELL / grid.x.step
  const sy = CELL / grid.y.step
  return `<g transform="translate(${PAD.left} ${PAD.top + geo.rows * CELL}) scale(${sx} ${-sy}) translate(${-grid.x.min} ${-grid.y.min})" fill="none" stroke-width="${2 / Math.max(sx, sy)}">${fragment}</g>`
}

/** The method overlay, drawn only on the answer reveal. '' when none. */
export function buildSolutionLayer(grid: RenderedGrid, geo: GridGeometry): string {
  return grid.solution ? axisCoordGroup(grid.solution, grid, geo) : ''
}

/**
 * Author labels, positioned in AXIS units but drawn upright.
 *
 * Deliberately NOT inside axisCoordGroup — that group flips Y, which mirrors
 * text. These go through geo.px/geo.py into plain viewBox space, exactly as
 * the tick numerals do, which is why they read the right way round.
 *
 * Drawn LAST by buildGridSvg, so a label naming a vertex sits over the shape
 * rather than under it.
 */
export function buildLabelsLayer(grid: RenderedGrid, geo: GridGeometry): string {
  if (!grid.labels?.length) return ''
  return grid.labels
    .map(l =>
      `<text x="${geo.px(l.x) + (l.dx ?? 0)}" y="${geo.py(l.y) + (l.dy ?? 0)}" ` +
      `text-anchor="middle" font-size="11" fill="${colors.textPrimary}">${escXml(l.text)}</text>`)
    .join('')
}

/**
 * A layer of placed points (student or ghosted canonical), joined per mode:
 * points = markers only; polyline = joined in placement order; line = the
 * full line through the first two points, clipped to the plot rectangle.
 */
export function buildPointsLayer(
  points: GridPoint[],
  geo: GridGeometry,
  opts: {
    color: string; ghost?: boolean; mode: string; markers?: boolean
    // bars: the declared slots, so each height can be drawn at its own width.
    slots?: { x: number; x2?: number }[]
    // bars/number_line need the axis to find the baseline and the plot edges.
    axes?: { x: RenderedAxis; y: RenderedAxis }
  },
): string {
  if (points.length === 0) return ''
  const { color, ghost, mode, markers = true, slots = [], axes } = opts
  const parts: string[] = []
  const op = ghost ? ' opacity="0.55"' : ''
  const dash = ghost ? ' stroke-dasharray="6 4"' : ''

  if (mode === 'bars' || mode === 'bars_free') {
    // Each point is a bar rising from the baseline (the y-axis minimum), with
    // y its height. The two modes differ only in where the WIDTH comes from:
    // `bars` looks the slot up from the author's declared elements, whereas in
    // `bars_free` the student chose both edges, so they travel on the point.
    const baseline = axes ? geo.py(axes.y.min) : geo.py(0)
    for (const p of points) {
      let leftAxis: number, rightAxis: number
      if (mode === 'bars_free') {
        // A half-drawn bar (one corner tapped, no width yet) is not a bar —
        // GridCanvas draws that as an in-progress guide instead.
        if (p.x2 == null) continue
        leftAxis = Math.min(p.x, p.x2)
        rightAxis = Math.max(p.x, p.x2)
      } else {
        leftAxis = p.x
        rightAxis = slots.find(s => Math.abs(s.x - p.x) < 1e-9)?.x2 ?? (axes ? p.x + axes.x.step : p.x + 1)
      }
      const left = geo.px(leftAxis)
      const top = geo.py(p.y)
      parts.push(ghost
        ? `<rect x="${left}" y="${Math.min(top, baseline)}" width="${geo.px(rightAxis) - left}" height="${Math.abs(baseline - top)}" fill="none" stroke="${color}" stroke-width="2"${dash}${op}/>`
        : `<rect x="${left}" y="${Math.min(top, baseline)}" width="${geo.px(rightAxis) - left}" height="${Math.abs(baseline - top)}" fill="${color}" fill-opacity="0.45" stroke="${color}" stroke-width="1.5"/>`)
    }
    return parts.join('')
  }

  if (mode === 'number_line') {
    const axisY = geo.py(axes ? axes.y.min : 0)
    const left = PAD.left
    const right = PAD.left + geo.cols * CELL
    for (const p of points) {
      const cx = geo.px(p.x)
      // The ray runs to the plot edge with an arrowhead, so "greater than"
      // reads at a glance.
      if (p.dir === 'left' || p.dir === 'right') {
        const end = p.dir === 'right' ? right : left
        const tipDir = p.dir === 'right' ? -1 : 1
        parts.push(`<line x1="${cx}" y1="${axisY}" x2="${end}" y2="${axisY}" stroke="${color}" stroke-width="2.5"${op}${dash}/>`)
        parts.push(`<path d="M ${end} ${axisY} L ${end + tipDir * 8} ${axisY - 5} L ${end + tipDir * 8} ${axisY + 5} Z" fill="${color}"${op}/>`)
      }
      // Hollow = "not included" (strict inequality); solid = included.
      const open = (p.style ?? 'closed') === 'open'
      parts.push(`<circle cx="${cx}" cy="${axisY}" r="6" fill="${open ? '#ffffff' : color}" stroke="${color}" stroke-width="2.5"${op}/>`)
    }
    return parts.join('')
  }

  if (mode === 'cells') {
    // A point is a cell's bottom-left corner in axis units; one grid step is
    // exactly CELL viewBox units by construction. Ghost = dashed outline only
    // (the "which squares" reveal); student = filled. No corner markers.
    for (const p of points) {
      const rx = geo.px(p.x)
      const ry = geo.py(p.y) // bottom edge in viewBox — rect grows upward
      parts.push(ghost
        ? `<rect x="${rx}" y="${ry - CELL}" width="${CELL}" height="${CELL}" fill="none" stroke="${color}" stroke-width="2"${dash}${op}/>`
        : `<rect x="${rx}" y="${ry - CELL}" width="${CELL}" height="${CELL}" fill="${color}" fill-opacity="0.45" stroke="${color}" stroke-width="1.5"/>`)
    }
    return parts.join('')
  }

  if (mode === 'polygon' && points.length >= 2) {
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${geo.px(p.x)} ${geo.py(p.y)}`).join(' ') + (points.length >= 3 ? ' Z' : '')
    parts.push(`<path d="${d}" fill="${color}" fill-opacity="${ghost ? 0 : 0.15}" stroke="${color}" stroke-width="2" stroke-linejoin="round"${op}${dash}/>`)
  }

  if (mode === 'polyline' && points.length >= 2) {
    const d = points.map(p => `${geo.px(p.x)},${geo.py(p.y)}`).join(' ')
    parts.push(`<polyline points="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"${op}${dash}/>`)
  }

  if (mode === 'line' && points.length >= 2) {
    // Extend the segment through the two points to the plot bounds.
    const [a, b] = points
    const x1 = geo.px(a.x), y1 = geo.py(a.y), x2 = geo.px(b.x), y2 = geo.py(b.y)
    const left = PAD.left, right = PAD.left + geo.cols * CELL
    const top = PAD.top, bottom = PAD.top + geo.rows * CELL
    let seg: [number, number, number, number]
    if (Math.abs(x2 - x1) < 1e-9) {
      seg = [x1, top, x1, bottom]
    } else {
      const m = (y2 - y1) / (x2 - x1)
      const yAt = (vx: number) => y1 + m * (vx - x1)
      seg = [left, yAt(left), right, yAt(right)]
    }
    const clip = `grid-clip-${Math.abs(Math.round(seg[1] + seg[3]))}`
    parts.push(
      `<clipPath id="${clip}"><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}"/></clipPath>` +
      `<line x1="${seg[0]}" y1="${seg[1]}" x2="${seg[2]}" y2="${seg[3]}" stroke="${color}" stroke-width="2" clip-path="url(#${clip})"${op}${dash}/>`,
    )
  }

  if (markers) {
    for (const p of points) {
      parts.push(`<circle cx="${geo.px(p.x)}" cy="${geo.py(p.y)}" r="5" fill="${color}" stroke="#ffffff" stroke-width="1.5"${op}/>`)
    }
  }
  return parts.join('')
}

/**
 * Canonical element → the GridPoint the ghost layer draws. In bars_free the
 * ghost must carry the author's edges, since that mode reads the width off the
 * point rather than looking a slot up; style/dir ride along the same way.
 */
export function toGhostPoint(grid: RenderedGrid): (e: RenderedGrid['elements'][number]) => GridPoint {
  return e => ({
    x: e.x,
    y: e.y,
    ...(grid.mode === 'bars_free' ? { x2: e.x2 ?? e.x + grid.x.step } : {}),
    ...(e.style ? { style: e.style } : {}),
    ...(e.dir ? { dir: e.dir } : {}),
  })
}

/** Complete standalone SVG — what the harness rasterises for the eyeball pass. */
export function buildGridSvg(
  grid: RenderedGrid,
  opts: { student?: GridPoint[]; showCanonical?: boolean } = {},
): string {
  const geo = gridGeometry(grid.x, grid.y)
  const frame = buildGridFrame(grid, geo)
  // The method overlay reveals alongside the correct answer.
  const solution = opts.showCanonical ? buildSolutionLayer(grid, geo) : ''
  // bars need their slot widths; number_line markers carry style/dir; both
  // need the axes to find the baseline and plot edges.
  const extra = { slots: grid.elements, axes: { x: grid.x, y: grid.y } }
  const canonical = opts.showCanonical
    ? buildPointsLayer(grid.elements.map(toGhostPoint(grid)),
        geo, { color: colors.success, ghost: true, mode: grid.mode, ...extra })
    : ''
  const student = opts.student?.length
    ? buildPointsLayer(opts.student, geo, { color: colors.primary, mode: grid.mode, ...extra })
    : ''
  // Labels last: a vertex name belongs over its shape, not under it.
  const labels = buildLabelsLayer(grid, geo)
  return `<svg viewBox="0 0 ${geo.W} ${geo.H}" xmlns="http://www.w3.org/2000/svg" width="${geo.W}" height="${geo.H}"><rect width="${geo.W}" height="${geo.H}" fill="#ffffff"/>${frame}${solution}${canonical}${student}${labels}</svg>`
}
