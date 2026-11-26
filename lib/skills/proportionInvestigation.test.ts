import { describe, it, expect } from 'vitest'
import { proportionInvestigation as inv } from '../../data/investigations/proportion'
import { allDraws, controlValues } from './investigation'
import { labelHalfWidth } from './investigationFigures'
import { CELL } from '../questions/gridSvg'
import type { RenderedGrid } from '../questions/gridDraw'

/**
 * Proportion. Sections 1 and 3 draw rows of items with what one costs in every
 * box; sections 2 and 4 are tables. Every number the student is shown is
 * checked against the arithmetic it claims, for every value every section
 * allows — the argument is that the boxes are all the same, and a box that
 * says the wrong price would be the one thing the student believes.
 */

/** Each section's stage, once per scenario. */
function stages(section: number) {
  const seen = new Set<string>()
  return allDraws(inv.parameters)
    .map(p => inv.build(p)[section])
    .filter(s => (seen.has(s.ask) ? false : (seen.add(s.ask), true)))
}

const rects = (g: RenderedGrid) =>
  [...g.background.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/g)].map(m => m.slice(1).map(Number))
const words = (g: RenderedGrid) => (g.labels ?? []).map(l => l.text)
/** A number as the page prints it, thousands comma and all. */
const num = (s: string) => Number(s.replace(/,/g, ''))
const BOX = 7.2
const boxPx = BOX * (CELL / 6)
const figureWidthPx = (g: RenderedGrid) => (g.x.max - g.x.min) * (CELL / g.x.step)

/** Every label inside the figure's width, and every value inside its box. */
function expectFits(where: string, g: RenderedGrid, inBoxes: readonly string[]) {
  for (const w of words(g)) {
    expect(2 * labelHalfWidth(w), `${where}: "${w}" is wider than the figure`).toBeLessThanOrEqual(figureWidthPx(g))
  }
  for (const t of inBoxes) {
    expect(2 * labelHalfWidth(t), `${where}: "${t}" does not fit an item's box`).toBeLessThanOrEqual(boxPx - 1)
  }
}

describe('the words', () => {
  it('never ends a sentence on "…." — a number that does not stop, then a full stop', () => {
    for (const p of allDraws(inv.parameters)) {
      for (const stage of inv.build(p)) {
        const on = stage.predict.on
        const text = [stage.ask, ...stage.predict.explain, stage.predict.right,
          ...(on.kind === 'choice' ? on.wrong : [])]
        for (const t of text) expect(t, stage.ask).not.toMatch(/…\./)
      }
    }
  })
})

describe('section 1: going through one', () => {
  it('draws the row you were told about and the row you want, the same price in every box', () => {
    let checked = 0
    for (const stage of stages(0)) {
      const [, n, total] = stage.ask.match(/^(\d+) pens cost £(\d+(?:\.\d+)?)\./)!.map(Number)
      const each = total / n
      const c = stage.control!
      for (const v of controlValues(c)) {
        const where = `${stage.ask} — ${v} pens`
        const g = c.render!([v], 0)
        expect(rects(g).map(r => +r[2].toFixed(4)), where).toEqual([n, v].map(k => +(k * BOX).toFixed(4)))
        const price = `£${each.toFixed(2).replace(/\.00$/, '')}`
        const inBoxes = words(g).filter(w => w === price)
        expect(inBoxes.length, `${where}: not every pen has its price`).toBeGreaterThanOrEqual(n + v)
        // The row's total is v times the price of one, to the penny.
        const after = words(g).filter(w => /^£[\d.]+$/.test(w) && w !== price)
        const totals = after.length ? after : [price]
        expect(totals.some(t => Math.abs(Number(t.slice(1)) - v * each) < 0.005), where).toBe(true)
        expect(c.row!(v)[2], `${where}: cost ÷ pens is not the price of one`).toBe(price)
        expectFits(where, g, inBoxes)
        checked++
      }
    }
    expect(checked).toBe(4 * 8)
  })

  it('never lets the additive answer equal the right one', () => {
    for (const stage of stages(0)) {
      const on = stage.predict.on
      if (on.kind !== 'choice') throw new Error('section 1 predicts from options')
      expect(new Set(on.options).size, stage.ask).toBe(3)
    }
  })
})

describe('section 2: scaling a recipe', () => {
  it('scales every ingredient by the one multiplier, new ÷ old', () => {
    for (const stage of stages(1)) {
      const [, n, flour, milk, eggs] = stage.ask
        .match(/recipe for (\d+) people uses (\d+) g of flour, (\d+) ml of milk and (\d+) eggs/)!.map(Number)
      for (const v of controlValues(stage.control!)) {
        const [people, times, f, mk, e] = stage.control!.row!(v)
        const k = v / n
        expect(Number(people)).toBe(v)
        expect(Number(times.replace('× ', '')), stage.ask).toBeCloseTo(k, 2)
        expect(Number(f.replace(' g', '')), stage.ask).toBeCloseTo(flour * k, 6)
        expect(Number(mk.replace(' ml', '')), stage.ask).toBeCloseTo(milk * k, 6)
        expect(Number(e.replace('…', '')), stage.ask).toBeCloseTo(eggs * k, 2)
      }
    }
  })

  it('opens the rule only once the recipe has grown AND shrunk', () => {
    for (const stage of stages(1)) {
      const n = Number(stage.ask.match(/recipe for (\d+) people/)![1])
      const c = stage.control!
      expect(c.coverage([n + 1, n + 2]), stage.ask).toMatch(/fewer/)
      expect(c.coverage([n - 1]), stage.ask).toMatch(/more/)
      expect(c.coverage([n - 1, n + 1]), stage.ask).toBeNull()
    }
  })
})

describe('section 3: best buys', () => {
  it('decides from the price of one, and shows two different prices whenever one pack wins', () => {
    let checked = 0
    for (const stage of stages(2)) {
      const [, a, pa, , pb] = stage.ask
        .match(/Pack A has (\d+) rolls for £(\d+(?:\.\d+)?)\. Pack B has (\d+) rolls for £(\d+(?:\.\d+)?)\./)!.map(Number)
      const c = stage.control!
      for (const v of controlValues(c)) {
        const where = `${stage.ask} — ${v} rolls in B`
        const [, oneA, oneB, verdict] = c.row!(v)
        const exact = pa / a - pb / v
        const want = Math.abs(exact) < 1e-9 ? 'the same' : exact > 0 ? 'pack B' : 'pack A'
        expect(verdict, where).toBe(want)
        if (want !== 'the same') expect(oneA, `${where}: rounding hides the difference`).not.toBe(oneB)
        const g = c.render!([v], 0)
        expect(rects(g).map(r => +r[2].toFixed(4)), where).toEqual([a, v].map(k => +(k * BOX).toFixed(4)))
        const inBoxes = words(g).filter(w => w === oneA || w === oneB)
        expect(inBoxes.length, `${where}: not every roll has its price`).toBeGreaterThanOrEqual(a + v)
        expect(words(g).some(w => w.includes(want === 'the same' ? 'The same value' : `Pack ${want.slice(-1)} is better`)), where).toBe(true)
        expectFits(where, g, inBoxes)
        checked++
      }
    }
    expect(checked).toBe(4 * 8)
  })

  it('can always be made to flip, so the rule can open', () => {
    for (const stage of stages(2)) {
      expect(stage.control!.coverage(controlValues(stage.control!)), stage.ask).toBeNull()
    }
  })

  it('says what a wrong pick was, and leaves the working to the explanation', () => {
    // The working once sat in every wrong response as well as under it, and
    // printed twice on the page.
    for (const stage of stages(2)) {
      const on = stage.predict.on
      if (on.kind !== 'choice') throw new Error('section 3 predicts from options')
      const [, a, pa, b, pb] = stage.ask
        .match(/Pack A has (\d+) rolls for £(\d+(?:\.\d+)?)\. Pack B has (\d+) rolls for £(\d+(?:\.\d+)?)\./)!.map(Number)
      on.wrong.forEach((w, i) => {
        if (i === on.correct) return
        expect(w, stage.ask).not.toMatch(/÷/)
        if (i === 2) return
        // A pack picked wrongly is the cheaper one with fewer rolls, or the
        // dearer one with more — what its response claims.
        const [mine, theirs, myPrice, theirPrice] = i === 0 ? [a, b, pa, pb] : [b, a, pb, pa]
        if (/cheaper PACK/.test(w)) expect(myPrice < theirPrice && mine < theirs, `${stage.ask}: ${w}`).toBe(true)
        else expect(myPrice > theirPrice && mine > theirs, `${stage.ask}: ${w}`).toBe(true)
      })
    }
  })

  it('marks the prediction the same way the table decides', () => {
    for (const stage of stages(2)) {
      const on = stage.predict.on
      if (on.kind !== 'choice') throw new Error('section 3 predicts from options')
      const b = Number(stage.ask.match(/Pack B has (\d+) rolls/)![1])
      const verdict = stage.control!.row!(b)[3]
      expect(on.options[on.correct], stage.ask)
        .toBe(verdict === 'the same' ? 'They are the same value' : `Pack ${verdict.slice(-1)}`)
    }
  })
})

describe('section 4: the most you can make', () => {
  it('takes the smaller number of batches, rounded down', () => {
    for (const stage of stages(3)) {
      const [, fl, bu, F] = stage.ask
        .match(/uses ([\d,]+) g of flour and ([\d,]+) g of butter\. Sam has ([\d,]+) g of flour/)!.map(num)
      for (const v of controlValues(stage.control!)) {
        const [, byFlour, byButter, whole] = stage.control!.row!(v)
        expect(Number(byFlour.replace('…', '')), stage.ask).toBeCloseTo(F / fl, 2)
        expect(Number(byButter.replace('…', '')), stage.ask).toBeCloseTo(v / bu, 2)
        expect(Number(whole), `${stage.ask} — ${v} g`).toBe(Math.floor(Math.min(F / fl, v / bu)))
      }
    }
  })

  it('has the right answer, the other ingredient and rounding up as three different options', () => {
    for (const stage of stages(3)) {
      const on = stage.predict.on
      if (on.kind !== 'choice') throw new Error('section 4 predicts from options')
      expect(new Set(on.options).size, stage.ask).toBe(3)
      const B = num(stage.ask.match(/and ([\d,]+) g of butter\. How many/)![1])
      expect(on.options[on.correct], stage.ask).toBe(`${stage.control!.row!(B)[3]} batches`)
    }
  })

  it('opens the rule only once each ingredient has run out first', () => {
    for (const stage of stages(3)) {
      const c = stage.control!
      expect(c.coverage([50]), stage.ask).toMatch(/flour runs out first/)
      expect(c.coverage([1500]), stage.ask).toMatch(/runs out first/)
      expect(c.coverage([50, 1500]), stage.ask).toBeNull()
    }
  })
})
