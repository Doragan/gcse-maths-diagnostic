import { describe, it, expect } from 'vitest'
import { ratioInvestigation as inv } from '../../data/investigations/ratio'
import { allDraws } from './investigation'
import type { RenderedGrid } from '../questions/gridDraw'

/**
 * Sharing in a ratio: the picture is a row of equal boxes per person, and the
 * whole argument rests on the boxes being the SAME SIZE in every row and the
 * shares adding back to the amount. Checked on what is drawn, for every value
 * every section allows.
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
      for (let v = c.domain.min; v <= c.domain.max + 1e-9; v += c.domain.step) {
        out.push({ where: `section ${i + 1}: ${stage.ask} — ${c.name} = ${v}`, section: i, v, ask: stage.ask, grid: c.render([v], 0) })
      }
    })
  }
  return out
}

/** The pieces drawn, as [x, y, width] — one per person's row in sections 1, 2 and 4. */
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

describe('the rows of boxes', () => {
  it('gives every person as many boxes as their number, all the same size', () => {
    let checked = 0
    for (const { where, section, ask, grid } of figures()) {
      if (section === 2) continue
      const ratio = ask.match(/ratio ([\d :]+)\./)![1].split(' : ').map(Number)
      const rows = rects(grid)
      expect(rows.map(r => r[2]), where).toEqual(ratio.map(n => n * 6))
      // Every gap between dividers in every row is one box wide.
      for (const xs of dividers(grid).values()) {
        // Once each: section 4's dashed guide starts level with Cara's row
        // and stands on one of her dividers.
        const sorted = [...new Set(xs)].sort((a, b) => a - b)
        for (let k = 1; k < sorted.length; k++) expect(sorted[k] - sorted[k - 1], where).toBeCloseTo(6, 6)
      }
      checked++
    }
    expect(checked).toBeGreaterThan(100)
  })

  it('writes the same value in every box, and shares that add back to the amount', () => {
    for (const { where, section, v, ask, grid } of figures()) {
      if (section !== 0) continue
      const ratio = ask.match(/ratio ([\d :]+)\./)![1].split(' : ').map(Number)
      const words = (grid.labels ?? []).map(l => l.text)
      const each = v / ratio.reduce((s, n) => s + n, 0)
      const inBoxes = words.filter(w => /^£[\d.]+$/.test(w) && Math.abs(pounds(w) - each) < 0.005)
      expect(inBoxes.length, where).toBeGreaterThanOrEqual(ratio.reduce((s, n) => s + n, 0))
      const shares = ratio.map(n => n * each)
      for (const s of shares) expect(words.some(w => /^£/.test(w) && Math.abs(pounds(w) - s) < 0.005), `${where}: no share of £${s}`).toBe(true)
      expect(shares.reduce((s, n) => s + n, 0), where).toBeCloseTo(v, 6)
    }
  })

  it('in section 3, shades the first share of one bar and writes fractions that make a whole', () => {
    for (const { where, section, v, grid } of figures()) {
      if (section !== 2) continue
      const [shaded, light] = rects(grid)
      const words = (grid.labels ?? []).map(l => l.text)
      const first = shaded[2] / 6
      expect(light[2] / 6, where).toBe(v)
      expect(words.some(w => w.includes(`${first} of the ${first + v} parts`)), where).toBe(true)
      expect(words.some(w => w.includes(`${v} of the ${first + v} parts`)), where).toBe(true)
    }
  })
})

describe('section 2’s aside on a difference', () => {
  it('says the person with more parts gets more, and counts the parts in good English', () => {
    // It once said Ben got more in 5 : 3, and "1 parts are" in 4 : 5.
    const seen = new Set<string>()
    for (const p of allDraws(inv.parameters)) {
      const stage = inv.build(p)[1]
      if (seen.has(stage.ask)) continue
      seen.add(stage.ask)
      const [a, b] = stage.ask.match(/ratio (\d+) : (\d+)/)!.slice(1).map(Number)
      const body = stage.aside!.body
      expect(body, stage.ask).toMatch(a > b ? /Amy gets £[\d.]+ more than Ben/ : /Ben gets £[\d.]+ more than Amy/)
      expect(body, stage.ask).not.toMatch(/\b1 parts\b/)
    }
    expect(seen.size).toBe(4)
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
