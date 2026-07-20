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
  return { W, H, cols, rows, px, py, snap, snapCell }
}

/** Format an axis tick value without float noise (0.30000000000000004 → 0.3). */
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

  // Axes: the zero lines when 0 is in range, else the min edges.
  const axisX = x.min <= 0 && 0 <= x.max ? geo.px(0) : PAD.left
  const axisY = y.min <= 0 && 0 <= y.max ? geo.py(0) : PAD.top + geo.rows * CELL
  parts.push(`<line x1="${axisX}" y1="${PAD.top}" x2="${axisX}" y2="${PAD.top + geo.rows * CELL}" stroke="${colors.textSecondary}" stroke-width="1.5"/>`)
  parts.push(`<line x1="${PAD.left}" y1="${axisY}" x2="${PAD.left + geo.cols * CELL}" y2="${axisY}" stroke="${colors.textSecondary}" stroke-width="1.5"/>`)

  // Tick numerals — x below the x-axis line, y left of the y-axis line.
  for (let c = 0; c <= geo.cols; c++) {
    const v = x.min + c * x.step
    parts.push(`<text x="${PAD.left + c * CELL}" y="${PAD.top + geo.rows * CELL + 14}" text-anchor="middle" font-size="10" fill="${colors.textHint}">${tick(v)}</text>`)
  }
  for (let r = 0; r <= geo.rows; r++) {
    const v = y.min + r * y.step
    parts.push(`<text x="${PAD.left - 6}" y="${geo.py(v) + 3.5}" text-anchor="end" font-size="10" fill="${colors.textHint}">${tick(v)}</text>`)
  }

  // Axis labels
  if (x.label) parts.push(`<text x="${PAD.left + (geo.cols * CELL) / 2}" y="${PAD.top + geo.rows * CELL + 28}" text-anchor="middle" font-size="10" fill="${colors.textSecondary}">${x.label}</text>`)
  if (y.label) parts.push(`<text x="${12}" y="${PAD.top + (geo.rows * CELL) / 2}" text-anchor="middle" font-size="10" fill="${colors.textSecondary}" transform="rotate(-90 12 ${PAD.top + (geo.rows * CELL) / 2})">${y.label}</text>`)

  // Author background, drawn in axis coordinates (flip transform mirrors
  // text — v1 rule: paths/shapes only).
  if (grid.background) {
    const sx = CELL / x.step
    const sy = CELL / y.step
    parts.push(
      `<g transform="translate(${PAD.left} ${PAD.top + geo.rows * CELL}) scale(${sx} ${-sy}) translate(${-x.min} ${-y.min})" fill="none" stroke-width="${2 / Math.max(sx, sy)}">${grid.background}</g>`,
    )
  }

  return parts.join('')
}

/**
 * A layer of placed points (student or ghosted canonical), joined per mode:
 * points = markers only; polyline = joined in placement order; line = the
 * full line through the first two points, clipped to the plot rectangle.
 */
export function buildPointsLayer(
  points: GridPoint[],
  geo: GridGeometry,
  opts: { color: string; ghost?: boolean; mode: string; markers?: boolean },
): string {
  if (points.length === 0) return ''
  const { color, ghost, mode, markers = true } = opts
  const parts: string[] = []
  const op = ghost ? ' opacity="0.55"' : ''
  const dash = ghost ? ' stroke-dasharray="6 4"' : ''

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

/** Complete standalone SVG — what the harness rasterises for the eyeball pass. */
export function buildGridSvg(
  grid: RenderedGrid,
  opts: { student?: GridPoint[]; showCanonical?: boolean } = {},
): string {
  const geo = gridGeometry(grid.x, grid.y)
  const frame = buildGridFrame(grid, geo)
  const canonical = opts.showCanonical
    ? buildPointsLayer(grid.elements.map(e => ({ x: e.x, y: e.y })), geo, { color: colors.success, ghost: true, mode: grid.mode })
    : ''
  const student = opts.student?.length
    ? buildPointsLayer(opts.student, geo, { color: colors.primary, mode: grid.mode })
    : ''
  return `<svg viewBox="0 0 ${geo.W} ${geo.H}" xmlns="http://www.w3.org/2000/svg" width="${geo.W}" height="${geo.H}"><rect width="${geo.W}" height="${geo.H}" fill="#ffffff"/>${frame}${canonical}${student}</svg>`
}
