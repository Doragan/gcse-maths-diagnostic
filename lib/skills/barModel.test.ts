import { describe, it, expect } from 'vitest'
import { barModelGrid, labelHalfWidth } from './investigationFigures'
import { gridGeometry } from '../questions/gridSvg'
import { percentageChangeInvestigation as inv } from '../../data/investigations/percentageChange'
import { allDraws } from './investigation'
import type { RenderedGrid } from '../questions/gridDraw'

/**
 * The bar models on percentage change's "try it" sections.
 *
 * What the page check found, held here: a label hanging off the edge of the
 * figure, two labels on top of each other, and a label cut through by the
 * dashed "start" line. Plus the one property the last section exists to show —
 * more comes off than went on — checked on the shapes themselves.
 */

/** Every value worth drawing: the ends, the middle, and a few awkward ones. */
const SAMPLE = [1, 2, 7, 10, 25, 33, 50, 67, 75, 90, 99, 100]

const figures = () => {
  const out: { where: string; v: number; grid: RenderedGrid; stage: number }[] = []
  for (const p of allDraws(inv.parameters)) {
    inv.build(p).forEach((stage, i) => {
      const c = stage.control
      if (!c?.render) return
      for (const v of SAMPLE) {
        if (v < c.domain.min || v > c.domain.max) continue
        out.push({ where: `section ${i + 1}, ${JSON.stringify(p)}, ${v}%`, v, grid: c.render([v], 0), stage: i })
      }
    })
  }
  return out
}

/** A label's box in viewBox units, estimated the way the layout code places it. */
const box = (grid: RenderedGrid, l: NonNullable<RenderedGrid['labels']>[number]) => {
  const geo = gridGeometry(grid.x, grid.y)
  const cx = geo.px(l.x) + (l.dx ?? 0)
  const base = geo.py(l.y) + (l.dy ?? 0)
  return { x0: cx - labelHalfWidth(l.text), x1: cx + labelHalfWidth(l.text), y0: base - 9, y1: base + 2, W: geo.W, H: geo.H }
}

describe('percentage change bar models', () => {
  it('draws a bar on every "try it" section', () => {
    const [p] = allDraws(inv.parameters)
    expect(inv.build(p).filter(s => s.control?.render)).toHaveLength(4)
  })

  it('keeps every label on the figure', () => {
    for (const { where, grid } of figures()) {
      for (const l of grid.labels ?? []) {
        const b = box(grid, l)
        expect(b.x0, `${where}: "${l.text}" hangs off the left`).toBeGreaterThanOrEqual(0)
        expect(b.x1, `${where}: "${l.text}" hangs off the right`).toBeLessThanOrEqual(b.W)
        expect(b.y0, `${where}: "${l.text}" is above the figure`).toBeGreaterThanOrEqual(0)
        expect(b.y1, `${where}: "${l.text}" is below the figure`).toBeLessThanOrEqual(b.H)
      }
    }
  })

  it('never puts one label on top of another', () => {
    for (const { where, grid } of figures()) {
      const ls = grid.labels ?? []
      for (let a = 0; a < ls.length; a++) {
        for (let b = a + 1; b < ls.length; b++) {
          const p = box(grid, ls[a])
          const q = box(grid, ls[b])
          const overlap = p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1
          expect(overlap, `${where}: "${ls[a].text}" overlaps "${ls[b].text}"`).toBe(false)
        }
      }
    }
  })

  it('keeps the section 4 amounts clear of the dashed start line', () => {
    for (const { where, grid, stage } of figures()) {
      if (stage !== 3) continue
      const geo = gridGeometry(grid.x, grid.y)
      const line = geo.px(100)
      for (const l of grid.labels ?? []) {
        if (!/^[+−]£/.test(l.text)) continue
        expect(box(grid, l).x0, `${where}: "${l.text}" crosses the line`).toBeGreaterThan(line)
      }
    }
  })

  it('shows more coming off than went on, to scale', () => {
    // The last section's whole argument, on the shapes: the piece removed from
    // the lower bar is longer than the piece added to the upper one, and the
    // lower bar ends short of where the upper one started.
    for (const { where, v, grid, stage } of figures()) {
      if (stage !== 3) continue
      const rects = [...grid.background.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/g)]
        .map(m => ({ x: +m[1], y: +m[2], w: +m[3] }))
      const added = rects.find(r => r.y === 80 && r.x === 100)!
      // The lower bar's two pieces, in the order the layout draws them: what is
      // kept, then what is taken off. Not by position — after a 100% fall the
      // kept piece is empty and the removed one starts at 0 too.
      const [kept, removed] = rects.filter(r => r.y === 20)
      expect(added.w, where).toBeCloseTo(v, 6)
      expect(removed.w, `${where}: no more comes off than went on`).toBeGreaterThan(added.w)
      expect(kept.w, `${where}: the lower bar reaches the start`).toBeLessThan(100)
    }
  })
})

describe('bar model animation', () => {
  const X = { min: 0, max: 200, step: 20, label: '' }
  const Y = { min: 0, max: 60, step: 20, label: '' }
  const grown = barModelGrid({
    x: X,
    y: Y,
    bars: [{
      y: 20,
      height: 20,
      pieces: [
        { from: 0, to: 100, fill: 'light' },
        { from: 100, to: 130, fill: 'shaded', grow: { from: 0, start: 0, end: 0.7 } },
      ],
      dividers: Array.from({ length: 20 }, (_, k) => k * 10),
    }],
  })

  it('grows a piece from its starting width to its own', () => {
    expect(grown.background).toMatch(/<animate attributeName="width" dur="0\.7s" fill="freeze" values="0;30"/)
  })

  it('leaves the finished picture in place once the animation is taken out', () => {
    // What a print, the PNG harness, and a student who asked for less motion
    // all see: the shapes' own attributes, never the animation's first frame.
    const still = grown.background.replace(/<animate\b[^>]*\/>/g, '')
    expect(still).not.toContain('<animate')
    expect(still).toMatch(/<rect x="100" y="20" width="30"/)
  })

  it('shows the tenths of a growing piece only as its edge reaches them', () => {
    // One line element: self-closing, or holding its own animations — never
    // running on into the next line.
    const line = (d: number) => grown.background
      .match(new RegExp(`<line x1="${d}"[^>]*?(?:/>|>(?:<animate[^>]*/>)+</line>)`))?.[0] ?? ''
    // Inside the original bar: there from the start.
    expect(line(50)).not.toContain('<animate')
    // On the part being added: hidden until the edge passes, later the further out.
    expect(line(110)).toContain('attributeName="opacity"')
    const at = (d: number) => Number(line(d).match(/dur="([\d.]+)s"/)![1])
    expect(at(120)).toBeGreaterThan(at(110))
  })
})

describe('barModelGrid', () => {
  it('refuses unequal steps, which would draw edges at different thicknesses', () => {
    expect(() => barModelGrid({
      x: { min: 0, max: 100, step: 10, label: '' },
      y: { min: 0, max: 3, step: 1, label: '' },
      bars: [],
    })).toThrow(/matching steps/)
  })

  it('draws on plain paper', () => {
    const g = barModelGrid({
      x: { min: 0, max: 100, step: 10, label: '' },
      y: { min: 0, max: 30, step: 10, label: '' },
      bars: [{ y: 10, height: 10, pieces: [{ from: 0, to: 100, fill: 'empty' }] }],
    })
    expect(g.showAxes).toBe(false)
    expect(g.showGrid).toBe(false)
  })
})
