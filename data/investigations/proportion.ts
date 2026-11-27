import type { Investigation, Params, Stage } from './types'
import type { GridLabel, RenderedAxis, RenderedGrid } from '../../lib/questions/gridDraw'
import { barModelGrid, fitLabel, labelHalfWidth } from '../../lib/skills/investigationFigures'
import type { BarFill, BarModel } from '../../lib/skills/investigationFigures'
import { baseFor, joinInputs, splitInputs } from '../../lib/skills/investigation'

// ─────────────────────────────────────────────────────────────────────────────
// Proportion — the fifth investigation.
//
// Chosen (2026-11-26) by docs/audit/32 D6's three tests: exam marks (172 over
// the 86 coded papers, second only to solving linear equations among skills
// with nothing yet), how many students meet it in practice (57, the most of
// any candidate, a third of their answers wrong), and the teaching order — it
// sits next to ratio, so the Ratio and Proportion stretch of a track gets two
// investigations rather than one.
//
// On the papers, proportion is almost never asked by name (the briefing,
// data/skillBriefings/proportion.ts). It is the unitary method wearing four
// costumes, and each section is one of them, from the traps the coded papers
// set:
//
//   1. Going through one — 4 pens cost £6, so 7 pens cost? Not £9: the extra
//      3 pens are not £3. Find one, then multiply.
//   2. Scaling a recipe — one multiplier, new ÷ old, for every ingredient,
//      and below 1 when the recipe shrinks. Not an egg per extra person.
//   3. Best buys — compare the price of ONE, never the price of the packs.
//   4. The most you can make — the ingredient that runs out first decides,
//      and only whole batches count, so round down.
//
// Inverse and algebraic (y = kx) proportion are their own skills
// (inverse_proportion, direct_proportion), so neither is a section here.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Section checks ──────────────────────────────────────────────────────────

/**
 * "a pens cost £(ac). How much would b pens cost?" (d1, numeric). Section 1
 * exactly; its traps are the count added on as pounds, the total multiplied
 * by b, and stopping at the price of one.
 */
const Q_PENS = 'f7e179b6-8dbe-4e55-9d08-d42bc35781be'
/**
 * "A recipe for a people uses (ac) g of flour. How much flour for b people?"
 * (d2, numeric). Section 2's recipe, with the additive trap and the division
 * the wrong way round.
 */
const Q_RECIPE = 'a653ffa7-038e-434e-90a5-d692e9fa8675'
/**
 * "Sam needs exactly N kitchen rolls. Pack A: a rolls for £x. Pack B: b rolls
 * for £y. Sam buys only the better-value pack. How much does Sam pay?" (d3,
 * numeric) — written for section 3 (scripts/draft-proportion.ts).
 *
 * It once asked for "the price of one roll in that pack", which named the
 * method the section checks (review, 2026-11-27). Now any way of comparing
 * reaches the answer, and naming the pack alone does not. Its seven traps are
 * the worse pack's total; one pack of either; either pack bought as many times
 * as the other would take; and a pack for every roll, of either.
 */
const Q_BEST_BUY = '4dc5016f-c058-4a7e-ba28-020012571dd7'
/**
 * "One batch uses f g of oats and b g of butter. Priya has F g and B g. What
 * is the greatest number of whole batches she can make?" (d2, numeric) —
 * written for section 4. Its traps are the other ingredient's batches, rounding
 * up, and — added at review (2026-11-27) — the other ingredient rounded up,
 * and either ingredient's batches left unrounded (to 1 dp and to 2 dp).
 */
const Q_BATCHES = 'b5a1cec5-2d8e-443a-9742-8dab8db7d69e'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Money, with pence only when there are any. */
function money(n: number): string {
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? `£${r}` : `£${r.toFixed(2)}`
}
/**
 * A price in pence, to a tenth of a penny where it does not come out whole —
 * but only under £1. Above that "148.8p" no longer fits an item's box, and a
 * tenth of a penny never decides anything there: every pack A is under 90p.
 */
function pence(p: number): string {
  if (p >= 99.95) return `${Math.round(p)}p`
  return `${+(Math.round(p * 10) / 10).toFixed(1)}p`
}
const exact = (x: number) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9
/** A number to two places, with "…" when it does not stop there. */
function dec(x: number): string {
  return exact(x) ? String(+x.toFixed(2)) : `${x.toFixed(2)}…`
}
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many)
/** Grams, with the thousands comma a paper prints: "1,100 g". */
const grams = (n: number) => `${n.toLocaleString('en-GB')} g`

// ─── Rows of items ───────────────────────────────────────────────────────────
//
// Sections 1 and 3 draw what is being bought: one box per item, with what one
// item costs written in every box. The boxes are all the same size, which is
// the whole idea — and the row for the number you want is visibly made of the
// same boxes as the row you were told about.
//
// A row is named ABOVE its boxes rather than in the margin: "4 pens cost £6"
// is too long for the margin ratio's "Amy" fits in. Names are centred over
// their rows, because labels are drawn centred and text placed by an
// ESTIMATED width lands off where it was aimed (it was tried: every name sat
// indented from its row).

/** 12 squares, 336 viewBox units: the widest the page shows at full size. */
const AX: RenderedAxis = { min: 0, max: 72, step: 6, label: '' }
const AY: RenderedAxis = { min: 0, max: 30, step: 6, label: '' }
const rowAxes = { x: AX, y: AY }
/** One item's width in axis units: 33.6 viewBox units, room for "£1.50" or "52.5p". */
const BOX = 7.2
const ROW_H = 5
/** The most items a row holds with its total still written after it. */
const ROW_MAX = 8
/** Bottom of the first row and of the second; the working fills what is under it. */
const ROW_Y = [20, 7] as const

type Row = {
  count: number
  /** What one item costs, written in every box. */
  each: string
  /** Named above the row. */
  head: string
  /** Written after the row, when it is the row being worked out. */
  total?: string
  fill: BarFill
}

function itemRows(rows: readonly [Row, Row], working: readonly string[]): RenderedGrid {
  const bars: BarModel[] = rows.map((r, k) => ({
    y: ROW_Y[k],
    height: ROW_H,
    pieces: [{ from: 0, to: r.count * BOX, fill: r.fill }],
    dividers: Array.from({ length: r.count + 1 }, (_, j) => j * BOX),
  }))
  const labels: GridLabel[] = []
  rows.forEach((r, k) => {
    const mid = ROW_Y[k] + ROW_H / 2
    labels.push({ x: fitLabel((r.count * BOX) / 2, r.head, AX), y: ROW_Y[k] + ROW_H, text: r.head, dy: -6 })
    for (let j = 0; j < r.count; j++) labels.push({ x: (j + 0.5) * BOX, y: mid, text: r.each, dy: 4 })
    if (r.total) labels.push({ x: r.count * BOX, y: mid, text: r.total, dx: labelHalfWidth(r.total) + 8, dy: 4 })
  })
  working.forEach((w, k) => labels.push({ x: fitLabel(AX.max / 2, w, AX), y: ROW_Y[1], text: w, dy: k === 0 ? 15 : 29 }))
  return barModelGrid({ x: AX, y: AY, bars, labels })
}

// ─── Stage 1: going through one ──────────────────────────────────────────────
//
// Every student can price ONE pen times seven. The step they skip is getting
// to one from four: told 4 pens cost £6, the commonest answer for 7 pens is
// £9 — three more pens, three more pounds — because the gap in the count is
// carried across as a gap in the money.
//
// The student changes how many pens they want. The row they were told about
// stays put, and the row they want is built of the same boxes, so every extra
// pen visibly adds the price of one pen, never £1.

/** [pens given, price of one pen in pounds, pens wanted]. Every option distinct. */
const S1 = [[4, 1.5, 7], [5, 1.2, 8], [3, 2.5, 5], [6, 0.8, 8]] as const

function stageOne(p: Params): Stage {
  const [n, each, m] = S1[p.s1]
  const total = n * each
  const pens = (k: number) => `${k} ${plural(k, 'pen')}`
  return {
    title: 'Going through one',
    ask: `${n} pens cost ${money(total)}. How much do ${m} pens cost?`,
    axes: rowAxes,
    predict: {
      prompt: `${m} pens cost…`,
      on: {
        kind: 'choice',
        options: [money(m * each), money(total + (m - n)), money(each)],
        correct: 0,
        // What the picked answer WAS, opening with it — the working is in
        // `explain`, shown straight after, and saying it here too printed it
        // twice (review lessons, 2026-11-27).
        wrong: [
          '',
          `${money(total + (m - n))} adds ${money(m - n)} for the ${m - n} extra pens, as if each pen `
            // "Not £1", never "more than £1": one set's pens are 80p (seen live).
            + `cost £1. They are ${money(each)} each here, so every extra pen adds ${money(each)}.`,
          `${money(each)} is ONE pen — the right thing to find first. ${m} pens cost ${m} times it.`,
        ],
      },
      right: `${money(m * each)} — ${m} pens at ${money(each)} each.`,
      explain: [
        `One pen costs ${money(total)} ÷ ${n} = ${money(each)}.`,
        `${m} pens cost ${m} × ${money(each)} = ${money(m * each)}.`,
      ],
    },
    control: {
      name: 'pens',
      verb: 'try',
      render: (drawn, current) => {
        const v = drawn[current] ?? m
        return itemRows([
          { count: n, each: money(each), head: `${n} pens cost ${money(total)}`, fill: 'shaded' },
          { count: v, each: money(each), head: pens(v), total: money(v * each), fill: 'light' },
        ], [
          `One pen: ${money(total)} ÷ ${n} = ${money(each)}`,
          `${pens(v)}: ${v} × ${money(each)} = ${money(v * each)}`,
        ])
      },
      prompt: `Keep the ${n} pens for ${money(total)}, and change how many pens you want. Watch `
        + 'what each extra pen adds to the cost.',
      hint: `Any whole number from 1 to ${ROW_MAX}.`,
      domain: { min: 1, max: ROW_MAX, step: 1 },
      suggest: [1, 2 * n <= ROW_MAX && 2 * n !== m ? 2 * n : 2],
      label: v => pens(v),
      row: v => [String(v), money(v * each), money(each)],
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second number of pens, so you can see what one more pen adds.'
        : null),
    },
    observe: { headers: ['pens', 'cost', 'cost ÷ pens'] },
    conclude: {
      sentence: ['To find the cost of any number, first find ', ', then ', '.'],
      slots: [
        {
          options: ['the cost of one', 'how many more you want'],
          correct: 0,
          diagnosis: [
            '',
            'How many more you want is a number of pens, not of pounds. Until you know what one '
            + 'pen costs, you cannot say what the extra pens add.',
          ],
          misconception: ['', 'added_instead_of_operating'],
        },
        {
          options: ['multiply it by how many you want', 'add on the number of extra ones'],
          correct: 0,
          diagnosis: [
            '',
            `Adding the extra pens as pounds treats every pen as £1. Each pen adds ${money(each)} `
            + `here — the "cost ÷ pens" column is the same on every row.`,
          ],
          misconception: ['', 'added_instead_of_operating'],
        },
      ],
      because: 'Every pen costs the same, so the cost is the price of one pen counted as many times '
        + 'as there are pens. Twice the pens is twice the cost; one more pen is one more of that '
        + 'price. Getting to one first turns any question like this into a single multiplication.',
    },
    naming: {
      term: 'the unitary method',
      means: 'Going through ONE: finding what one item costs, then multiplying by how many you '
        + 'want. That is what the "cost ÷ pens" column found on every row.',
      elsewhere: 'Unit means one — from the Latin unus, which also gives unite, unique and '
        + 'universe. Supermarket shelf labels do it for you: "£1.20 per kg" is the unitary method '
        + 'printed under the price.',
      onThePaper: 'Questions never name it. "8 identical pens cost £3.60. Work out the cost of 14 '
        + 'pens." The method mark is for the cost of one.',
    },
    check: [
      {
        questionId: Q_PENS,
        because: 'The section exactly: a number of items, their cost, and the cost of another '
          + 'number. Its traps are the count added on as pounds, the total multiplied, and '
          + 'stopping at one.',
      },
    ],
  }
}

// ─── Stage 2: scaling a recipe ───────────────────────────────────────────────
//
// The same idea with several quantities at once, which is how the papers set
// it: a recipe for 4 and a question about 6. Finding "per person" for each
// ingredient works, but the move worth having is the MULTIPLIER — new ÷ old
// — because one number then scales everything, and it is below 1 when the
// recipe shrinks. The trap is additive: two more people, two more eggs.
//
// Table only. Section 1's rows were one quantity; here the point is that the
// same multiplier runs down every column of the table at once.

/** [people the recipe is for, eggs, people wanted]. People 2, 4 or 5, so every multiplier is a short decimal. */
const S2 = [[4, 6, 6], [2, 3, 8], [5, 2, 10], [4, 2, 10]] as const
/** Flour and milk per person: the same in every scenario, so the eggs are the only surprise. */
const FLOUR = 75
const MILK = 50

function stageTwo(p: Params): Stage {
  const [n, eggs, m] = S2[p.s2]
  const times = m / n
  const eggsFor = (k: number) => (eggs * k) / n
  return {
    title: 'Scaling a recipe',
    ask: `A recipe for ${n} people uses ${FLOUR * n} g of flour, ${MILK * n} ml of milk and ${eggs} `
      + `eggs. How many eggs are needed for ${m} people?`,
    predict: {
      prompt: `For ${m} people you need…`,
      on: {
        kind: 'choice',
        options: [`${dec(eggsFor(m))} eggs`, `${eggs + m - n} eggs`, `${eggs * m} eggs`],
        correct: 0,
        wrong: [
          '',
          `${eggs + m - n} eggs adds an egg for each of the ${m - n} extra people. But the recipe `
            + `does not use one egg a person — ${n} people share ${eggs} eggs.`,
          `${eggs * m} eggs is ${eggs} eggs for EACH of ${m} people. The ${eggs} eggs are for all `
            + `${n} of them together.`,
        ],
      },
      right: `${dec(eggsFor(m))} eggs — ${dec(times)} times the recipe.`,
      explain: [
        `${m} people is ${m} ÷ ${n} = ${dec(times)} times as many as ${n}.`,
        `So everything is ${dec(times)} times as much: ${eggs} × ${dec(times)} = ${dec(eggsFor(m))} eggs.`,
      ],
    },
    control: {
      name: 'people',
      prompt: `Keep the recipe for ${n}, and change how many people it has to feed. Watch the `
        + 'multiplier, and what it does to every ingredient at once — with more people, and '
        + `with fewer than ${n}.`,
      hint: 'Any whole number from 1 to 12.',
      domain: { min: 1, max: 12, step: 1 },
      suggest: [12, 1],
      label: v => `${v} ${plural(v, 'person', 'people')}`,
      row: v => [String(v), `× ${dec(v / n)}`, `${FLOUR * v} g`, `${MILK * v} ml`, dec(eggsFor(v))],
      coverage: drawn => {
        if (!drawn.some(v => v > n)) return `Try more than ${n} people.`
        if (!drawn.some(v => v < n)) return `Now try fewer than ${n} people, to see the recipe shrink.`
        return null
      },
    },
    observe: { headers: ['people', 'multiplier', 'flour', 'milk', 'eggs'] },
    conclude: {
      sentence: ['To scale a recipe, multiply every ingredient by ', '. For fewer people, that '
        + 'multiplier is ', '.'],
      slots: [
        {
          options: ['the new number of people ÷ the old number', 'the new number of people − the old number'],
          correct: 0,
          diagnosis: [
            '',
            'Taking away gives how many MORE people there are, which says nothing about how many '
            + `times bigger the group is. ${2 * n} people is twice ${n}, whatever the gap.`,
          ],
          misconception: ['', 'added_instead_of_operating'],
        },
        {
          options: ['less than 1, so every amount shrinks', 'still more than 1'],
          correct: 0,
          diagnosis: [
            '',
            `Fewer people need less of everything, so the multiplier is below 1: for 1 person `
            + `instead of ${n}, × ${dec(1 / n)}.`,
          ],
          misconception: ['', ''],
        },
      ],
      because: 'Every ingredient is for the same people, so they all scale together: twice the '
        + 'people, twice of everything; half the people, half of everything. The multiplier is how '
        + 'many times bigger the new group is — new ÷ old — and the same number works for the '
        + 'flour, the milk and the eggs. Adding an egg a person would keep the eggs the same '
        + 'number ahead of the people, which no recipe does.',
    },
    check: [
      {
        questionId: Q_RECIPE,
        because: 'A recipe scaled to a new number of people. Its traps are the people added on, '
          + 'and dividing the wrong way round.',
      },
    ],
  }
}

// ─── Stage 3: best buys ──────────────────────────────────────────────────────
//
// Two packs at two prices: which is better value? The traps are the cheaper
// pack (comparing the packs' prices, which are for different numbers of
// things) and the bigger pack. Neither is the comparison: the price of ONE.
//
// The student changes how many rolls are in pack B, at the same price. The
// pack's price never moves, and the better buy still flips — so the price of
// a pack cannot be what decides it.

/** [rolls in A, A's price in pence, rolls in B, B's price in pence]. */
const S3 = [[4, 300, 6, 420], [5, 400, 7, 595], [3, 240, 5, 400], [6, 450, 4, 280]] as const

/** Which pack is better value, from the price of one in each. */
function better(a: number, pa: number, b: number, pb: number): 'A' | 'B' | null {
  const d = pa / a - pb / b
  return Math.abs(d) < 1e-9 ? null : d > 0 ? 'B' : 'A'
}

function stageThree(p: Params): Stage {
  const [a, pa, b, pb] = S3[p.s3]
  const answer = better(a, pa, b, pb)
  const options = ['Pack A', 'Pack B', 'They are the same value']
  const correct = answer === 'A' ? 0 : answer === 'B' ? 1 : 2
  const oneA = pence(pa / a)
  const oneB = pence(pb / b)
  return {
    title: 'Best buys',
    ask: `Pack A has ${a} rolls for ${money(pa / 100)}. Pack B has ${b} rolls for ${money(pb / 100)}. `
      + 'Which is better value?',
    axes: rowAxes,
    predict: {
      prompt: 'The better value is…',
      on: {
        kind: 'choice',
        options,
        correct,
        // What the picked answer WAS, never the working — that follows in
        // `explain`, and saying it here too printed it twice (seen live).
        // A pack picked wrongly is either the cheaper pack, with fewer rolls,
        // or the dearer one with more: one with both would simply be better.
        wrong: options.map((_, i) => {
          if (i === correct) return ''
          if (i === 2) return 'A roll costs a different amount in each pack, so one of them is better value.'
          const pick = i === 0 ? 'A' : 'B'
          const [mine, theirs] = i === 0 ? [a, b] : [b, a]
          return (i === 0 ? pa < pb : pb < pa)
            ? `Pack ${pick} is the cheaper PACK, but it holds ${mine} rolls to the other's ${theirs}. `
              + 'Two prices for different numbers of rolls cannot be compared as they are.'
            : `Pack ${pick} has more rolls, but more rolls cost more too. Which is better value `
              + 'depends on what ONE roll costs in each.'
        }),
      },
      right: answer ? `Pack ${answer} — ${answer === 'A' ? oneA : oneB} a roll against `
        + `${answer === 'A' ? oneB : oneA}.` : `The same — ${oneA} a roll in both.`,
      explain: [
        `One roll costs ${money(pa / 100)} ÷ ${a} = ${oneA} in A, and ${money(pb / 100)} ÷ ${b} `
          + `= ${oneB} in B.`,
        answer ? `A roll is cheaper in pack ${answer}, so pack ${answer} is better value.`
          : 'A roll costs the same in both, so neither is better value.',
      ],
    },
    control: {
      name: 'rolls in pack B',
      verb: 'try',
      render: (drawn, current) => {
        const v = drawn[current] ?? b
        const win = better(a, pa, v, pb)
        return itemRows([
          { count: a, each: pence(pa / a), head: `Pack A: ${a} rolls for ${money(pa / 100)}`, fill: 'shaded' },
          { count: v, each: pence(pb / v), head: `Pack B: ${v} ${plural(v, 'roll')} for ${money(pb / 100)}`, fill: 'light' },
        ], [
          `One roll: ${pence(pa / a)} in A, ${pence(pb / v)} in B`,
          win ? `Pack ${win} is better value` : 'The same value',
        ])
      },
      prompt: `Keep pack B at ${money(pb / 100)}, and change how many rolls are in it. Watch the `
        + 'price of one roll, and which pack is better value.',
      hint: `Any whole number from 1 to ${ROW_MAX}.`,
      domain: { min: 1, max: ROW_MAX, step: 1 },
      suggest: [ROW_MAX, 2],
      label: v => `${v} ${plural(v, 'roll')}`,
      row: v => {
        const win = better(a, pa, v, pb)
        return [String(v), pence(pa / a), pence(pb / v), win ? `pack ${win}` : 'the same']
      },
      coverage: drawn => {
        const wins = new Set(drawn.map(v => better(a, pa, v, pb)))
        return wins.has('A') && wins.has('B')
          ? null
          : `Find a size of pack B that makes pack ${wins.has('A') ? 'B' : 'A'} the better buy.`
      },
    },
    observe: { headers: ['rolls in B', 'one roll in A', 'one roll in B', 'better value'] },
    conclude: {
      sentence: ['To find the better buy, work out ', ' in each pack. The better buy is the one where ', '.'],
      slots: [
        {
          options: ['the price of one item', 'the price of the pack'],
          correct: 0,
          diagnosis: [
            '',
            `Pack B's price never changed in your table, and the better buy still changed. Two packs `
            + 'hold different numbers of things, so their prices are not comparable until you '
            + 'bring each down to one.',
          ],
          misconception: ['', 'compared_unlike_quantities'],
        },
        {
          options: ['one item costs less', 'the pack has more in it'],
          correct: 0,
          diagnosis: [
            '',
            'More in the pack costs more too. Whether it is better value depends on what each one '
            + 'costs, and a bigger pack can cost more per item.',
          ],
          misconception: ['', ''],
        },
      ],
      because: 'Value for money is what you pay for each thing you get. A pack price is for a '
        + 'different number of things in each pack, so it cannot be compared; the price of one '
        + 'can. Dividing the other way — how many rolls per pound — works too, and then the bigger '
        + 'number wins.',
    },
    naming: {
      term: 'the unit price',
      means: 'The price of one item, or of one kilogram or one litre — the "one roll" columns in '
        + 'your table. Comparing unit prices is how a best buy is decided.',
      elsewhere: 'Shops have to print it: the small "per 100 g" or "per kg" figure on a shelf label '
        + 'is the unit price, there so that different pack sizes can be compared.',
      onThePaper: '"Which pack is better value for money? You must show your working." The marks '
        + 'are for the two comparable figures, not for naming the pack — a choice with no working '
        + 'scores nothing.',
    },
    check: [
      {
        questionId: Q_BEST_BUY,
        because: 'The section exactly: two packs, two prices, and a decision about which is better '
          + 'value — without being told to compare the price of one. Its traps are the worse '
          + 'pack\'s total, one pack of either, and the wrong number of packs of either.',
      },
    ],
  }
}

// ─── Stage 4: the most you can make ──────────────────────────────────────────
//
// A recipe needs some of every ingredient, and you have a stock of each. How
// many whole batches can you make? Two traps, both on the papers: working
// from the ingredient you have most of, and rounding 3.6 batches to 4. The
// first ingredient to run out decides, and a batch you cannot finish is not a
// batch.
//
// Table only. The student changes BOTH stocks, flour and butter, in tens of
// grams (review lessons, 2026-11-27: one quantity in 50s was the preset steps
// and the single knob the earlier tutorials' reviews took out). The table
// shows each ingredient's batches side by side, so they make one run out
// first, then the other. Tens, not single grams: two boxes of 1,500 values
// would be 2.25 million pairs for the tests to walk; tens are 22,500.

/** [flour per batch, butter per batch, flour in stock, butter in stock], all grams. */
const S4 = [[200, 150, 1000, 500], [250, 100, 1500, 450], [300, 125, 1100, 900], [150, 200, 800, 1500]] as const
const STOCK = { min: 10, max: 1500, step: 10 }
const STOCK_BASE = baseFor(STOCK.max)

function stageFour(p: Params): Stage {
  const [fl, bu, F, B] = S4[p.s4]
  const batches = (f: number, b: number) => ({ flour: f / fl, butter: b / bu })
  const whole = (f: number, b: number) => Math.floor(Math.min(f / fl, b / bu))
  /** The ingredient that runs out first; flour on a tie, when both do at once. */
  const short = (f: number, b: number): 'flour' | 'butter' => (b / bu < f / fl ? 'butter' : 'flour')
  const stocks = (v: number) => splitInputs(v, 2, STOCK_BASE) as [number, number]
  const answer = whole(F, B)
  const other = Math.floor(Math.max(F / fl, B / bu))
  const runsOut = short(F, B)
  const lasts = runsOut === 'butter' ? 'flour' : 'butter'
  return {
    title: 'The most you can make',
    ask: `One batch of biscuits uses ${grams(fl)} of flour and ${grams(bu)} of butter. Sam has `
      + `${grams(F)} of flour and ${grams(B)} of butter. How many whole batches can Sam make?`,
    predict: {
      prompt: 'Sam can make…',
      on: {
        kind: 'choice',
        options: [`${answer} batches`, `${other} batches`, `${answer + 1} batches`],
        correct: 0,
        // What the picked answer WAS, opening with it; the working follows in
        // `explain` (review lessons, 2026-11-27).
        wrong: [
          '',
          `${other} batches is what the ${lasts} would make on its own. But every batch needs both, `
            + `and the ${runsOut} runs out first.`,
          `${answer + 1} batches rounds up. The last batch would be short of ${runsOut}, so it `
            + 'cannot be made.',
        ],
      },
      right: `${answer} batches — the ${runsOut} runs out first.`,
      // Every line ends on a word: "= 3.67…." printed a doubled stop.
      explain: [
        `The flour makes ${F} ÷ ${fl} = ${dec(batches(F, B).flour)} batches.`,
        `The butter makes ${B} ÷ ${bu} = ${dec(batches(F, B).butter)} batches.`,
        `The ${runsOut} runs out first, so Sam can make ${answer} whole batches.`,
      ],
    },
    control: {
      name: 'what Sam has',
      inputs: ['flour', 'butter'],
      inputUnit: 'g',
      prompt: 'Change how much flour and how much butter Sam has. Watch which ingredient decides '
        + 'how many batches — and what happens to a batch there is not quite enough for.',
      hint: 'Any amounts from 10 g to 1,500 g, in tens.',
      domain: STOCK,
      // One where the butter runs out first, one where the flour does, in
      // every scenario, and at least one batch from each: 1,500 g of flour
      // against 300 g of butter, and 300 g of flour against 1,500 g of butter.
      // (100 g of butter made 0 batches where a batch takes 125 g — seen live.)
      suggest: [joinInputs([1500, 300], STOCK_BASE), joinInputs([300, 1500], STOCK_BASE)],
      label: v => {
        const [f, b] = stocks(v)
        return `${grams(f)} flour, ${grams(b)} butter`
      },
      row: v => {
        const [f, b] = stocks(v)
        return [grams(f), grams(b), dec(f / fl), dec(b / bu), String(whole(f, b))]
      },
      coverage: drawn => {
        const first = new Set(drawn.map(v => short(...stocks(v))))
        if (first.size === 2) return null
        return first.has('butter')
          ? 'Now make the flour run out first.'
          : 'Now make the butter run out first.'
      },
    },
    observe: {
      // Short, in the working's own words ("The flour makes 5.33… batches"):
      // the long ones made the table 640px wide on a 302px phone column.
      headers: ['flour', 'butter', 'flour makes', 'butter makes', 'whole batches'],
    },
    conclude: {
      sentence: ['The most you can make is decided by ', ', and you can only make ', '.'],
      slots: [
        {
          options: ['the ingredient that runs out first', 'the ingredient you have most of'],
          correct: 0,
          diagnosis: [
            '',
            'Every batch needs some of each. Once one ingredient is used up you stop, however much '
            + 'of the other is left — so it is the SMALLER number of batches that counts.',
          ],
          misconception: ['', 'answered_a_different_quantity'],
        },
        {
          options: ['whole batches, so round down', 'the nearest whole batch, so round as usual'],
          correct: 0,
          diagnosis: [
            '',
            '3.8 batches of butter makes 3 batches: the fourth would be short. Here the question '
            + 'decides which way to round, and it is always down.',
          ],
          misconception: ['', ''],
        },
      ],
      because: 'Each batch takes its share of every ingredient, so you can keep going only while '
        + 'all of them last. Work out how many batches each one would make on its own; the '
        + 'smallest is the answer, rounded down, because a batch you cannot finish is not a batch.',
    },
    check: [
      {
        questionId: Q_BATCHES,
        because: 'The section exactly: two ingredients, two stocks, and the greatest number of '
          + 'whole batches. Its traps are the other ingredient\'s batches, rounding up (either '
          + 'ingredient), and the batches left unrounded.',
      },
    ],
  }
}

export const proportionInvestigation: Investigation = {
  skillId: 'proportion',
  title: 'Proportion',
  invite: 'you change the numbers in a shop and a kitchen yourself and work out the rule, rather '
    + 'than being told it.',
  outcomes: {
    lead: 'Two amounts are in proportion when they grow together: twice the pens, twice the '
      + 'cost. It is on every Foundation paper, almost never by name — as a recipe, a best buy or '
      + 'a price list — and nearly every one comes down to finding what ONE is worth.',
    // One measurable verb each (lib/skills/bloom.ts): calculate, use, compare,
    // find — and explain, the rule section 1 has the student put into words.
    points: [
      'calculate the cost of any number of items from the cost of a few',
      'use one multiplier to scale every ingredient in a recipe, up or down',
      'compare two packs to decide which is better value',
      'find the greatest number of batches you can make from what you have',
      'explain why 7 pens do not cost £3 more than 4 pens costing £6',
    ],
  },
  underConstruction: 'This one is new and still being worked on. The maths is right, but the '
    + 'wording and the questions at the end of each section may still change.',
  parameters: {
    // One authored scenario per section, by index, so every number divides
    // exactly and the space stays small enough for the tests to walk.
    values: {
      s1: [0, 1, 2, 3],
      s2: [0, 1, 2, 3],
      s3: [0, 1, 2, 3],
      s4: [0, 1, 2, 3],
    },
  },
  build: p => [stageOne(p), stageTwo(p), stageThree(p), stageFour(p)],
  /**
   * The handover: proportion inside something else, as the papers set it once
   * it stops being asked plainly — a best buy with a percentage off, and a
   * machine's rate with a unit to convert.
   */
  transferQuestionIds: [
    '7a289a0d-e649-49d5-9777-b379d8971de0',  // best buy, then a percentage discount (d4)
    '1c9336cc-b9e4-4e1f-a6f6-f02626063b6a',  // a filling rate, scaled and converted (d4)
  ],
  /**
   * The sections that teach this skill's other published questions
   * (docs/audit/33, D1). The checks map themselves.
   */
  questionSections: {
    // Best buys between two shops.
    'e83de5b6-b512-4054-a861-b758cc4a247f': 3,
    '7a289a0d-e649-49d5-9777-b379d8971de0': 3,
    // Most crowded: comparing per km², a unit price in another coat.
    'd755a649-bb08-459b-9460-9ed169efffdc': 3,
    // Bottles every few minutes, for hours: through one, then multiply.
    '1c9336cc-b9e4-4e1f-a6f6-f02626063b6a': 1,
  },
}
