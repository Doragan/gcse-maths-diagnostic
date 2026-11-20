import { describe, it, expect } from 'vitest'
import { distanceTimeGrid, journeyScene, labelHalfWidth } from './investigationFigures'
import { CELL, gridGeometry } from '../questions/gridSvg'
import { compoundUnitsInvestigation as inv } from '../../data/investigations/compoundUnits'
import { allDraws } from './investigation'
import type { RenderedGrid } from '../questions/gridDraw'

/**
 * Compound units' two figures per section: a vehicle on a road, and the same
 * journey drawing itself on a distance–time graph.
 *
 * The scene is only worth its space if the two move TOGETHER — a car that
 * arrives while the line is still drawing teaches that the graph is a separate
 * picture, which is the opposite of the point. So the clocks are checked here
 * on the SVG itself, not on the numbers that were meant to produce it.
 */

/**
 * Every section, every value its control allows, alone and after another try.
 * Once per scenario rather than per draw: each section reads one parameter,
 * so the other three would only build the same figures again. Built once.
 */
let cache: ReturnType<typeof build> | null = null
const journeys = () => (cache ??= build())
function build() {
  const seen = new Set<string>()
  const out: { where: string; section: number; drawn: number[]; scene: RenderedGrid; graph: RenderedGrid }[] = []
  for (const p of allDraws(inv.parameters)) {
    inv.build(p).forEach((stage, i) => {
      const c = stage.control
      if (!c?.scene || !c.render) return
      if (seen.has(`${i}:${stage.ask}`)) return
      seen.add(`${i}:${stage.ask}`)
      const values: number[] = []
      for (let v = c.domain.min; v <= c.domain.max + 1e-9; v += c.domain.step) values.push(v)
      const histories = [[], ...values.map(v => [v]), ...values.map(v => [values[0] === v ? values[1] : values[0], v])]
      for (const drawn of histories) {
        const cur = Math.max(drawn.length - 1, 0)
        // Looking at the first try just before this one, as on the page.
        const before = drawn.length > 1 ? 0 : undefined
        out.push({
          where: `section ${i + 1}, ${JSON.stringify(p)}, tried ${JSON.stringify(drawn)}`,
          section: i,
          drawn,
          scene: c.scene(drawn, cur, before),
          graph: c.render(drawn, cur, before),
        })
      }
    })
  }
  return out
}

/** The first animation of `attr` on the first element carrying `marker`. */
function clock(svg: string, marker: string, attr: string) {
  const at = svg.indexOf(marker)
  if (at < 0) return null
  const rest = svg.slice(at)
  const m = rest.match(new RegExp(`<animate attributeName="${attr}" dur="([\\d.]+)s"[^>]*keyTimes="([^"]+)"`))
  if (!m) return null
  // Only if that animation belongs to this element, not one further on.
  const close = rest.search(/<\/(rect|circle|line|ellipse)>/)
  if (rest.indexOf(m[0]) > close) return null
  const dur = Number(m[1])
  return m[2].split(';').map(k => +(Number(k) * dur).toFixed(3))
}

describe('the road and the graph run on one clock', () => {
  it('has a scene above the graph on every section', () => {
    const [p] = allDraws(inv.parameters)
    expect(inv.build(p).filter(s => s.control?.scene && s.control.render)).toHaveLength(4)
  })

  it('gets the vehicle and the dot to every turn at the same moment', () => {
    let checked = 0
    for (const { where, scene, graph, drawn } of journeys()) {
      if (drawn.length === 0) continue
      const car = clock(scene.background, 'data-drive="live"', scene.background.includes('<rect data-drive="live"') ? 'x' : 'cx')
      const dot = clock(graph.background, 'data-dot="live"', 'cx')
      expect(car, `${where}: the vehicle does not move`).not.toBeNull()
      expect(dot, `${where}: the dot does not move`).not.toBeNull()
      expect(car, `${where}: the vehicle and the dot keep different times`).toEqual(dot)
      checked++
    }
    expect(checked).toBeGreaterThan(50)
  })

  it('gets the faint vehicle home with its dashed line', () => {
    // Sections 3 and 4: the whole hour, and the steady van at the average.
    let checked = 0
    for (const { where, scene, graph, section, drawn } of journeys()) {
      if (section < 2 || drawn.length === 0) continue
      const ghost = clock(scene.background, 'data-drive="ghost"', section === 2 ? 'cx' : 'x')
      const dashed = clock(graph.background, 'data-dot="dashed"', 'cx')
      expect(ghost, `${where}: the faint vehicle and the dashed line keep different times`).toEqual(dashed)
      checked++
    }
    expect(checked).toBeGreaterThan(20)
  })

  it('gets the faint coach in section 1 home with its faint line', () => {
    // The try looked at before this one: driving again in the lane above, and
    // drawing itself again on the graph, on the same clock.
    let checked = 0
    for (const { where, scene, graph, section, drawn } of journeys()) {
      if (section !== 0 || drawn.length < 2) continue
      const ghost = clock(scene.background, 'data-drive="ghost"', 'x')
      const line = clock(graph.background, 'data-dot="ghost"', 'cx')
      expect(ghost, `${where}: the faint coach does not move`).not.toBeNull()
      expect(ghost, `${where}: the faint coach and its line keep different times`).toEqual(line)
      checked++
    }
    expect(checked).toBeGreaterThan(10)
  })

  it('puts the vehicle as far along the road as the graph says it went', () => {
    // Sections 1–3 draw the road to the top of the graph's distance axis, so
    // the fraction of the road covered is the fraction of the axis climbed.
    for (const { where, scene, graph, section, drawn } of journeys()) {
      if (section > 2 || drawn.length === 0) continue
      const road = scene.background.match(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)"/)!
      const from = Number(road[1])
      const to = Number(road[3])
      const wheels = [...scene.background.matchAll(/<circle data-drive="live" cx="([\d.]+)"/g)].map(m => Number(m[1]))
      const centre = (wheels[0] + wheels[1]) / 2
      const dot = graph.background.match(/<ellipse data-dot="live" cx="([\d.]+)" cy="([\d.]+)"/)!
      expect((centre - from) / (to - from), where).toBeCloseTo(Number(dot[2]) / graph.y.max, 3)
    }
  })

  it('leaves every animated shape at its finished state', () => {
    // What the PNG harness, a print and a student who asked for less motion
    // see: the attribute itself, with the animation stripped. It has to be
    // where the animation ends, or the still picture is a different journey.
    for (const { where, scene, graph } of journeys()) {
      for (const svg of [scene.background, graph.background]) {
        for (const el of svg.matchAll(/<(\w+) ([^>]*)>((?:<animate [^>]*\/>)+)/g)) {
          for (const a of el[3].matchAll(/<animate attributeName="(\w+)"[^>]*values="([^"]+)"/g)) {
            const [, attr, values] = a
            const last = Number(values.split(';').at(-1))
            if (attr === 'opacity') { expect(last, where).toBe(1); continue }
            const own = el[2].match(new RegExp(`\\b${attr}="([^"]+)"`))
            expect(own, `${where}: <${el[1]}> animates ${attr} it does not have`).not.toBeNull()
            expect(Number(own![1]), `${where}: <${el[1]}> ${attr} ends somewhere else`).toBeCloseTo(last, 3)
          }
        }
      }
    }
  })

  it('stops completely for a student who asked for less motion', () => {
    // The page's still(): every animation here has to be one it strips.
    const still = (s: string) => s.replace(/<animate\b[^>]*\/>/g, '')
    for (const { where, scene, graph } of journeys()) {
      expect(still(scene.background), where).not.toMatch(/<animate/)
      expect(still(graph.background), where).not.toMatch(/<animate/)
    }
  })
})

describe('the clock under the road', () => {
  it('keeps the same time as the "now" line on the graph', () => {
    let checked = 0
    for (const { where, scene, graph, drawn } of journeys()) {
      if (drawn.length === 0) continue
      const strip = clock(scene.background, 'data-clock="dot"', 'cx')
      const now = clock(graph.background, 'data-now', 'x1')
      expect(strip, `${where}: the clock does not run`).not.toBeNull()
      expect(strip, `${where}: the clock and the graph keep different times`).toEqual(now)
      checked++
    }
    expect(checked).toBeGreaterThan(50)
  })

  it('stops at the time the graph stops at, ruled like its time axis', () => {
    // The strip IS the time axis, drawn under the road: as far along the strip
    // as the "now" line is along the axis, and ruled at the axis's steps.
    for (const { where, scene, graph, drawn } of journeys()) {
      if (drawn.length === 0) continue
      const strip = scene.background.match(/data-clock="strip" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)"/)!
      const from = Number(strip[1])
      const level = Number(strip[2])
      const to = Number(strip[3])
      const dot = Number(scene.background.match(/data-clock="dot" cx="([\d.]+)"/)![1])
      const now = Number(graph.background.match(/data-now="" x1="([\d.]+)"/)![1])
      expect((dot - from) / (to - from), where).toBeCloseTo(now / graph.x.max, 3)
      // Ticks: short uprights centred on the strip.
      const ticks = [...scene.background.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)]
        .filter(m => m[1] === m[3] && Math.abs((Number(m[2]) + Number(m[4])) / 2 - level) < 1e-3)
      expect(ticks.length, `${where}: the strip is not ruled like the axis`)
        .toBe(Math.round(graph.x.max / graph.x.step) + 1)
    }
  })

  it('runs until the last vehicle stops, faint ones too', () => {
    for (const { where, scene, drawn } of journeys()) {
      if (drawn.length === 0) continue
      const durs = [...scene.background.matchAll(/data-drive="[^"]*"[^>]*>((?:<animate [^>]*\/>)+)/g)]
        .flatMap(m => [...m[1].matchAll(/dur="([\d.]+)s"/g)].map(d => Number(d[1])))
      const runs = clock(scene.background, 'data-clock="dot"', 'cx')!
      expect(runs.at(-1), where).toBeCloseTo(Math.max(...durs), 3)
    }
  })
})

describe('the graph', () => {
  it('draws its dot round, whatever the two axes count in', () => {
    for (const { where, graph } of journeys()) {
      for (const m of graph.background.matchAll(/<ellipse [^>]*rx="([\d.]+)" ry="([\d.]+)"/g)) {
        expect(Number(m[1]) * CELL / graph.x.step, where).toBeCloseTo(Number(m[2]) * CELL / graph.y.step, 2)
      }
    }
  })

  it('keeps every line the same thickness on screen', () => {
    // Hours against kilometres scale the two directions differently, so a
    // width in axis units would be thick one way and hairline the other.
    for (const { where, graph } of journeys()) {
      for (const m of graph.background.matchAll(/<line [^>]*>/g)) {
        expect(m[0], where).toContain('vector-effect="non-scaling-stroke"')
      }
    }
  })

  it('draws the section 1 lines flatter for more hours', () => {
    const p = allDraws(inv.parameters)[0]
    const c = inv.build(p)[0].control!
    const slope = (h: number) => {
      const m = c.render!([h], 0).background.match(/data-trace="live" x1="0" y1="0" x2="([\d.]+)" y2="([\d.]+)"/)!
      return Number(m[2]) / Number(m[1])
    }
    for (let h = 1; h < 6; h++) expect(slope(h)).toBeGreaterThan(slope(h + 1))
  })
})

describe('the words on both figures', () => {
  const box = (grid: RenderedGrid, l: NonNullable<RenderedGrid['labels']>[number]) => {
    const geo = gridGeometry(grid.x, grid.y)
    const cx = geo.px(l.x) + (l.dx ?? 0)
    const base = geo.py(l.y) + (l.dy ?? 0)
    return { x0: cx - labelHalfWidth(l.text), x1: cx + labelHalfWidth(l.text), y0: base - 9, y1: base + 2, W: geo.W, H: geo.H }
  }

  it('keeps every label on its figure, and never on top of another', () => {
    for (const { where, scene, graph } of journeys()) {
      for (const grid of [scene, graph]) {
        const ls = grid.labels ?? []
        for (const l of ls) {
          const b = box(grid, l)
          expect(b.x0 >= 0 && b.x1 <= b.W && b.y0 >= 0 && b.y1 <= b.H, `${where}: "${l.text}" is off the figure`)
            .toBe(true)
        }
        for (let a = 0; a < ls.length; a++) {
          for (let b = a + 1; b < ls.length; b++) {
            const p = box(grid, ls[a])
            const q = box(grid, ls[b])
            const overlap = p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1
            expect(overlap, `${where}: "${ls[a].text}" overlaps "${ls[b].text}"`).toBe(false)
          }
        }
      }
    }
  })
})

describe('the builders', () => {
  const AX = { min: 0, max: 60, step: 6, label: '' }

  it('refuses a scene whose steps do not match', () => {
    expect(() => journeyScene({ x: AX, y: { ...AX, step: 3 }, roads: [], drives: [] })).toThrow(/matching steps/)
  })

  it('leaves a parked vehicle unanimated', () => {
    const g = journeyScene({ x: AX, y: { min: 0, max: 12, step: 6, label: '' }, roads: [], drives: [{ road: 4, frames: [[0, 10]] }] })
    expect(g.background).not.toMatch(/<animate/)
    expect(g.background).toMatch(/<rect data-drive="live"/)
  })

  it('hides a later segment until the journey reaches it', () => {
    const g = distanceTimeGrid({
      x: { min: 0, max: 4, step: 1, label: '' },
      y: { min: 0, max: 40, step: 10, label: '' },
      traces: [{ points: [[0, 0], [1, 20], [3, 40]], times: [0, 1, 3], style: 'live' }],
    })
    const segs = [...g.background.matchAll(/<line data-trace="live"[^>]*>(.*?)<\/line>/g)].map(m => m[1])
    expect(segs).toHaveLength(2)
    expect(segs[0]).not.toMatch(/attributeName="opacity"/)
    expect(segs[1]).toMatch(/<animate attributeName="opacity" dur="1\.01s" fill="freeze" values="0;0;1"/)
  })
})
