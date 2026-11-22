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
  it('has a scene above the graph on every journey, and bars alone on section 3', () => {
    // Section 3 is a fraction of an amount, not a journey: no road, no graph.
    const [p] = allDraws(inv.parameters)
    const stages = inv.build(p)
    expect(stages.map((s, i) => (s.control?.scene && s.control.render ? i : -1)).filter(i => i >= 0))
      .toEqual([0, 1, 3])
    expect(stages[2].control?.render).toBeDefined()
    expect(stages[2].control?.scene).toBeUndefined()
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
    // Section 4: the steady van at the average.
    let checked = 0
    for (const { where, scene, graph, section, drawn } of journeys()) {
      if (section !== 3 || drawn.length === 0) continue
      const ghost = clock(scene.background, 'data-drive="ghost"', 'x')
      const dashed = clock(graph.background, 'data-dot="dashed"', 'cx')
      expect(ghost, `${where}: the faint vehicle and the dashed line keep different times`).toEqual(dashed)
      checked++
    }
    expect(checked).toBeGreaterThan(20)
  })

  it('gets the faint car in section 1 home with its faint line', () => {
    // The try looked at before this one: driving again in the lane above, and
    // drawing itself again on the graph, on the same clock.
    let checked = 0
    for (const { where, scene, graph, section, drawn } of journeys()) {
      if (section !== 0 || drawn.length < 2) continue
      const ghost = clock(scene.background, 'data-drive="ghost"', 'x')
      const line = clock(graph.background, 'data-dot="ghost"', 'cx')
      expect(ghost, `${where}: the faint car does not move`).not.toBeNull()
      expect(ghost, `${where}: the faint car and its line keep different times`).toEqual(line)
      checked++
    }
    expect(checked).toBeGreaterThan(10)
  })

  it('puts the vehicle as far along the road as the graph says it went', () => {
    // Sections 1 and 2 draw the road to the top of the graph's distance axis,
    // so the fraction of the road covered is the fraction of the axis climbed.
    for (const { where, scene, graph, section, drawn } of journeys()) {
      if (section > 1 || drawn.length === 0) continue
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
            if (attr === 'opacity') {
              // Most fade IN and end visible; a vehicle's outward-facing copy
              // ends hidden once it has turned for home, and says so. Not
              // \bopacity: that would find fill-opacity.
              const own = el[2].match(/(?:^|\s)opacity="([^"]+)"/)
              expect(last, `${where}: <${el[1]}> ends at opacity ${last}`).toBe(own ? Number(own[1]) : 1)
              continue
            }
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

describe('section 3: a fraction of the hour is that fraction of the distance', () => {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
  const bars = () => {
    const seen = new Set<string>()
    const out: { where: string; speed: number; m: number; grid: RenderedGrid }[] = []
    for (const p of allDraws(inv.parameters)) {
      const stage = inv.build(p)[2]
      if (seen.has(stage.ask)) continue
      seen.add(stage.ask)
      const speed = Number(stage.ask.match(/(\d+) km\/h/)![1])
      const c = stage.control!
      for (let m = c.domain.min; m <= c.domain.max; m += c.domain.step) {
        out.push({ where: `${speed} km/h for ${m} minutes`, speed, m, grid: c.render!([m], 0) })
      }
    }
    return out
  }

  it('shades the same share of both bars: the minutes out of 60', () => {
    const all = bars()
    expect(all.length).toBeGreaterThan(40)
    for (const { where, m, grid } of all) {
      const shaded = [...grid.background.matchAll(/<rect x="0" y="([\d.]+)" width="([\d.]+)"[^>]*fill-opacity="0.5"/g)]
      expect(shaded.map(r => Number(r[2])), where).toEqual([m, m])
    }
  })

  it('cuts both bars into the fraction’s parts, in lowest terms', () => {
    for (const { where, m, grid } of bars()) {
      const parts = 60 / gcd(m, 60)
      const cuts = [...grid.background.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="\1"/g)]
      expect(cuts.length, where).toBe(2 * (parts - 1))
    }
  })

  it('says which bar is minutes and which is km, and never writes the same numbers in both', () => {
    // At 60 km/h a minute was a kilometre, so both bars read 5 5 5 … and could
    // not be told apart (review, 2026-11-22).
    for (const { where, speed, m, grid } of bars()) {
      const words = (grid.labels ?? []).map(l => l.text)
      expect(words, where).toContain('min')
      expect(words, where).toContain('km')
      const parts = 60 / gcd(m, 60)
      expect(speed / parts, `${where}: a part of the hour and a part of the distance read the same`)
        .not.toBe(60 / parts)
    }
  })

  it('writes one part of the distance in each part, and the answer under it', () => {
    for (const { where, speed, m, grid } of bars()) {
      const parts = 60 / gcd(m, 60)
      const words = (grid.labels ?? []).map(l => l.text)
      expect(words.filter(t => t === String(speed / parts)).length, where).toBeGreaterThanOrEqual(parts)
      const d = (speed * m) / 60
      expect(words.join(' | '), where).toMatch(m === 60 ? `the whole ${speed} km` : `= ${d} km`)
    }
  })
})

describe('pace and direction', () => {
  it('takes five to seven seconds over the longest journey a section allows', () => {
    // Under four was too quick to follow the vehicle, the clock and the line
    // at once (review, 2026-11-22).
    const longest = new Map<number, number>()
    for (const { section, scene, drawn } of journeys()) {
      if (drawn.length === 0) continue
      const end = clock(scene.background, 'data-clock="dot"', 'cx')!.at(-1)!
      longest.set(section, Math.max(longest.get(section) ?? 0, end))
    }
    expect([...longest.keys()].sort()).toEqual([0, 1, 3])
    for (const [section, secs] of longest) {
      expect(secs, `section ${section + 1}`).toBeGreaterThanOrEqual(5)
      expect(secs, `section ${section + 1}`).toBeLessThanOrEqual(7)
    }
  })

  it('drives section 4 one way, A to B to C, without turning round', () => {
    let checked = 0
    for (const { where, scene, section, drawn } of journeys()) {
      if (section !== 3 || drawn.length === 0) continue
      expect(scene.background, where).not.toMatch(/attributeName="opacity"[^>]*values="1;1;0"/)
      for (const m of scene.background.matchAll(/data-drive="(?:live|ghost)"[^>]*><animate attributeName="x" [^>]*values="([^"]+)"/g)) {
        const xs = m[1].split(';').map(Number)
        for (let k = 1; k < xs.length; k++) expect(xs[k], where).toBeGreaterThan(xs[k - 1])
      }
      const words = (scene.labels ?? []).map(l => l.text)
      expect(words, where).toContain('A')
      expect(words.some(w => w.startsWith('B, ')), where).toBe(true)
      expect(words.some(w => w.startsWith('C, ')), where).toBe(true)
      checked++
    }
    expect(checked).toBeGreaterThan(20)
  })
})

describe('which way a vehicle faces', () => {
  const AX = { min: 0, max: 60, step: 6, label: '' }
  const AY = { min: 0, max: 12, step: 6, label: '' }
  const out = [[0, 4], [1, 56], [2, 4]] as const

  it('turns a van round at the town, so it does not reverse home', () => {
    const g = journeyScene({ x: AX, y: AY, roads: [], drives: [{ road: 4, frames: out, vehicle: 'van' }] })
    // Two copies of every part: one facing out, one facing home.
    const bodies = [...g.background.matchAll(/<rect data-drive="live"[^>]*>(.*?)<\/rect>/g)]
    expect(bodies).toHaveLength(6)
    const shows = bodies.map(b => b[1].match(/attributeName="opacity"[^>]*values="([^"]+)"[^>]*keyTimes="([^"]+)"/)!)
    // Facing out until the turn at 1 s, then facing home; never both at once.
    const out1 = shows.filter(s => s[1] === '1;1;0')
    const home = shows.filter(s => s[1] === '0;0;1')
    expect(out1).toHaveLength(3)
    expect(home).toHaveLength(3)
    for (const s of shows) expect(Number(s[2].split(';')[1]) * 1.01).toBeCloseTo(1, 3)
  })

  it('draws the copy facing home as the mirror of the one facing out', () => {
    const g = journeyScene({ x: AX, y: AY, roads: [], drives: [{ road: 4, frames: out, vehicle: 'van' }] })
    const wheels = [...g.background.matchAll(/<circle data-drive="live" cx="([\d.]+)"/g)].map(m => Number(m[1]))
    // Both copies end at home (x = 4), with their wheels either side of it.
    expect(wheels.slice(0, 2).map(w => +(w - 4).toFixed(3)).sort()).toEqual(wheels.slice(2).map(w => +(w - 4).toFixed(3)).sort())
    // The van's front is its bonnet: right of the wheelbase going out, left coming home.
    const xs = [...g.background.matchAll(/<rect data-drive="live" x="([\d.-]+)" y="[\d.-]+" width="([\d.]+)"/g)]
      .map(m => [Number(m[1]) - 4, Number(m[2])])
    const reach = (r: number[][]) => [Math.min(...r.map(([x]) => x)), Math.max(...r.map(([x, w]) => x + w))]
    const [lo1, hi1] = reach(xs.slice(0, 3))
    const [lo2, hi2] = reach(xs.slice(3))
    expect(lo2).toBeCloseTo(-hi1, 3)
    expect(hi2).toBeCloseTo(-lo1, 3)
  })

  it('leaves a lorry going one way, and a car either way, as one copy', () => {
    const lorry = journeyScene({ x: AX, y: AY, roads: [], drives: [{ road: 4, frames: [[0, 4], [1, 56]], vehicle: 'lorry' }] })
    expect(lorry.background).not.toMatch(/attributeName="opacity"/)
    const car = journeyScene({ x: AX, y: AY, roads: [], drives: [{ road: 4, frames: out }] })
    expect(car.background).not.toMatch(/attributeName="opacity"/)
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
