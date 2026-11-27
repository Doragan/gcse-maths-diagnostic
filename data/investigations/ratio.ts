import type { Investigation, Params, Stage } from './types'
import type { GridLabel, RenderedAxis, RenderedGrid } from '../../lib/questions/gridDraw'
import { barModelGrid, fitLabel, labelHalfWidth } from '../../lib/skills/investigationFigures'
import { joinInputs, splitInputs } from '../../lib/skills/investigation'
import type { BarFill, BarModel } from '../../lib/skills/investigationFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Sharing in a ratio — the fourth investigation.
//
// Chosen by exam marks: ratio carries 426 across the 86-paper corpus, more
// than any other skill. It waited on a labelled, proportionally split bar
// model, which compound units' section 3 then built.
//
// One picture throughout, the one ratio questions are taught with: a row of
// equal boxes for each person, as many boxes as their number in the ratio.
// Once ONE part is known its value fills every box, and every share is read
// off the rows. Section 3 joins the rows into one bar, to show a share as a
// fraction of the whole.
//
// Four sections, from the traps the papers set (data/exam-audit):
//
//   1. Sharing an amount — add the numbers to count the parts, divide the
//      amount by that. Not £3 and £5, not half each.
//   2. Knowing one share — the share you know is THAT person's parts, so
//      divide by their number, not by the total of the ratio; and the gap
//      between two shares is parts, not pounds.
//   3. Ratios and fractions — in 3 : 5 the first share is 3/8 of the whole,
//      not 3/5: the most common ratio trap on the papers.
//   4. Three people, and a difference — the difference between two shares is
//      a number of parts too.
//
// Simplifying ratios is its own skill (simplifying_ratio, a prerequisite) and
// proportion is another, so neither is a section here.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Section checks ──────────────────────────────────────────────────────────

/**
 * "Share £(a+b)c in the ratio a : b. What is the larger share?" (d2, numeric)
 *
 * Section 1 exactly. Its traps are the smaller share, an equal split, a ratio
 * number given as the share, and one part given as the share.
 */
const Q_SHARE = '2471f835-e678-4793-9f29-bcd3d94724a8'

/**
 * "Amy and Ben share some money in the ratio a : b. Ben gets £X. How much does
 * Amy get?" (d2, numeric) — written for section 2 (scripts/draft-ratio.ts).
 *
 * Its traps are the five wrong ways in: keeping the gap in pounds, the whole
 * amount, one part, Ben's share divided by Amy's number, and Ben's share
 * shared out as if it were all the money (added at review).
 */
const Q_ONE_SHARE = '1af11a98-9049-4937-b626-e1c01d18609f'
/**
 * "Red and blue counters in the ratio a : b. What fraction of the counters are
 * red?" (d2, fraction) — written for section 3.
 *
 * Its first trap is red/blue, the ratio written as a fraction: the commonest
 * ratio trap on the papers, and the one this section exists to undo.
 */
const Q_AS_FRACTION = 'a99e08d4-0f23-49af-8c90-6ae67f2764b7'
/**
 * "2/5 of the counters are red, the rest blue. Write down the ratio of red to
 * blue." (d2, ratio) — written for section 3's other direction.
 *
 * What lets section 3's card on going back from a fraction to a ratio stay:
 * a reviewer asked for nothing brought up that no check then tests. Traps: the fraction
 * written as a ratio (2 : 5), the right numbers reversed (3 : 2), and the
 * blue counters against the whole (3 : 5).
 */
const Q_FRACTION_TO_RATIO = '02fc16a0-8ec3-4ae8-bd94-630553c05fef'

/**
 * "Amy, Ben and Cara share some money in the ratio a : b : c. Cara gets £X more
 * than Amy. How much does Ben get?" (d3, numeric) — written for section 4.
 *
 * Seven traps: the difference shared as if it were the total, taken as one
 * part, one part itself, the total, and — added at review — the £X read as
 * Amy's, Cara's or Ben's own share. Its six scenarios keep all eight answers
 * apart.
 */
const Q_DIFFERENCE = '2755b440-c12c-4922-ae48-4b39c118f8eb'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Money, with pence only when there are any. */
function money(n: number): string {
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? `£${r}` : `£${r.toFixed(2)}`
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
/** n/d as prose markup: stacked, in lowest terms. */
function fracMark(n: number, d: number): string {
  const g = gcd(n, d)
  return d / g === 1 ? String(n / g) : `{${n / g}/${d / g}}`
}

// ─── The bar model ───────────────────────────────────────────────────────────
//
// One row of equal boxes per person. Every box is one part, the same size in
// every row — which is the whole idea of a ratio, and the thing a student who
// shares £40 as £3 and £5, or as £20 each, has not got.
//
// Plain paper, 0–60 across in boxes of 6, so ten boxes fill a row. The names
// sit in the left margin, each share to the right of its row, and the working
// underneath.

const AX: RenderedAxis = { min: 0, max: 60, step: 6, label: '' }
/**
 * One part's width in the rows, in axis units: 33.6 viewBox units, room for a
 * value with pence ("£2.40" takes 31) now that section 4's ratio can be any.
 */
const BOX = 7.2
const ROW_HEIGHT = 5
/** Top of the first row, and the drop to the next. */
const ROW_TOP = { 2: 22, 3: 30 } as const
const ROW_GAP = 9
const FILLS: readonly BarFill[] = ['shaded', 'light', 'empty']
const NAMES = ['Amy', 'Ben', 'Cara'] as const

type Person = {
  /** Their number in the ratio: how many boxes they get. */
  parts: number
  /** What one box is worth, once it is known; undefined leaves them empty. */
  each?: number
}

/**
 * The rows for two or three people, with what one part is worth written in
 * every box and each share to the right of its row.
 *
 * `guide` draws a dashed line down from the end of one row to another — the
 * boxes past it are the difference between those two shares.
 */
function shareRows(opts: {
  people: readonly Person[]
  above: string
  working: readonly string[]
  guide?: { at: number; from: number; to: number }
}): RenderedGrid {
  const n = opts.people.length as 2 | 3
  const y: RenderedAxis = { min: 0, max: n === 2 ? 30 : 36, step: 6, label: '' }
  const bottomOf = (k: number) => ROW_TOP[n] - ROW_HEIGHT - k * ROW_GAP
  const bars: BarModel[] = opts.people.map((p, k) => ({
    y: bottomOf(k),
    height: ROW_HEIGHT,
    pieces: [{ from: 0, to: p.parts * BOX, fill: FILLS[k] }],
    dividers: Array.from({ length: p.parts + 1 }, (_, j) => j * BOX),
  }))
  const labels: GridLabel[] = [{ x: fitLabel(30, opts.above, AX), y: ROW_TOP[n], text: opts.above, dy: -6 }]
  opts.people.forEach((p, k) => {
    const mid = bottomOf(k) + ROW_HEIGHT / 2
    labels.push({ x: 0, y: mid, text: NAMES[k], dx: -(labelHalfWidth(NAMES[k]) + 6), dy: 4 })
    if (p.each === undefined) return
    for (let j = 0; j < p.parts; j++) {
      labels.push({ x: (j + 0.5) * BOX, y: mid, text: money(p.each), dy: 4 })
    }
    const share = money(p.parts * p.each)
    labels.push({ x: p.parts * BOX, y: mid, text: share, dx: labelHalfWidth(share) + 8, dy: 4 })
  })
  opts.working.forEach((w, k) => {
    labels.push({ x: fitLabel(30, w, AX), y: bottomOf(n - 1), text: w, dy: k === 0 ? 15 : 29 })
  })
  const guides = opts.guide
    ? [{ x: opts.guide.at * BOX, from: bottomOf(opts.guide.to), to: bottomOf(opts.guide.from) + ROW_HEIGHT }]
    : []
  return barModelGrid({ x: AX, y, bars, guides, labels })
}

/** The axes the rows are drawn on, for a stage's `axes`. */
const rowAxes = (n: 2 | 3) => ({ x: AX, y: { min: 0, max: n === 2 ? 30 : 36, step: 6, label: '' } })

/** The most parts one row holds with its share still written after it. */
const ROW_MAX = 7

const partsWord = (n: number) => (n === 1 ? 'part' : 'parts')

/**
 * Who gets more and by how much, in parts and then in pounds: "Ben has 2 more
 * parts: 2 × £6 = £12 more". Amy is `x` parts and Ben `y`, at `each` a part.
 */
function gapLine(x: number, y: number, each: number): string {
  if (x === y) return 'The same number of parts, so no difference'
  const more = Math.abs(y - x)
  const who = y > x ? 'Ben' : 'Amy'
  const sum = more === 1 ? '' : `${more} × ${money(each)} = `
  return `${who} has ${more} more ${partsWord(more)}: ${sum}${money(more * each)} more`
}

/** The difference for the table: "2 parts = £12", or "none" for level shares. */
function gapCell(x: number, y: number, each: number): string {
  const more = Math.abs(y - x)
  return more === 0 ? 'none' : `${more} ${partsWord(more)} = ${money(more * each)}`
}

// ─── One bar of the whole ────────────────────────────────────────────────────
//
// Sections 1–3 draw the WHOLE as one bar, cut into equal parts and coloured by
// whose they are — sharing out, which two rows never showed (review,
// 2026-11-23).
//
// Every part carries its value, so a part must be wide enough for "£3.75"
// (31 viewBox units). Two things make that true at once: the bar is a little
// wider than the rows (12 squares, 336 units — any wider and the page shrinks
// the whole figure to fit, words and all), and sections 1 and 2 never cut it
// into more than MAX_PARTS, at 33.6 units a part.

const AXW: RenderedAxis = { min: 0, max: 72, step: 6, label: '' }
const MAX_PARTS = 10
/** How far Ben's number may go when Amy's is `a`, keeping the bar to MAX_PARTS. */
const benUpTo = (a: number) => MAX_PARTS - a
const AY_BAR: RenderedAxis = { min: 0, max: 24, step: 6, label: '' }
const barAxes = { x: AXW, y: AY_BAR }
const BAR_Y = 10
const BAR_H = 6
/** Seconds: the bar is there, cut into parts; then the first person's colour, then the second's. */
const COLOUR_FIRST = 0.3
const COLOUR_SECOND = 0.9

/**
 * The whole as one bar the width of the figure, cut into first + second equal
 * parts, the first person's darker and the second's lighter. `each`, when
 * given, is written in every part; `under` names each colour beneath it; and
 * `working` goes under that, a line each.
 */
function wholeBar(opts: {
  first: number
  second: number
  each?: number
  above: string
  under: readonly [string, string]
  working: readonly string[]
}): RenderedGrid {
  const { first, second } = opts
  const parts = first + second
  const w = AXW.max / parts
  // Stacked fractions ({n/d}) stand taller than a line of words, so lines that
  // carry them are spaced further apart.
  const tall = [...opts.under, ...opts.working].some(t => t.includes('{'))
  const underDy = tall ? 18 : 15
  const lineDy = (k: number) => (tall ? 42 + 22 * k : 29 + 14 * k)
  const labels: GridLabel[] = [
    { x: fitLabel(AXW.max / 2, opts.above, AXW), y: BAR_Y + BAR_H, text: opts.above, dy: -6 },
    { x: fitLabel((first * w) / 2, opts.under[0], AXW), y: BAR_Y, text: opts.under[0], dy: underDy },
    { x: fitLabel((first * w + AXW.max) / 2, opts.under[1], AXW), y: BAR_Y, text: opts.under[1], dy: underDy },
    ...opts.working.map((t, k) => ({ x: fitLabel(AXW.max / 2, t, AXW), y: BAR_Y, text: t, dy: lineDy(k) })),
  ]
  if (opts.each !== undefined) {
    for (let k = 0; k < parts; k++) {
      labels.push({ x: (k + 0.5) * w, y: BAR_Y + BAR_H / 2, text: money(opts.each), dy: 4 })
    }
  }
  return barModelGrid({
    x: AXW,
    y: AY_BAR,
    bars: [{
      y: BAR_Y,
      height: BAR_H,
      pieces: [
        // The whole first, already cut into its parts…
        { from: 0, to: AXW.max, fill: 'empty' },
        // …then whose they are.
        { from: 0, to: first * w, fill: 'shaded', appear: COLOUR_FIRST },
        { from: first * w, to: AXW.max, fill: 'light', appear: COLOUR_SECOND },
      ],
      dividers: Array.from({ length: parts + 1 }, (_, k) => k * w),
    }],
    labels,
  })
}

// ─── Stage 1: sharing an amount ──────────────────────────────────────────────
//
// Starts where every student already is: sharing equally. A ratio is sharing
// into parts that are all the same size, just not the same NUMBER of them each.
//
// The amount stays put and the student changes the split: the bar keeps its
// length, so more parts are visibly smaller parts, each with its value in it.

/**
 * [Amy's number, Ben's number, the amount] for the prediction. Never a 2 for
 * Amy: then "half each" and "divide the amount by Amy's number" are the same
 * figure, and two of the three options would share a number.
 */
const S1 = [[3, 5, 40], [4, 7, 55], [5, 4, 45], [3, 7, 60]] as const

function stageShare(p: Params): Stage {
  const [a, b, total] = S1[p.s1]
  const parts = a + b
  const each = total / parts
  return {
    title: 'Sharing an amount',
    ask: `Amy and Ben share ${money(total)} in the ratio ${a} : ${b}. How much does each of them get?`,
    axes: barAxes,
    predict: {
      prompt: 'Amy and Ben get…',
      on: {
        kind: 'choice',
        options: [
          `${money(a * each)} and ${money(b * each)}`,
          `${money(total / 2)} each`,
          `${money(total / a)} and ${money(total / b)}`,
        ],
        correct: 0,
        wrong: [
          '',
          `Half each is sharing equally, which is the ratio 1 : 1. In ${a} : ${b} they do not `
            + 'get the same amount — one of them gets more parts than the other.',
          `That is ${money(total)} divided by ${a}, and ${money(total)} divided by ${b}. Add `
            + `them up: ${money(total / a + total / b)}, not the ${money(total)} there is to share.`,
        ],
      },
      right: `${money(a * each)} and ${money(b * each)} — ${parts} equal parts of ${money(each)}.`,
      explain: [
        `The ratio ${a} : ${b} means ${a} parts for Amy and ${b} for Ben, all the same size: `
          + `${a} + ${b} = ${parts} parts.`,
        `${money(total)} ÷ ${parts} = ${money(each)} for each part.`,
        `Amy: ${a} × ${money(each)} = ${money(a * each)}. Ben: ${b} × ${money(each)} = `
          + `${money(b * each)}. Check: ${money(a * each)} + ${money(b * each)} = ${money(total)}.`,
      ],
    },
    control: {
      name: 'Ben’s number',
      verb: 'try',
      // Until a split is tried, the one in the question.
      render: (drawn, current) => {
        const v = drawn[current] ?? b
        const one = total / (a + v)
        return wholeBar({
          first: a,
          second: v,
          each: one,
          above: `${money(total)} shared in the ratio ${a} : ${v}`,
          under: [`Amy ${money(a * one)}`, `Ben ${money(v * one)}`],
          working: [`${a} + ${v} = ${a + v} parts, so one part is ${money(total)} ÷ ${a + v} = ${money(one)}`],
        })
      },
      prompt: `Keep the ${money(total)} and Amy's ${a}, and change Ben's number in the ratio. `
        + 'Watch how many parts the bar is cut into, and what each one is worth.',
      hint: `Any whole number from 1 to ${benUpTo(a)}.`,
      domain: { min: 1, max: benUpTo(a), step: 1 },
      // Never the split in the question (Ben's number there is 4, 5 or 7), and
      // never past the top of the domain.
      suggest: [1, Math.min(6, benUpTo(a))],
      label: v => `${a} : ${v}`,
      row: v => [`${a} : ${v}`, String(a + v), money(total / (a + v)), money((a * total) / (a + v)),
        money((v * total) / (a + v))],
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second split, so you can see what changes with the number of parts.'
        : null),
    },
    observe: { headers: ['ratio', 'parts', 'each part', 'Amy', 'Ben'] },
    conclude: {
      sentence: ['To share an amount in a ratio, first ', ', then divide the amount by that to find ', '.'],
      slots: [
        {
          options: ['add the numbers in the ratio', 'divide the amount by each number in the ratio'],
          correct: 0,
          diagnosis: [
            '',
            'Dividing by each number gives shares that do not add up to the amount. Every part '
            + 'of the bar is the same size, so count all the parts first — that is what the '
            + 'amount is shared between.',
          ],
          misconception: ['', 'part_used_as_whole'],
        },
        {
          options: ['what each part is worth', 'what each person gets'],
          correct: 0,
          diagnosis: [
            '',
            'Dividing by the number of parts gives the size of ONE part — the same for both of '
            + 'them. Each person then gets as many of those as their number in the ratio.',
          ],
          misconception: ['', 'stopped_at_an_intermediate'],
        },
      ],
      because: 'A ratio shares into parts that are all the same size — it just gives some people '
        + 'more of them. Adding the numbers counts the parts; dividing the amount by that gives one '
        + 'part; and each share is that many parts. Change the split and the same amount is cut '
        + 'into a different number of parts, so each part changes size — but the parts are always '
        + 'equal, and always add back up to the whole amount.',
    },
    naming: {
      label: 'Definition',
      term: 'a ratio',
      means: `A ratio compares how many parts each person gets. ${a} : ${b} means ${a} parts for `
        + `Amy for every ${b} for Ben, and every part is the same size. The word is Latin: a `
        + 'ratio was a reckoning, a working-out, from reri, "to reckon". English kept it in rate, '
        + 'rational and reason — and in ration, a fixed share handed out to each person, which is '
        + 'a ratio at work.',
      elsewhere: 'Recipes run on ratios. Squash mixed 1 : 5 with water is 50 ml of squash to 250 '
        + 'ml of water for a glass, and 200 ml to 1,000 ml for a jug — four times as much of each, '
        + 'and still 1 : 5. Only the size of a part has changed, from 50 ml to 200 ml, which is '
        + 'why the jug tastes the same as the glass.',
      onThePaper: 'Share £72 in the ratio 5 : 3.',
    },
    check: [
      {
        questionId: Q_SHARE,
        because: 'The section exactly: an amount shared in a two-part ratio. Its traps are an '
          + 'equal split, a ratio number given as the share, one part given as the share, and '
          + 'the smaller share when the larger is asked for.',
      },
    ],
  }
}

// ─── Stage 2: knowing one share ──────────────────────────────────────────────
//
// The reverse, which the papers ask nearly as often: one share is given, not
// the total. The trap is to treat the ratio's numbers as amounts and work by
// adding or taking away.
//
// A row of parts each, as in section 4, not section 1's one bar (review,
// 2026-11-24): the two sections' try-its were the same control on the same
// picture, and the bar never showed the trap this section is for — keeping
// the gap between the numbers as pounds. Rows show the gap: the dashed line
// ends the shorter row, and the parts past it are the difference.
//
// The student changes AMY's number, not Ben's. Ben's share and his parts stay
// put, so one part never changes — the "each part" column is the same on every
// row — while Amy's share, the difference and the total all move a whole part
// at a time. One more in the ratio is one more PART, never one more pound.

/** [Amy's number, Ben's number, Ben's share]. Every prediction option distinct. */
const S2 = [[3, 5, 25], [2, 7, 28], [4, 5, 30], [5, 3, 24]] as const

function stageOneShare(p: Params): Stage {
  const [a, b, known] = S2[p.s2]
  const each = known / b
  const additive = known + (a - b)
  return {
    title: 'Knowing one share',
    ask: `Amy and Ben share some money in the ratio ${a} : ${b}. Ben gets ${money(known)}. `
      + 'How much does Amy get?',
    axes: rowAxes(2),
    predict: {
      prompt: 'Amy gets…',
      on: {
        kind: 'choice',
        options: [money(a * each), money(additive), money((a + b) * each)],
        correct: 0,
        wrong: [
          '',
          `That keeps the gap between them at ${Math.abs(a - b)}, as if the ratio were in pounds. `
            + `It is in PARTS: Ben's ${money(known)} is ${b} parts, and Amy's share is ${a} of `
            + 'the same parts.',
          `${money((a + b) * each)} is the whole amount — Amy's and Ben's shares together. Amy `
            + 'gets only her own parts of it.',
        ],
      },
      right: `${money(a * each)} — ${a} parts of ${money(each)}.`,
      explain: [
        `Ben's ${money(known)} is his ${b} parts, so one part is ${money(known)} ÷ ${b} = `
          + `${money(each)}.`,
        `Amy has ${a} parts: ${a} × ${money(each)} = ${money(a * each)}.`,
        `${gapLine(a, b, each)} — not ${money(Math.abs(b - a))}.`,
      ],
    },
    control: {
      name: 'Amy’s number',
      verb: 'try',
      render: (drawn, current) => {
        const x = drawn[current] ?? a
        return shareRows({
          people: [{ parts: x, each }, { parts: b, each }],
          above: `Ben gets ${money(known)} in the ratio ${x} : ${b}`,
          working: [
            `Ben's ${b} parts are ${money(known)}, so one part is ${money(each)}`,
            gapLine(x, b, each),
          ],
          // Down from the end of the shorter row: the parts past it are the
          // difference. Level rows have none, and no line.
          guide: x === b ? undefined : { at: Math.min(x, b), from: 0, to: 1 },
        })
      },
      prompt: `Keep Ben's ${money(known)} and his ${b} parts, and change Amy's number in the `
        + 'ratio. Watch what one part is worth, and how far apart their two shares are.',
      hint: `Any whole number from 1 to ${ROW_MAX}.`,
      domain: { min: 1, max: ROW_MAX, step: 1 },
      // Never the question's own number for Amy (2 to 5), one each side of
      // Ben's, so the gap is seen both ways round.
      suggest: [1, ROW_MAX],
      label: v => `${v} : ${b}`,
      row: v => [`${v} : ${b}`, money(each), money(v * each), gapCell(v, b, each), money((v + b) * each)],
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second number for Amy, so you can see what one more part is worth.'
        : null),
    },
    observe: { headers: ['ratio', 'each part', 'Amy gets', 'difference', 'altogether'] },
    conclude: {
      sentence: ['When you know one share, divide it by ', ' to find one part, then ', '.'],
      slots: [
        {
          options: ['that person’s number in the ratio', 'the numbers in the ratio added together'],
          correct: 0,
          diagnosis: [
            '',
            'Ben’s share is only his own parts, not all of them. Dividing it by every part '
            + 'shares Ben’s money out between Amy and Ben again.',
          ],
          misconception: ['', 'part_used_as_whole'],
        },
        {
          options: ['multiply by however many parts you want', 'add or take away the difference between the numbers'],
          correct: 0,
          diagnosis: [
            '',
            `In ${a} : ${b}, ${gapLine(a, b, each)} — not ${money(Math.abs(b - a))}. The numbers `
            + 'in a ratio count parts, not pounds, so multiply one part by how many of them you need.',
          ],
          misconception: ['', ''],
        },
      ],
      because: 'Every part is the same size, so whoever’s share you know tells you what one part '
        + 'is worth: their share divided by their number of parts. Everything else is that part '
        + 'counted as many times as you need — the other person’s number of parts for their '
        + 'share, or all of the parts for the total.',
    },
    check: [
      {
        questionId: Q_ONE_SHARE,
        because: 'The section exactly: a two-part ratio and one share, and the other share to '
          + 'find. Its traps are the gap kept in pounds, the whole amount, one part, dividing by '
          + 'the wrong number, and the known share shared out as if it were the total.',
      },
    ],
  }
}

// ─── Stage 3: ratios and fractions ───────────────────────────────────────────
//
// The commonest ratio trap on the papers: reading 3 : 5 as "3 out of 5". A
// ratio compares the parts with EACH OTHER; a fraction compares one part with
// the WHOLE. One bar shows the whole at once.
//
// The student types the whole ratio — both numbers — rather than one side of
// it (review, 2026-11-23): changing one number at a time was not much of an
// investigation, and the bar keeps the figure's width however many parts.

/** [boys, girls] for the prediction: no option's fraction equals another's. */
const S3 = [[3, 5], [2, 7], [4, 5], [3, 4]] as const

function stageFractions(p: Params): Stage {
  const [boys, girls] = S3[p.s3]
  const whole = boys + girls
  return {
    title: 'Ratios and fractions',
    ask: `In a class, the ratio of boys to girls is ${boys} : ${girls}. What fraction of the class `
      + 'are boys?',
    axes: barAxes,
    predict: {
      prompt: 'The fraction of the class that are boys is…',
      on: {
        kind: 'choice',
        options: [`${boys}/${whole}`, `${boys}/${girls}`, `${girls}/${whole}`],
        correct: 0,
        wrong: [
          '',
          `${boys}/${girls} compares the boys with the GIRLS — it is the ratio written as a `
            + 'fraction. A fraction of the class has to compare the boys with everybody.',
          `${girls}/${whole} is the girls: ${girls} of the ${whole} parts. The boys are the `
            + `other ${boys}.`,
        ],
      },
      right: `${fracMark(boys, whole)} — ${boys} of the ${whole} parts.`,
      explain: [
        `${boys} : ${girls} means ${boys} boys for every ${girls} girls: ${boys} + ${girls} = `
          + `${whole} children in every group.`,
        `${boys} of every ${whole} are boys, so the boys are ${fracMark(boys, whole)} of the class.`,
        `The girls are the other ${girls} of every ${whole}: {${girls}/${whole}}. Together, `
          + `{${boys}/${whole}} + {${girls}/${whole}} = {${whole}/${whole}} = 1 — the whole class.`,
      ],
    },
    control: {
      name: 'ratio',
      verb: 'try',
      inputs: ['boys', 'girls'],
      // Until a ratio is tried, the one in the question.
      render: (drawn, current) => {
        const [f, s] = drawn[current] === undefined ? [boys, girls] : splitInputs(drawn[current], 2)
        const n = f + s
        return wholeBar({
          first: f,
          second: s,
          above: `boys : girls = ${f} : ${s}`,
          // Stacked fractions, as the page writes them ({n/d}).
          under: [`boys {${f}/${n}}`, `girls {${s}/${n}}`],
          working: [`${f} + ${s} = ${n} parts in all, and {${f}/${n}} + {${s}/${n}} = {${n}/${n}} = 1`],
        })
      },
      prompt: 'Change both numbers in the ratio of boys to girls. Watch what the fractions are out '
        + 'of, and what they add up to.',
      hint: 'Any whole number from 1 to 9 for each of them.',
      domain: { min: 1, max: 9, step: 1 },
      suggest: [joinInputs([1, 1]), joinInputs([2, 7])],
      label: v => splitInputs(v, 2).join(' : '),
      row: v => {
        const [f, s] = splitInputs(v, 2)
        return [`${f} : ${s}`, String(f + s), `${f}/${f + s}`, `${s}/${f + s}`]
      },
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second ratio, so you can see what the fractions are out of.'
        : null),
    },
    observe: { headers: ['boys : girls', 'parts in all', 'boys', 'girls'] },
    conclude: {
      sentence: ['A fraction of the whole has ', ' on the bottom, and ', ' on top.'],
      slots: [
        {
          options: ['all the parts added together', 'the other number in the ratio'],
          correct: 0,
          diagnosis: [
            '',
            'The other number compares the boys with the girls, which is what the ratio already '
            + 'does. A fraction of the CLASS is out of everybody in it — every part in the bar.',
          ],
          misconception: ['', 'part_used_as_whole'],
        },
        {
          options: ['that person’s own number', 'the other person’s number'],
          correct: 0,
          diagnosis: [
            '',
            'That gives the other person’s fraction: in 3 : 5, five eighths are girls. The boys’ '
            + 'fraction counts the boys’ parts — their own number in the ratio.',
          ],
          misconception: ['', 'answered_a_different_quantity'],
        },
      ],
      because: 'A ratio compares one part with another; a fraction compares a part with the whole. '
        + 'The whole is every part added together, so in a : b the first share is a out of a + b, '
        + 'the second is b out of a + b — and the two fractions between them make the whole: 1.',
      algebraLead: 'Using algebra, for the ratio a : b:',
      algebra: 'first share = {a/(a + b)} of the whole\n'
        + '  second share = {b/(a + b)} of the whole',
    },
    // ONE card for both: the names for the two comparisons just made, then the
    // same idea run backwards. A "Worth knowing" card restating the rule and a
    // separate aside straight after it read as clutter, and the card's naming
    // as new information (review, 2026-11-24).
    naming: {
      label: 'Worth knowing',
      term: 'part to part, and part to whole',
      means: `Those are the two comparisons you have just been making. The ratio ${boys} : `
        + `${girls} is part to part — boys with girls. The fraction ${fracMark(boys, whole)} is `
        + 'part to whole — boys with the whole class.',
      elsewhere: 'It works backwards too. If {2/5} of a class are boys, then 2 in every 5 are boys '
        + 'and the other 3 are girls — so boys to girls is 2 : 3, not 2 : 5. The second question '
        + 'below asks it this way round.',
      onThePaper: 'Red and blue counters are in the ratio 2 : 7. What fraction of the counters are '
        + 'red? / {2/5} of the counters are red. Write down the ratio of red to blue counters.',
    },
    check: [
      {
        questionId: Q_AS_FRACTION,
        because: 'The section exactly, on counters instead of a class: a ratio, and the fraction '
          + 'of the whole that one part makes. Its first trap is the ratio written as a fraction '
          + '— part to part where part to whole is asked for.',
      },
      {
        questionId: Q_FRACTION_TO_RATIO,
        because: 'The card’s other direction, tested: a fraction of the whole, and the ratio it '
          + 'comes from. Its first trap is the fraction written as a ratio — part to whole where part to part is '
          + 'asked for, the section’s trap the other way round.',
      },
    ],
  }
}

// ─── Stage 4: three people, and a difference ─────────────────────────────────
//
// How the papers combine it all: three people, and neither the total nor a
// share — the difference between two shares. The difference is a number of
// parts too, and the guide shows which.

/**
 * [Amy, Ben, Cara, how much more Cara gets than Amy]. Cara always has more
 * parts than Amy, and every prediction option is distinct.
 */
const S4 = [[2, 3, 5, 12], [1, 4, 3, 10], [3, 2, 6, 15], [2, 5, 4, 8]] as const

function stageDifference(p: Params): Stage {
  const [a, b, c, diff] = S4[p.s4]
  const gap = c - a
  const each = diff / gap
  const whole = a + b + c
  return {
    title: 'Three shares, and a difference',
    ask: `Amy, Ben and Cara share some money in the ratio ${a} : ${b} : ${c}. Cara gets `
      + `${money(diff)} more than Amy. How much does Ben get?`,
    axes: rowAxes(3),
    predict: {
      prompt: 'Ben gets…',
      on: {
        kind: 'choice',
        options: [money(b * each), money((b * diff) / whole), money(b * diff)],
        correct: 0,
        wrong: [
          '',
          `That shares the ${money(diff)} out as if it were all the money. It is only the `
            + `difference — Cara's extra ${gap} parts.`,
          `That makes the ${money(diff)} one part. But Cara has ${c} parts and Amy ${a}, so `
            + `the difference is ${gap} parts, not one.`,
        ],
      },
      right: `${money(b * each)} — ${b} parts of ${money(each)}.`,
      explain: [
        `Cara has ${c} parts and Amy ${a}, so Cara's extra is ${c} − ${a} = ${gap} parts.`,
        `${gap} parts are ${money(diff)}, so one part is ${money(diff)} ÷ ${gap} = ${money(each)}.`,
        `Ben has ${b} parts: ${b} × ${money(each)} = ${money(b * each)}.`,
      ],
    },
    control: {
      name: 'ratio',
      verb: 'try',
      // The whole ratio, not just the difference (review, 2026-11-24): with
      // the ratio fixed, all a student could change was the size of a part.
      // Now the difference stays the question's and the ratio moves, so what
      // changes is how many parts that difference is.
      inputs: ['Amy', 'Ben', 'Cara'],
      domain: { min: 1, max: 7, step: 1 },
      valid: v => {
        const [x, , z] = splitInputs(v, 3)
        return z > x ? null : `Give Cara more parts than Amy, so that she gets the ${money(diff)} more.`
      },
      render: (drawn, current) => {
        const [x, y, z] = drawn[current] === undefined ? [a, b, c] : splitInputs(drawn[current], 3)
        const more = z - x
        const one = diff / more
        return shareRows({
          people: [x, y, z].map(parts => ({ parts, each: one })),
          above: `Cara gets ${money(diff)} more than Amy, in ${x} : ${y} : ${z}`,
          working: [
            `Cara has ${z} − ${x} = ${more} more ${more === 1 ? 'part' : 'parts'} than Amy`,
            `${more === 1 ? '1 part is' : `${more} parts are`} ${money(diff)}, so one part is ${money(one)}`,
          ],
          // From the end of Amy's row down through Cara's: Cara's parts past
          // the line are the difference.
          guide: { at: x, from: 0, to: 2 },
        })
      },
      prompt: `Keep Cara's ${money(diff)} more than Amy, and change the whole ratio. Watch how many `
        + 'parts the difference is, and what one part is worth.',
      hint: 'Any whole numbers from 1 to 7, with more for Cara than for Amy.',
      suggest: [joinInputs([1, 2, 3]), joinInputs([2, 5, 6])],
      label: v => splitInputs(v, 3).join(' : '),
      row: v => {
        const [x, y, z] = splitInputs(v, 3)
        const one = diff / (z - x)
        return [`${x} : ${y} : ${z}`, String(z - x), money(one), money(y * one), money((x + y + z) * one)]
      },
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second ratio, so you can see what one part depends on.'
        : null),
    },
    observe: { headers: ['Amy : Ben : Cara', 'Cara’s extra parts', 'each part', 'Ben gets', 'altogether'] },
    conclude: {
      sentence: ['The difference between two shares is ', ', so divide it by ', ' to find one part.'],
      slots: [
        {
          options: ['a number of parts too', 'one part'],
          correct: 0,
          diagnosis: [
            '',
            `Past the dashed line, Cara's extra is ${gap} parts, not one. The difference is as `
            + 'many parts as one person has more than the other.',
          ],
          misconception: ['', 'stopped_at_an_intermediate'],
        },
        {
          options: ['the difference between their numbers', 'all the numbers added together'],
          correct: 0,
          diagnosis: [
            '',
            'Adding all the numbers counts every part, which is what you divide the TOTAL by. '
            + 'The difference is only the extra parts, so divide by how many extra there are.',
          ],
          misconception: ['', 'part_used_as_whole'],
        },
      ],
      because: 'Whatever you are told — the total, one share, or the gap between two — it is some '
        + 'number of equal parts. Count which parts it is, divide to get one part, and every share '
        + 'follows. With three people it is just the same, with a third person’s parts as well.',
    },
    check: [
      {
        questionId: Q_DIFFERENCE,
        because: 'The section exactly: three people, a difference between two shares, and a '
          + 'third share to find. Its traps are the difference treated as the total, as one part, '
          + 'or as somebody’s whole share, and stopping at one part or at the total.',
      },
    ],
  }
}

export const ratioInvestigation: Investigation = {
  skillId: 'ratio',
  title: 'Sharing in a Ratio',
  invite: 'you share amounts out on a bar yourself and work out the rule, rather than being told it.',
  outcomes: {
    lead: 'A ratio says how something is shared: two parts for you for every three for me, one '
      + 'scoop of squash to five of water. It is worth more marks on the GCSE papers than any '
      + 'other topic, and almost every question comes down to one move — finding what a single '
      + 'part is worth.',
    // One measurable verb each (lib/skills/bloom.ts): apply, apply, apply,
    // understand. The last is the rule section 3 has the student put into
    // words.
    points: [
      'calculate each share when an amount is divided in a ratio',
      'find the other shares from one share, or from the difference between two',
      'convert a ratio into the fractions of the whole it makes',
      'explain why, in the ratio 3 : 5, the first share is three eighths of the whole and not three fifths',
    ],
  },
  // Signed off by the reviewer 2026-11-27, after four review rounds (#281,
  // #283, #285, #290), and taken out of construction.
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
  build: p => [stageShare(p), stageOneShare(p), stageFractions(p), stageDifference(p)],
  /**
   * The handover: ratio wrapped in something else, which is how the papers
   * set it once it stops being asked for on its own — a share with a
   * percentage spent, and a share that then grows with interest.
   */
  transferQuestionIds: [
    '245fb5b8-cb5a-497e-ae90-1e98f3beadcf',  // ratio share, then a percentage spent (d4)
    'fd9dd6b4-29dc-4e85-9014-09fc4d6ca32b',  // ratio share, then growth (d4)
  ],
  /**
   * The sections that teach this skill's other published questions
   * (docs/audit/33, D1). The checks map themselves.
   */
  questionSections: {
    // Three people and a difference ((a) a fraction, (b) the total).
    '8fae0cf9-b732-4cb4-a82a-21b7533b9efa': 4,
    // AP : PB on a line: AP is a fraction of AB — section 3's part to whole.
    '9657a229-39b6-4e14-8141-dbf358cfcb10': 3,
    // A share, then something done with it.
    'fd9dd6b4-29dc-4e85-9014-09fc4d6ca32b': 1,
    '245fb5b8-cb5a-497e-ae90-1e98f3beadcf': 1,
    // (a) the fraction one share is, (b) a percentage spent.
    '8c70c92c-382d-46a5-9b0e-3f34e0313c66': 3,
    // No section: simplifying a ratio is its own skill, deliberately not a
    // section, and so are ratios of areas and volumes.
    '9e709cea-54e8-4d83-a31d-b98ff17b3e82': null,
    '1e87919a-ac8c-435d-9ac5-c2fc0a4ff05d': null,
    '38aa836d-cb1c-4f74-9a58-0fd2ac116bac': null,
  },
}
