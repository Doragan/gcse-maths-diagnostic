import { describe, it, expect } from 'vitest'
import { gridGeometry, buildGridSvg, CELL, PAD } from './gridSvg'
import type { RenderedAxis, RenderedGrid } from './gridDraw'

const ax = (min: number, max: number, step = 1, label = ''): RenderedAxis => ({ min, max, step, label })

describe('gridGeometry', () => {
  const geo = gridGeometry(ax(0, 4), ax(0, 12))

  it('sizes the viewBox from cols/rows', () => {
    expect(geo.cols).toBe(4)
    expect(geo.rows).toBe(12)
    expect(geo.W).toBe(PAD.left + 4 * CELL + PAD.right)
    expect(geo.H).toBe(PAD.top + 12 * CELL + PAD.bottom)
  })

  it('px/py round-trip through snap', () => {
    // The viewBox position of (2, 5) must snap back to (2, 5).
    expect(geo.snap(geo.px(2), geo.py(5))).toEqual({ x: 2, y: 5 })
    // Origin and far corner too.
    expect(geo.snap(geo.px(0), geo.py(0))).toEqual({ x: 0, y: 0 })
    expect(geo.snap(geo.px(4), geo.py(12))).toEqual({ x: 4, y: 12 })
  })

  it('snap picks the NEAREST lattice point from an off-lattice tap', () => {
    expect(geo.snap(geo.px(2) + CELL * 0.4, geo.py(5))).toEqual({ x: 2, y: 5 })
    expect(geo.snap(geo.px(2) + CELL * 0.6, geo.py(5))).toEqual({ x: 3, y: 5 })
  })

  it('snap clamps just-outside taps and nulls far-outside taps', () => {
    // Slightly left of the plot → clamps to x=0.
    expect(geo.snap(PAD.left - CELL * 0.4, geo.py(3))).toEqual({ x: 0, y: 3 })
    // More than half a cell outside → null.
    expect(geo.snap(PAD.left - CELL, geo.py(3))).toBeNull()
    expect(geo.snap(geo.px(2), PAD.top - CELL)).toBeNull()
  })

  it('respects non-unit steps', () => {
    const g2 = gridGeometry(ax(0, 8, 2), ax(0, 20, 5))
    expect(g2.cols).toBe(4)
    expect(g2.rows).toBe(4)
    expect(g2.snap(g2.px(6), g2.py(15))).toEqual({ x: 6, y: 15 })
  })

  it('snapCell floors to the containing cell, not the nearest lattice point', () => {
    // A tap at 0.7 across cell (2,5) belongs to cell (2,5), even though the
    // nearest lattice point is (3,5).
    expect(geo.snapCell(geo.px(2) + CELL * 0.7, geo.py(5) - CELL * 0.3)).toEqual({ x: 2, y: 5 })
  })

  it('snapCell handles edge cells and is null outside the plot', () => {
    // Just inside the far corner → the last cell (3, 11).
    expect(geo.snapCell(geo.px(4) - 1, geo.py(12) + 1)).toEqual({ x: 3, y: 11 })
    // On the right edge exactly, just BELOW the y=6 gridline → clamped into
    // the last column, cell beneath the line.
    expect(geo.snapCell(geo.px(4), geo.py(6) + 2)).toEqual({ x: 3, y: 5 })
    // Outside → null (no half-cell grace for cells).
    expect(geo.snapCell(PAD.left - 2, geo.py(5))).toBeNull()
    expect(geo.snapCell(geo.px(2), PAD.top - 2)).toBeNull()
  })
})

describe('buildGridSvg', () => {
  const grid: RenderedGrid = {
    mode: 'line',
    x: ax(0, 4, 1, 'x'),
    y: ax(0, 12, 1, 'y'),
    background: '',
    elements: [{ x: 0, y: 3, marks: 1 }, { x: 4, y: 11, marks: 1 }],
    tolerance: 0,
  }

  it('produces a standalone SVG with gridlines, ticks and labels', () => {
    const svg = buildGridSvg(grid)
    expect(svg).toMatch(/^<svg viewBox="0 0 \d+ \d+"/)
    expect(svg).toContain('<line') // gridlines
    expect(svg).toContain('>4<') // an x tick numeral
    expect(svg).toContain('>12<') // a y tick numeral
  })

  it('draws the canonical ghost only when asked', () => {
    expect(buildGridSvg(grid)).not.toContain('circle')
    const withGhost = buildGridSvg(grid, { showCanonical: true })
    expect(withGhost).toContain('circle')
    expect(withGhost).toContain('stroke-dasharray') // ghosted line
  })

  it('draws student points on top', () => {
    const svg = buildGridSvg(grid, { student: [{ x: 1, y: 5 }, { x: 3, y: 9 }] })
    expect((svg.match(/circle/g) ?? []).length).toBe(2)
  })

  it('cells mode renders rects (no markers); ghost cells are dashed outlines', () => {
    const cellsGrid = { ...grid, mode: 'cells', elements: [{ x: 1, y: 2, marks: 1 }, { x: 3, y: 4, marks: 1 }] }
    const student = buildGridSvg(cellsGrid, { student: [{ x: 1, y: 2 }] })
    expect(student).toContain('fill-opacity="0.45"')
    expect(student).not.toContain('circle')
    const ghost = buildGridSvg(cellsGrid, { showCanonical: true })
    expect((ghost.match(/stroke-dasharray/g) ?? []).length).toBe(2)
    expect(ghost).toContain('fill="none"')
  })

  it('polygon mode renders a closed path with vertex markers', () => {
    const polyGrid = { ...grid, mode: 'polygon', elements: [{ x: 1, y: 1, marks: 1 }, { x: 3, y: 1, marks: 1 }, { x: 1, y: 4, marks: 1 }] }
    const svg = buildGridSvg(polyGrid, { student: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 4 }] })
    expect(svg).toMatch(/<path d="M [\d. ]+L [\d. ]+L [\d. ]+ Z"/)
    expect((svg.match(/circle/g) ?? []).length).toBe(3)
  })

  it('solution overlay renders ONLY on the answer reveal', () => {
    const withSolution: RenderedGrid = { ...grid, solution: '<line x1="0" y1="0" x2="4" y2="8" stroke="#94a3b8"/>' }
    // Not revealed → the working stays hidden.
    expect(buildGridSvg(withSolution)).not.toContain('#94a3b8')
    // Revealed with the answer → the working shows, wrapped in the axis transform.
    const revealed = buildGridSvg(withSolution, { showCanonical: true })
    expect(revealed).toContain('#94a3b8')
    expect(revealed).toContain('scale(') // axis-coordinate group
  })
})
