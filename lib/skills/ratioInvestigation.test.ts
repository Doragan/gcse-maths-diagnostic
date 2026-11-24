import { describe, it, expect } from 'vitest'
import { ratioInvestigation as inv } from '../../data/investigations/ratio'
import { allDraws, controlValues, splitInputs } from './investigation'
import { labelHalfWidth } from './investigationFigures'
import { CELL } from '../questions/gridSvg'
import type { RenderedGrid } from '../questions/gridDraw'

/**
 * Sharing in a ratio. Sections 1–3 draw the WHOLE as one bar cut into equal
 * parts and coloured by whose they are; section 4 draws a row of parts per
 * person, to show a difference. The argument rests on the parts being equal
 * and the shares adding back up, so both are checked on what is drawn, for
 * every value every section allows.
 */

/** Every section, every value its control allows, once per scenario. */
function figures() {
  const seen = new Set<string>()
  const out: { where: string; section: number; v: number; ask: string; grid: RenderedGrid }[] = []
  for (const p of allDraws(inv.parameters)) {
    inv.build(p).forEach((stage, i) => {
      const c = stage.control
      if (!c?.render || seen.has(`${i}:${stage.ask}`)) return
      seen.add(`${i}:${stage.ask}`)
      for (const v of controlValues(c)) {
        out.push({ where: `section ${i + 1}: ${stage.ask} — ${c.name} = ${v}`, section: i, v, ask: stage.ask, grid: c.render([v], 0) })
      }
    })
  }
  return out
}

/** The pieces drawn, as [x, y, width]. */
const rects = (g: RenderedGrid) =>
  [...g.background.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/g)].map(m => m.slice(1).map(Number))
/** Divider positions, grouped by the row they cut. */
const dividers = (g: RenderedGrid) => {
  const byRow = new Map<number, number[]>()
  for (const m of g.background.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="\1"/g)) {
    const y = Number(m[2])
    byRow.set(y, [...(byRow.get(y) ?? []), Number(m[1])])
  }
  return byRow
}
const pounds = (t: string) => Number(t.replace('£', ''))
const words = (g: RenderedGrid) => (g.labels ?? []).map(l => l.text)
/** The amount written after a name under its colour: "Amy £15" → 15. */
const shareOf = (g: RenderedGrid, who: string) => pounds(words(g).find(w => w.startsWith(`${who} £`))!.split(' ')[1])

/** One bar of the whole: full width, cut into `parts` equal parts, the first `first` of them dark. */
function expectWholeBar(where: string, grid: RenderedGrid, first: number, parts: number) {
  const width = grid.x.max
  const [whole, dark, light] = rects(grid)
  expect(whole[2], `${where}: the bar is not the whole width`).toBe(width)
  expect(dark[2], `${where}: the first colour`).toBeCloseTo((width * first) / parts, 3)
  expect(light[0] + light[2], `${where}: the second colour does not reach the end`).toBeCloseTo(width, 3)
  // Only the cuts inside the bar are drawn, so its two ends are added here.
  const cuts = [0, ...new Set([...dividers(grid).values()].flat()), width].sort((p, q) => p - q)
  expect(cuts.length, `${where}: not cut into ${parts} parts`).toBe(parts + 1)
  for (let k = 1; k < cuts.length; k++) expect(cuts[k] - cuts[k - 1], where).toBeCloseTo(width / parts, 3)
}

describe('section 1: one bar of the amount, and the split changed', () => {
  it('cuts the whole amount into equal parts, and the shares add back up to it', () => {
    let checked = 0
    for (const { where, section, v, ask, grid } of figures()) {
      if (section !== 0) continue
      const [, amount, a] = ask.match(/£(\d+) in the ratio (\d+) : \d+/)!.map(Number)
      expectWholeBar(where, grid, a, a + v)
      expect(shareOf(grid, 'Amy'), where).toBeCloseTo((amount * a) / (a + v), 2)
      expect(shareOf(grid, 'Ben'), where).toBeCloseTo((amount * v) / (a + v), 2)
      expect(shareOf(grid, 'Amy') + shareOf(grid, 'Ben'), where).toBeCloseTo(amount, 1)
      checked++
    }
    // Ben's number runs to 10 − Amy's: 7 + 6 + 5 + 7 splits over the four questions.
    expect(checked).toBe(25)
  })
})

describe('section 2: one bar, with Ben’s share known', () => {
  it('keeps Ben’s share, and finds Amy’s and the total from one part of it', () => {
    let checked = 0
    for (const { where, section, v, ask, grid } of figures()) {
      if (section !== 1) continue
      const [, a, , known] = ask.match(/ratio (\d+) : (\d+)\. Ben gets £(\d+)/)!.map(Number)
      expectWholeBar(where, grid, a, a + v)
      expect(shareOf(grid, 'Ben'), where).toBe(known)
      expect(shareOf(grid, 'Amy'), where).toBeCloseTo((a * known) / v, 2)
      const total = words(grid).find(w => w.startsWith('altogether'))!
      expect(pounds(total.split(': ')[1]), where).toBeCloseTo(((a + v) * known) / v, 2)
      checked++
    }
    // 7 + 8 + 6 + 5 splits over the four questions.
    expect(checked).toBe(26)
  })
})

describe('the value in every part', () => {
  it('writes each part’s value in it, and it fits inside the part', () => {
    // The bar was widened so it would: a value spilling into the next part
    // reads as one number across two parts.
    let checked = 0
    // Every split tried, and the question's own split before any is.
    const asked = allDraws(inv.parameters).flatMap(p => inv.build(p).slice(0, 2).map((stage, section) =>
      ({ where: `${stage.ask} — as asked`, section, grid: stage.control!.render!([], 0) })))
    for (const { where, section, grid } of [...figures(), ...asked]) {
      if (section > 1) continue
      const parts = [...new Set([...dividers(grid).values()].flat())].length + 1
      const partPx = (grid.x.max / parts) * (CELL / grid.x.step)
      const inParts = (grid.labels ?? []).filter(l => /^£[\d.]+$/.test(l.text))
      expect(inParts.length, `${where}: not every part has its value`).toBe(parts)
      expect(new Set(inParts.map(l => l.text)).size, `${where}: the parts are not all worth the same`).toBe(1)
      for (const l of inParts) {
        expect(2 * labelHalfWidth(l.text), `${where}: "${l.text}" does not fit a part ${partPx.toFixed(1)} wide`)
          .toBeLessThanOrEqual(partPx - 1)
      }
      checked++
    }
    expect(checked).toBeGreaterThan(51)
  })
})

describe('section 3: both numbers of the ratio', () => {
  it('cuts one bar into all the parts, and writes fractions that make a whole', () => {
    let checked = 0
    for (const { where, section, v, grid } of figures()) {
      if (section !== 2) continue
      const [f, s] = splitInputs(v, 2)
      const n = f + s
      expectWholeBar(where, grid, f, n)
      // Stacked fractions in the diagram, as on the rest of the page (review, 2026-11-24).
      expect(words(grid), where).toContain(`boys {${f}/${n}}`)
      expect(words(grid), where).toContain(`girls {${s}/${n}}`)
      expect(words(grid).join(' | '), where).toContain(`{${f}/${n}} + {${s}/${n}} = {${n}/${n}} = 1`)
      checked++
    }
    // Every pair from 1 : 1 to 9 : 9, in each of the four classes.
    expect(checked).toBe(4 * 81)
  })
})

describe('section 4: a row of parts per person, the whole ratio changed', () => {
  const PART = 7.2

  it('gives every person as many parts as their number, all the same size', () => {
    let checked = 0
    for (const { where, section, v, grid } of figures()) {
      if (section !== 3) continue
      const ratio = splitInputs(v, 3)
      expect(rects(grid).map(r => +r[2].toFixed(4)), where).toEqual(ratio.map(n => +(n * PART).toFixed(4)))
      for (const xs of dividers(grid).values()) {
        // Once each: the dashed guide starts level with Cara's row and stands
        // on one of her dividers.
        const sorted = [...new Set(xs)].sort((a, b) => a - b)
        for (let k = 1; k < sorted.length; k++) expect(sorted[k] - sorted[k - 1], where).toBeCloseTo(PART, 6)
      }
      checked++
    }
    // Every ratio with Cara above Amy, 1 to 7 each: 21 × 7, in four questions.
    expect(checked).toBe(4 * 21 * 7)
  })

  it('finds one part from the difference, and writes it in every part where it fits', () => {
    for (const { where, section, v, ask, grid } of figures()) {
      if (section !== 3) continue
      const [x, y, z] = splitInputs(v, 3)
      expect(z, `${where}: Cara does not have more parts than Amy`).toBeGreaterThan(x)
      const diff = Number(ask.match(/Cara gets £(\d+) more/)![1])
      const one = diff / (z - x)
      const inParts = (grid.labels ?? []).filter(l => /^£[\d.]+$/.test(l.text) && Math.abs(pounds(l.text) - one) < 0.005)
      expect(inParts.length, `${where}: not every part has its value`).toBeGreaterThanOrEqual(x + y + z)
      // Measured off the drawing — Amy's row over her parts — not assumed.
      const partPx = (rects(grid)[0][2] / x) * (CELL / grid.x.step)
      for (const l of inParts) {
        expect(2 * labelHalfWidth(l.text), `${where}: "${l.text}" does not fit a part`).toBeLessThanOrEqual(partPx - 1)
      }
    }
  })

  it('refuses a ratio where Cara does not get more than Amy', () => {
    const stage = inv.build(allDraws(inv.parameters)[0])[3]
    // 5 : 3 : 2 and 3 : 2 : 3 give Cara no more than Amy; 2 : 3 : 5 does.
    expect(stage.control!.valid!(50302)).toMatch(/more parts than Amy/)
    expect(stage.control!.valid!(30203)).toMatch(/more parts than Amy/)
    expect(stage.control!.valid!(20305)).toBeNull()
  })
})

describe('what the sections ask about', () => {
  it('brings up no kind of question that is not then tested', () => {
    // Sections 2 and 3 once had asides on a known difference and on going from
    // a fraction back to a ratio, which no check then asked (review,
    // 2026-11-23). A difference is section 4's, so section 2 has none. Going
    // back from a fraction is in section 3's one card (review, 2026-11-24),
    // with a question of its own (02fc16a0).
    const stages = inv.build(allDraws(inv.parameters)[0])
    expect(stages[1].aside, 'section 2').toBeUndefined()
    expect(stages[2].aside, 'section 3 has its card AND an aside again').toBeUndefined()
    expect(stages[2].naming?.elsewhere, 'section 3').toMatch(/works backwards/)
    expect(stages[2].check?.map(c => c.questionId), 'section 3 does not test going backwards')
      .toContain('02fc16a0-8ec3-4ae8-bd94-630553c05fef')
  })

  it('has algebra only in section 3, under "Using algebra"', () => {
    const stages = inv.build(allDraws(inv.parameters)[0])
    expect(stages[0].conclude.algebra).toBeUndefined()
    expect(stages[1].conclude.algebra).toBeUndefined()
    expect(stages[3].conclude.algebra).toBeUndefined()
    for (const s of stages) if (s.conclude.algebraLead) expect(s.conclude.algebraLead, s.title).toMatch(/^Using algebra/)
  })

  it('calls them parts, never boxes', () => {
    for (const p of allDraws(inv.parameters).slice(0, 4)) {
      for (const s of inv.build(p)) {
        const text = JSON.stringify([s.ask, s.predict, s.conclude, s.naming, s.aside, s.control?.prompt, s.control?.hint])
        expect(text, s.title).not.toMatch(/\bbox/i)
      }
    }
  })
})

describe('the predictions', () => {
  it('offers three different answers, the first of them right', () => {
    const seen = new Set<string>()
    for (const p of allDraws(inv.parameters)) {
      inv.build(p).forEach((stage, i) => {
        if (seen.has(stage.ask)) return
        seen.add(stage.ask)
        const on = stage.predict.on
        if (on.kind !== 'choice') throw new Error('choice predictions only')
        expect(new Set(on.options).size, stage.ask).toBe(on.options.length)
        const n = stage.ask.match(/\d+(\.\d+)?/g)!.map(Number)
        const right = on.options[on.correct]
        if (i === 0) {
          const [a, b, total] = [n[1], n[2], n[0]]
          expect(right, stage.ask).toBe(`£${(a * total) / (a + b)} and £${(b * total) / (a + b)}`)
        } else if (i === 1) {
          const [a, b, known] = n
          expect(right, stage.ask).toBe(`£${(a * known) / b}`)
        } else if (i === 2) {
          const [boys, girls] = n
          expect(right, stage.ask).toBe(`${boys}/${boys + girls}`)
        } else {
          const [a, b, c, diff] = n
          expect(right, stage.ask).toBe(`£${(b * diff) / (c - a)}`)
        }
      })
    }
    expect(seen.size).toBe(16)
  })
})
