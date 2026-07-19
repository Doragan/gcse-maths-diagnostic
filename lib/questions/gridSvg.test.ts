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
})
