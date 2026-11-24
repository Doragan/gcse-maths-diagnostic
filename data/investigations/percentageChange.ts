import type { Investigation, Params, Stage } from './types'
import type { GridLabel, RenderedAxis, RenderedGrid } from '../../lib/questions/gridDraw'
import { CELL } from '../../lib/questions/gridSvg'
import {
  barModelGrid, fitLabel, labelHalfWidth, type BarModel,
} from '../../lib/skills/investigationFigures'

// ─────────────────────────────────────────────────────────────────────────────
// What a percentage change really does — the second investigation.
//
// Chosen over the twenty candidates in docs/audit/31 §5 on two counts.
//
// WEIGHT: 231 marks across the 86-paper corpus, against 143 for the pilot's
// skill, and the §5 list was written from the figure tooling outwards so it is
// entirely graphs. Ranking every skill by marks instead puts straight lines
// twelfth.
//
// SHAPE: it has the best DISCOVERY in the bank. A percentage change is a
// multiplier, multipliers compose, and so going up 20% and then down 20% does
// not return you to where you started. That is not a fact to be told — a
// student who is told it does not believe it. They have to run it and be
// surprised, which is exactly what this layer is for. The wrong answer ("back
// where I started") is what almost everyone thinks, so it is a defensible
// distractor rather than a straw man.
//
// It DRAWS NOTHING. §5 always said a skill whose behaviour shows in a table
// needs no figure, but `Control.render` was required until now, so the whole
// table-native half of the candidate list could not be expressed. This is the
// first one to exercise that, which is the more useful way to stress the shell
// than a second kind of grid would have been.
// ─────────────────────────────────────────────────────────────────────────────

/** Money, with pence only when there are any. */
function money(n: number): string {
  const r = Math.round(n * 100) / 100
  // Grouped the British way, £12,500 not £12500 — the "multiply by the
  // percentage" responses reach the thousands. Pence only when there are any.
  const pence = Number.isInteger(r) ? 0 : 2
  return `£${r.toLocaleString('en-GB', { minimumFractionDigits: pence, maximumFractionDigits: pence })}`
}

/** A decimal with no trailing zeros: 1.1, not 1.10. */
function dec(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

// ─── Bar models for the "try it" sections ────────────────────────────────────
//
// The picture a GCSE percentage question is drawn as: one bar for the whole
// amount, 100% of it, cut into tenths. Each section draws the value the student
// has just tried, to scale. The table still carries the numbers; the bar is
// what makes them visible — and in section 4 it is the argument itself, since
// the second bar's tenths are visibly longer than the first's.
//
// Steps match on both axes (see barModelGrid). 0–100 in tens for one bar of
// the whole; 0–200 in twenties where the bar has to grow past 100%.

const AX_WHOLE = { min: 0, max: 100, step: 10, label: '' }
const AY_WHOLE = { min: 0, max: 30, step: 10, label: '' }
const AX_GROW = { min: 0, max: 200, step: 20, label: '' }
const AY_GROW = { min: 0, max: 60, step: 20, label: '' }
const AY_TWICE = { min: 0, max: 120, step: 20, label: '' }

/**
 * How the bars move: GROW seconds for a bar to grow or shrink, PAUSE between
 * steps. Short enough not to hold anyone up, long enough to watch. A student
 * who has asked for less motion sees the finished bar (see the page).
 */
const GROW = 0.7
const PAUSE = 0.2

/** Tenths of a bar of the given length, for its dividers. */
const tenths = (length: number) => Array.from({ length: 11 }, (_, k) => (k * length) / 10)

/** A label above a bar whose top is at `y`, clamped to stay on the figure. */
const above = (x: number, y: number, text: string, axis: RenderedAxis): GridLabel =>
  ({ x: fitLabel(x, text, axis), y, text, dy: -7 })
/** A label under a bar whose bottom is at `y`; `line` 2 sits beneath line 1. */
const below = (x: number, y: number, text: string, axis: RenderedAxis, line = 1): GridLabel =>
  ({ x: fitLabel(x, text, axis), y, text, dy: line === 1 ? 15 : 29 })

/** Section 1: the whole amount, with the percentage tried shaded. */
function percentOfBar(start: number, v: number | undefined): RenderedGrid {
  const top = `100% = ${money(start)}`
  const labels = [above(50, 20, top, AX_WHOLE)]
  // With the working in it, now that there is no table: 1% is the same on
  // every try, and the percentage is how many of them you take. Not at 100%,
  // where it would only repeat the label above.
  if (v !== undefined && v < 100) {
    labels.push(below(v / 2, 10, `${v}% = ${v} × ${money(start / 100)} = ${money(start * v / 100)}`, AX_WHOLE))
  }
  return barModelGrid({
    x: AX_WHOLE,
    y: AY_WHOLE,
    bars: [{
      y: 10,
      height: 10,
      // The whole bar first, then the shading laid over it and filling from
      // the left — so the tenths are there before the shading reaches them.
      pieces: v === undefined
        ? [{ from: 0, to: 100, fill: 'empty' }]
        : [
          { from: 0, to: 100, fill: 'empty' },
          { from: 0, to: v, fill: 'shaded', grow: { from: 0, start: 0, end: GROW } },
        ],
      dividers: tenths(100),
    }],
    labels,
  })
}

/** Section 2: the whole amount with the increase added on the end. */
function increaseBar(start: number, v: number | undefined): RenderedGrid {
  const labels = [above(50, 40, `100% = ${money(start)}`, AX_GROW)]
  const pieces: BarModel['pieces'] = v === undefined
    ? [{ from: 0, to: 100, fill: 'light' }]
    : [
      { from: 0, to: 100, fill: 'light' },
      // The increase grows on to the end of the bar.
      { from: 100, to: 100 + v, fill: 'shaded', grow: { from: 0, start: 0, end: GROW } },
    ]
  if (v !== undefined) {
    // Above the bar, beside the 100%: the part added and what it is worth.
    labels.push(above(100 + v / 2, 40, `+${v}% = ${money(start * v / 100)}`, AX_GROW))
    // Below it, the whole — with the multiplier this section is about, which
    // the table's last column used to carry.
    labels.push(below(
      (100 + v) / 2, 20,
      `${100 + v}% = ${dec(1 + v / 100)} × ${money(start)} = ${money(start * (1 + v / 100))}`,
      AX_GROW,
    ))
  }
  return barModelGrid({
    x: AX_GROW,
    y: AY_GROW,
    // Tenths of the ORIGINAL amount, carried on into the part added: a 30%
    // increase is three more of the same tenths.
    bars: [{ y: 20, height: 20, pieces, dividers: Array.from({ length: 20 }, (_, k) => k * 10) }],
    labels,
  })
}

/** Section 3: the whole amount with the decrease cut off the end. */
function decreaseBar(start: number, v: number | undefined): RenderedGrid {
  const labels = [above(50, 20, `100% = ${money(start)}`, AX_WHOLE)]
  const pieces: BarModel['pieces'] = v === undefined
    ? [{ from: 0, to: 100, fill: 'empty' }]
    : [
      // The whole bar shrinks back to what is left, then the part taken off
      // shows where it was.
      { from: 0, to: 100 - v, fill: 'shaded', grow: { from: 100, start: PAUSE, end: PAUSE + GROW } },
      { from: 100 - v, to: 100, fill: 'removed', appear: PAUSE + GROW },
    ]
  if (v !== undefined) {
    labels.push(below((100 - v) / 2, 10, `${100 - v}% left = ${money(start * (1 - v / 100))}`, AX_WHOLE))
    labels.push(below(100 - v / 2, 10, `−${v}% = ${money(start * v / 100)}`, AX_WHOLE))
    // The multiplier, on a second line under what is left: the evidence this
    // section's rule rests on, which the table used to carry.
    labels.push(below((100 - v) / 2, 10, `= ${dec(1 - v / 100)} × ${money(start)}`, AX_WHOLE, 2))
  }
  return barModelGrid({
    x: AX_WHOLE,
    y: AY_WHOLE,
    bars: [{ y: 10, height: 10, pieces, dividers: tenths(100) }],
    labels,
  })
}

/**
 * Section 4: up by v%, then down by v% of the NEW amount.
 *
 * Two bars on one scale. The top one is the start plus the rise. The bottom
 * one is that new amount with v% of IT taken off — and its tenths are tenths
 * of the bigger amount, so they are visibly longer than the top bar's. The
 * dashed line marks where the start was, and the bottom bar stops short of it.
 */
function upThenDownBars(start: number, v: number | undefined): RenderedGrid {
  /**
   * A label moved right until all of it is clear of the dashed line at 100.
   * Centred on its piece it straddled the line for small percentages, and the
   * line cut through the first character.
   */
  const rightOfStart = (l: GridLabel): GridLabel => {
    const clear = 100 + ((labelHalfWidth(l.text) + 6) * AX_GROW.step) / CELL
    return { ...l, x: Math.max(l.x, clear) }
  }
  if (v === undefined) {
    return barModelGrid({
      x: AX_GROW,
      y: AY_TWICE,
      bars: [{ y: 80, height: 20, pieces: [{ from: 0, to: 100, fill: 'light' }], dividers: tenths(100) }],
      labels: [above(50, 100, `100% = ${money(start)}`, AX_GROW)],
    })
  }
  const up = 100 + v
  const kept = (up * (100 - v)) / 100
  const startText = `start: ${money(start)}`
  return barModelGrid({
    x: AX_GROW,
    y: AY_TWICE,
    bars: [
      {
        y: 80,
        height: 20,
        pieces: [
          { from: 0, to: 100, fill: 'light' },
          { from: 100, to: up, fill: 'shaded', grow: { from: 0, start: 0, end: GROW } },
        ],
        dividers: Array.from({ length: 20 }, (_, k) => k * 10),
      },
      {
        // In order: the top bar grows, THEN this one appears at its new
        // length and shrinks — one change after the other, as in the question.
        y: 20,
        height: 20,
        appear: GROW + PAUSE,
        pieces: [
          {
            from: 0, to: kept, fill: 'shaded',
            grow: { from: up, start: GROW + 2 * PAUSE + 0.25, end: 2 * GROW + 2 * PAUSE + 0.25 },
          },
          { from: kept, to: up, fill: 'removed', appear: 2 * GROW + 2 * PAUSE + 0.25 },
        ],
        dividers: tenths(up),
      },
    ],
    // From the bottom of the lower bar to the top of the upper one: no higher
    // or lower, or it runs through the labels above and below.
    guides: [{ x: 100, from: 20, to: 100 }],
    labels: [
      above(up / 2, 100, `up ${v}%: ${money(start)} → ${money(start * up / 100)}`, AX_GROW),
      rightOfStart(below(100 + v / 2, 80, `+${money(start * v / 100)}`, AX_GROW)),
      // Left of the dashed line, in the gap between the bars, clear of the
      // two amounts that sit to its right.
      { x: 100, y: 60, text: startText, dx: -(labelHalfWidth(startText) + 8), dy: 4 },
      rightOfStart(above((kept + up) / 2, 40, `−${money(start * up * v / 10000)}`, AX_GROW)),
      below(kept / 2, 20, `down ${v}%: ${money(start * up / 100)} → ${money(start * kept / 100)}`, AX_GROW),
    ],
  })
}

// ─── Section checks ──────────────────────────────────────────────────────────
//
// Published bank questions, chosen per section for the half of the idea that
// section built. Not authored here: a bank question brings its drawn
// parameters, the verification harness and its authored traps.

/**
 * "Work out b% of £a." (d2, numeric)
 *
 * On percentage_change itself, and authored for this section: it asks for
 * exactly what section 1 builds, a percentage of an amount.
 *
 * Two things about its parameters are deliberate, and both are easy to undo
 * by widening the range. b starts at 15 and never asks for 5% or 10%, because
 * 5% and 10% are the question's OWN traps — the stepping stones a student
 * works out and then stops on — so asking for one of them directly would hand
 * full marks to the method the traps exist to catch. And a is capped at 180
 * for the same reason on the other trap: at £200 the 10% stepping stone is
 * £20, which is one of b's own values, so the read-the-percentage-as-pounds
 * trap (£b) would render the same number and the second of the two would
 * never fire.
 */
const Q_PERCENT_OF = '64bb36f5-2267-4a77-9ebf-45c43cbe2ddf'
/** "Increase £a by b%." (d2, numeric) — traps the increase-on-its-own. */
const Q_INCREASE = '95790f96-a9fb-4ca0-ba1f-c9d9c80508aa'
/**
 * "A season ticket cost £a last year, £b this year. Work out the percentage
 * increase." (d3, numeric)
 *
 * The same relationship as Q_INCREASE, read backwards: amount and percentage
 * in becomes before and after in, percentage out. It belongs in section 2
 * rather than in the handover because it needs no second skill — it is one
 * link looked at from the other end — and its two sharpest traps are both
 * wrong-base answers, which is the half of section 2 the second conclusion
 * slot is about.
 */
const Q_INCREASE_BACKWARDS = '11fb8c8b-b53b-4d64-8c83-6a106fafeb66'
/** "Decrease £a by b%." (d2, numeric) — same shape, the other direction. */
const Q_DECREASE = '3a2a4da5-2798-45a2-9386-7449f4f7139a'
/**
 * "A jacket costs £a. In March it goes up by p%, in April down by p%. How much
 * does it cost now?" (d3, numeric, percentage_change only)
 *
 * Exactly this section's situation, and nothing else. It replaced a compound-
 * interest question, which belongs to growth_and_decay and which this section
 * barely touches. Its four traps are the four ways to get it wrong here: back
 * to £a (the fall cancels the rise), the March price, the amount taken off in
 * April, and April's percentage taken off the ORIGINAL price.
 */
const Q_UP_THEN_DOWN = '14f34689-7672-4d82-a8d2-ca8fdb7b9c33'
/**
 * "A circular pond has a radius of r m. Its radius increases by p%. Work out
 * the percentage increase in the area." (d4, numeric, exam)
 *
 * The challenge: it needs a second skill (area of a circle), which is why it
 * is not the ordinary check. It replaced a radius-free version of the same
 * question, which gave a student nothing concrete to work with. With the radius
 * given, the area can be worked out before and after, and the multiplier route
 * becomes the shortcut rather than the only way in. That also makes possible
 * a trap for the increase in square metres, never turned into a percentage.
 */
const Q_POND = '8f7e2d30-a51a-4915-9aa2-351a4049231e'

// ─── Stage 1: what a percentage of an amount even is ────────────────────────
//
// Added after the first version opened by asking for a multiplier, which
// assumed the very thing it was about to teach. A lesson does not start at the
// new idea; it starts at what the class can already do, in the context the new
// idea will arrive in. So: here is a pay rise, and before anything else, how
// much money is the rise itself? That is `fractions_of_amounts`, a
// prerequisite of this skill, wearing the situation stage 2 then picks up with
// the same numbers.
//
// The table is two columns: the percentage, and the rise worked out as
// "P × (1% of the pay)". A separate "1% of the pay" column, and a "P
// hundredths" one, were cut after review: the first said the same thing on
// every row and the second restated the percentage. The constant is still on
// every row, inside the working, which is where a student uses it.

function stagePercentOf(p: Params): Stage {
  const start = p.start
  const q = p.pUp
  return {
    title: 'A percentage of an amount',
    ask: `You earn ${money(start)} a week, and you are given a ${q}% pay rise. Before working `
      + 'out your new pay — how much money is the rise itself?',
    predict: {
      prompt: `${q}% of ${money(start)} is…`,
      on: {
        kind: 'choice',
        options: [money(start * q / 100), money(q), money(start / 100)],
        correct: 0,
        wrong: [
          '',
          `${money(q)} is the percentage read as if it were pounds. ${q}% is ${q} hundredths `
            + `of something — it is not an amount of money until you say what it is a `
            + 'percentage OF.',
          `${money(start / 100)} is 1% of ${money(start)}, which is exactly the right first `
            + `step. You need ${q} of them, not one.`,
        ],
      },
      right: `${q}% of ${money(start)} is ${money(start * q / 100)}.`,
      explain: [
        `Find 1% first, by dividing by 100: ${money(start)} ÷ 100 = ${money(start / 100)}.`,
        `${q}% is ${q} lots of that: ${q} × ${money(start / 100)} = ${money(start * q / 100)}.`,
      ],
    },
    axes: { x: AX_WHOLE, y: AY_WHOLE },
    control: {
      name: 'rise',
      // The page pictures the value tried; the student is not drawing.
      verb: 'try',
      render: (drawn, current) => percentOfBar(start, drawn[current]),
      // What to watch now lives here rather than in the verdict, which used to
      // say it — the working box sits between the two.
      prompt: `Try some other pay rises on ${money(start)}, and watch the working under the `
        + 'bar.',
      // Any whole percentage. Fives were there to keep answers tidy, but the
      // answer is money and pence absorb anything — and 1% of a start of 200,
      // 400 or 500 is whole pounds anyway.
      hint: 'Any whole percentage from 1 to 100.',
      domain: { min: 1, max: 100, step: 1 },
      suggest: [10, 45],
      label: v => `a rise of ${v}%`,
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second percentage — one bar shows you nothing about what stays the same.'
        : null),
    },
    conclude: {
      sentence: ['Per*cent* means ', ', so to find a percentage of an amount you ', '.'],
      slots: [
        {
          options: ['out of a hundred', 'multiplied by a hundred'],
          correct: 0,
          diagnosis: [
            '',
            'The other way round. Cent is a hundred — as in century, or a cent being a '
            + 'hundredth of a dollar or a euro — and per means "for each". 25% is 25 out of every 100, '
            + 'which is a quarter, not 2500.',
          ],
          misconception: ['', ''],
        },
        {
          options: [
            'divide by 100, then multiply by the percentage',
            'divide by the percentage, then multiply by 100',
          ],
          correct: 0,
          diagnosis: [
            '',
            // The page prefixes "Look again.", so this must not open with "Look".
            `The working under the bar shows it: dividing by 100 gives you 1% — ${money(start / 100)} `
            + 'here, and the same for every percentage you try, because it does not depend on the percentage at '
            + 'all. Then you take as many of those hundredths as the percentage asks for.',
          ],
          misconception: ['', 'divided_the_wrong_way_round'],
        },
      ],
      because: 'A percentage is a count of hundredths. Dividing by 100 gives one hundredth of '
        + 'the amount — one percent of it — and that single number serves every percentage you '
        + 'might want, because you just take as many of them as you need. It is why finding 1% '
        + 'first is such a useful move, and why 10% is worth knowing on sight.',
      algebraLead: 'In symbols, with P for the percentage and A for the amount. The second line '
        + 'is the working under the bar — find a hundredth, then take P of them:',
      algebra: 'P% of A = {P/100} × A\n'
        + '\u2003\u2003= P × {A/100}',
    },
    naming: {
      term: 'per*cent*',
      means: 'Per*cent* means "out of a hundred". A percentage is a number of hundredths, so it '
        + 'is a fraction with 100 underneath: 25% is {25/100}, which is a quarter.',
      elsewhere: 'Cent is a hundred — a century, a centurion, a centimetre, a cent being a '
        + 'hundredth of a dollar or a euro. Per means "for each", the same per as in miles per hour. So '
        + 'per*cent* is literally "for each hundred", and the % sign is a worn-down way of '
        + 'writing the two zeros of 100.',
      onThePaper: 'Work out 35% of 240. / A jacket costs £60. Find 15% of £60.',
    },
    check: [
      {
        questionId: Q_PERCENT_OF,
        because: 'A percentage of an amount, asked straight — the operation this section has '
          + 'just built, with nothing else attached. Its traps are the stepping stones: 1%, '
          + '10% and 5% of the amount, each of them a correct first move the student has '
          + 'stopped on, plus the percentage read as if it were pounds.',
      },
    ],
  }
}

// ─── Stage 2: an increase is a multiplication ────────────────────────────────

function stageIncrease(p: Params): Stage {
  const start = p.start
  const q = p.pUp
  return {
    title: 'An increase in one step',
    ask: `We now know that a rise of ${q}% on your pay of ${money(start)} is `
      + `${money(start * q / 100)}, and we could add those together to calculate your new pay. `
      + `But there is a quicker route. What single number could you multiply ${money(start)} `
      + 'by to land on the new pay in one step?',
    predict: {
      prompt: 'Multiply by…',
      on: {
        kind: 'choice',
        options: [dec(1 + q / 100), dec(q / 100), String(q)],
        correct: 0,
        wrong: [
          '',
          `${money(start)} × ${dec(q / 100)} = ${money(start * q / 100)}, which is the rise on its `
            + `own — the bit you would still have to add on. It is not the new pay.`,
          `${money(start)} × ${q} = ${money(start * q)}: the pay ${q} times over. A ${q}% rise `
            + 'is far smaller than that.',
        ],
      },
      right: `${dec(1 + q / 100)} — one multiplication, instead of working out the rise and `
        + 'adding it on.',
      explain: [
        `After the rise you have all of your old pay, plus ${q}% more: 100% + ${q}% = `
          + `${100 + q}% of it.`,
        `${100 + q}% as a decimal is ${100 + q} ÷ 100 = ${dec(1 + q / 100)}.`,
        `${money(start)} × ${dec(1 + q / 100)} = ${money(start * (1 + q / 100))} — the same as `
          + `${money(start)} + ${money(start * q / 100)}, in one step.`,
      ],
    },
    axes: { x: AX_GROW, y: AY_GROW },
    control: {
      name: 'increase',
      // The page pictures the value tried; the student is not drawing.
      verb: 'try',
      render: (drawn, current) => increaseBar(start, drawn[current]),
      prompt: `Pick a percentage and see what ${money(start)} becomes — watch the multiplier `
        + 'under the bar.',
      // Any whole percentage, as in section 1: the answer is money, and pence
      // absorb anything.
      hint: 'Any whole percentage from 1 to 100.',
      domain: { min: 1, max: 100, step: 1 },
      suggest: [10, 45],
      label: v => `an increase of ${v}%`,
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second percentage — one bar cannot show you what changes and what does not.'
        : null),
    },
    conclude: {
      sentence: [
        'To increase by a percentage in one step, multiply by ',
        ', and the extra you are adding is that percentage of ',
        '.',
      ],
      slots: [
        {
          options: ['1 + the percentage ÷ 100', 'the percentage ÷ 100'],
          correct: 0,
          diagnosis: [
            '',
            'That is the piece added on — the increase on its own, which you would still have to '
            + 'add on. The number under the bar is what multiplies the original in one go, and it is '
            + 'always bigger than 1.',
          ],
          misconception: ['', 'omitted_a_final_step'],
        },
        {
          options: ['the amount you started with', 'the amount you end up with'],
          correct: 0,
          diagnosis: [
            '',
            'Check a bar: the piece added on is the percentage of the STARTING '
            + 'amount, not of the total you reach. Which amount a percentage is taken from is '
            + 'the thing to keep hold of — section 3 is entirely about it.',
          ],
          misconception: ['', 'percentage_from_the_wrong_base'],
        },
      ],
      because: 'Keeping the original and adding a bit on is the same as multiplying by a number '
        + 'slightly bigger than 1. The 1 keeps what you already had, and the decimal part adds '
        + 'the percentage on top — so one multiplication does both jobs at once.',
      algebraLead: 'In symbols, with P for the percentage. The 1 is the amount you keep, and the '
        + 'fraction is what gets added:',
      algebra: 'new = old + {P/100} × old\n'
        + '  = old × (1 + {P/100})',
    },
    naming: {
      term: 'the multiplier',
      means: 'The multiplier is the single number a percentage change multiplies by. An '
        + 'increase of P% has multiplier 1 + {P/100}, which is always more than 1.',
      elsewhere: 'Shops and banks work in multipliers rather than percentages because they '
        + 'chain: a price marked up and then discounted is two multiplications in a row, and '
        + 'nobody wants to add and subtract their way through that twice.',
      onThePaper: 'Increase £240 by 15%. / Write down the multiplier for an increase of 15%.',
    },
    // The page stops at 100% so the bar fits; the mathematics does not.
    aside: {
      head: 'Can a percentage be more than 100?',
      body: 'An increase can. A 100% increase doubles the amount, and a 150% increase '
        + 'multiplies it by 1 + {150/100} = 2.5 — a price going from £40 to £100 has gone up by '
        + '150%. This page stops at 100% so the bar fits on the screen, but the rule works the '
        + 'same way past it. A decrease in an amount cannot: taking away 100% of it leaves '
        + 'nothing, so there is nothing left to take more from.',
    },
    check: [
      {
        questionId: Q_INCREASE,
        because: 'The increase, straight. Its traps are exactly the two wrong answers this '
          + 'section rules out: giving the increase on its own, and adding the percentage as '
          + 'if it were pounds.',
      },
      {
        questionId: Q_INCREASE_BACKWARDS,
        // The section never shows how to go from two prices back to the
        // percentage. That is fine to ask, but not without saying so.
        note: 'This one runs the section backwards: you are given the old and new prices, and '
          + 'asked for the percentage. We have not shown you how to do that yet, so have a go — '
          + 'the explanation afterwards walks you through it.',
        because: 'This section’s relationship run the other way. Section 2 goes amount plus '
          + 'percentage to new amount; this goes before and after to percentage. It is the '
          + 'same single link read backwards rather than a second skill, which is why it is '
          + 'an ordinary check at a step up in difficulty and not a challenge. Its two most '
          + 'interesting traps are both wrong-base answers — the percentage decrease measured '
          + 'from this year back to last, and the old price as a percentage of the new — which '
          + 'is exactly the misconception the second slot above rules out: which amount the '
          + 'percentage is taken FROM.',
      },
    ],
  }
}

// ─── Stage 3: a decrease is the same move, the other way ─────────────────────

function stageDecrease(p: Params): Stage {
  const start = p.start
  const q = p.pDown
  return {
    title: 'A decrease in one step',
    ask: `Now the other way. ${money(start)} goes DOWN by ${q}%. What is the single number to `
      + 'multiply by this time?',
    predict: {
      prompt: 'Multiply by…',
      on: {
        kind: 'choice',
        options: [dec(1 - q / 100), dec(q / 100), dec(1 + q / 100)],
        correct: 0,
        wrong: [
          '',
          `${money(start)} × ${dec(q / 100)} = ${money(start * q / 100)}, which is the amount `
            + 'that comes OFF — not what you are left with.',
          `${dec(1 + q / 100)} is the multiplier for going UP by ${q}%. It would turn `
            + `${money(start)} into ${money(start * (1 + q / 100))}.`,
        ],
      },
      right: `${dec(1 - q / 100)} — one multiplication, instead of working out the decrease `
        + 'and taking it off.',
      explain: [
        `Taking ${q}% off leaves you with 100% − ${q}% = ${100 - q}% of what you had.`,
        `${100 - q}% as a decimal is ${100 - q} ÷ 100 = ${dec(1 - q / 100)}.`,
        `${money(start)} × ${dec(1 - q / 100)} = ${money(start * (1 - q / 100))} — the same as `
          + `${money(start)} − ${money(start * q / 100)}, in one step.`,
      ],
    },
    axes: { x: AX_WHOLE, y: AY_WHOLE },
    control: {
      name: 'decrease',
      // The page pictures the value tried; the student is not drawing.
      verb: 'try',
      render: (drawn, current) => decreaseBar(start, drawn[current]),
      prompt: `Pick a percentage to take off ${money(start)}, and watch the multiplier under `
        + 'the bar.',
      // Any whole percentage up to 100, as in sections 1 and 2. It used to stop
      // at 99, because 100% off gives a multiplier of 0 and the rule then said
      // "between 0 and 1". The rule now says "less than 1", which 0 is — and
      // taking 100% off, leaving nothing, is worth seeing.
      hint: 'Any whole percentage from 1 to 100.',
      domain: { min: 1, max: 100, step: 1 },
      suggest: [15, 40],
      label: v => `a decrease of ${v}%`,
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second percentage, so you can see which part of the multiplier moves.'
        : null),
    },
    conclude: {
      sentence: [
        'To decrease by a percentage, multiply by ',
        ', which is a number that is ',
        '.',
      ],
      slots: [
        {
          options: ['1 − the percentage ÷ 100', '− the percentage ÷ 100'],
          correct: 0,
          diagnosis: [
            '',
            'A multiplier is never negative here — multiplying money by a negative number would '
            + 'leave you owing it. Read what is left under the bar: taking 30% off means keeping '
            + '70%, and 70% is 0.7.',
          ],
          misconception: ['', 'sign_error'],
        },
        {
          // "Less than 1", not "between 0 and 1": true of EVERY decrease. A 100%
          // decrease has multiplier 0, and one past 100% — a £10,000 profit
          // becoming a £5,000 loss — has a negative one. It also mirrors
          // section 2's "always more than 1".
          options: ['less than 1', 'more than 1'],
          correct: 0,
          diagnosis: [
            '',
            'Only an increase multiplies by more than 1. Every multiplier under your bars is '
            + 'smaller than 1, which is what makes the amount shrink.',
          ],
          misconception: ['', ''],
        },
      ],
      because: 'A decrease is not a different operation from an increase — it is the same one '
        + 'with a smaller multiplier. Taking P% off means keeping (100 − P)% of what you had, '
        + 'and that is what 1 − {P/100} is: the fraction you keep. Whatever the percentage, that '
        + 'is less than 1 — and at exactly 100% it is 0: take all of it away and nothing is left.',
      algebraLead: 'The same line as before, with the fraction taken away instead of added:',
      algebra: 'new = old − {P/100} × old\n'
        + '  = old × (1 − {P/100})',
    },
    // No definition card. "Keeping, not losing" was a way of reading the
    // multiplier, not a term, and the section's conclusion already says it.
    check: [
      {
        questionId: Q_DECREASE,
        because: 'The decrease, straight — the mirror of the first section’s check, with '
          + 'the same two traps pointing the other way.',
      },
    ],
  }
}

// ─── Stage 4: the one that surprises people ──────────────────────────────────

function stageBothWays(p: Params): Stage {
  const start = p.start
  const q = p.pBoth
  const back = start * (1 + q / 100) * (1 - q / 100)
  return {
    title: 'Up, then down',
    ask: `${money(start)} goes up by ${q}%. Then that new amount goes down by ${q}% — the same `
      + 'percentage, straight back off. Where do you end up?',
    predict: {
      prompt: 'After up and then down by the same percentage, you have…',
      on: {
        kind: 'choice',
        options: [
          `less than ${money(start)}`,
          `exactly ${money(start)}`,
          `more than ${money(start)}`,
        ],
        correct: 0,
        wrong: [
          '',
          'Almost everybody says that — it feels as if the percentage coming off should cancel '
            + `the one that went on. It does not: you end on ${money(back)}.`,
          `It goes up first, but you do not stay above ${money(start)}: you end on `
            + `${money(back)}.`,
        ],
      },
      right: `You end on ${money(back)}, below where you started — and most people say `
        + `${money(start)}.`,
      // The working AND the reason, in this draw's money: the same percentage of
      // a bigger amount is more. This is the conclusion's second blank in
      // numbers — said here at the reviewer's request, because without it the
      // working shows THAT you end lower and never why. The sentence still asks
      // the student to state it in general.
      explain: [
        `Up ${q}%: ${q}% of ${money(start)} is ${money(start * q / 100)}, so you go up to `
          + `${money(start * (1 + q / 100))}.`,
        `Down ${q}%: now it is ${q}% of ${money(start * (1 + q / 100))}, which is `
          + `${money(start * (1 + q / 100) * q / 100)} — so you come down to ${money(back)}.`,
        `${q}% of ${money(start * (1 + q / 100))} is bigger than ${q}% of ${money(start)}, because `
          + `${money(start * (1 + q / 100))} is the bigger amount. More comes off than went on, so `
          + `you end ${money(start - back)} below where you started.`,
      ],
    },
    axes: { x: AX_GROW, y: AY_TWICE },
    control: {
      name: 'percentage',
      // The page pictures the value tried; the student is not drawing.
      verb: 'try',
      render: (drawn, current) => upThenDownBars(start, drawn[current]),
      prompt: 'Pick a percentage. It goes up by that, then down by the same — does it ever '
        + 'come back to the start?',
      // Any whole percentage up to 100, as everywhere else. Up 100% then down
      // 100% leaves nothing at all — the extreme case of the point this section
      // makes. Tens were never needed for tidiness: start × (1 − (P/100)²) is
      // always exact to the penny for a start of 200, 400 or 500.
      hint: 'Any whole percentage from 1 to 100.',
      domain: { min: 1, max: 100, step: 1 },
      suggest: [10, 50],
      label: v => `up ${v}% then down ${v}%`,
      coverage: drawn => {
        if (new Set(drawn).size < 2) {
          return 'One bar could be a fluke. Try another percentage.'
        }
        if (!drawn.some(v => v >= 40)) {
          return 'Now try a big one — 40% or more — and see whether the gap stays small.'
        }
        return null
      },
    },
    conclude: {
      sentence: [
        'Going up and then down by the same percentage leaves you with ',
        ', because the decrease is worked out on ',
        '.',
      ],
      slots: [
        {
          options: [
            'less than you started with',
            'exactly what you started with',
            'more than you started with',
          ],
          correct: 0,
          diagnosis: [
            '',
            'The lower bar shows it: it stops short of the dashed start line, every time, for '
            + 'every percentage you tried. The fall never quite undoes the rise.',
            'Every lower bar you made stops short of the start line, never past it. The rise '
            + 'comes first, but the fall is the bigger of the two.',
          ],
          misconception: ['', 'percentage_from_the_wrong_base', 'percentage_from_the_wrong_base'],
        },
        {
          options: [
            'a bigger amount than the increase was',
            'the amount you first started with',
          ],
          correct: 0,
          diagnosis: [
            '',
            'The decrease is taken off the amount AFTER the rise, which is bigger than what you '
            + 'began with. The same percentage of a bigger amount is more money — so more comes '
            + 'off than went on.',
          ],
          misconception: ['', 'percentage_from_the_wrong_base'],
        },
      ],
      because: 'The two changes are the same percentage but not the same amount of money. The '
        + 'rise is worked out on what you started with; the fall is worked out on the larger '
        + 'amount you had after the rise, so it takes more off than the rise put on. The '
        + 'multipliers say it more directly: they come to just under 1, and the bigger the '
        + 'percentage the further under it they land.',
      algebraLead: 'Multiplying the two multipliers together is a difference of two squares, and '
        + 'it shows exactly how much you lose:',
      algebra: '(1 + {P/100}) × (1 − {P/100})\n'
        + '  = 1 − ({P/100})²',
    },
    // Not a definition — "multipliers compose" is nobody's vocabulary — but the
    // idea is worth carrying away, so it keeps the card under another label.
    // The old version also claimed a shop could mark up 50% and then sell at
    // 50% off "without losing money"; it does lose: £100 → £150 → £75.
    naming: {
      label: 'Worth knowing',
      term: 'changes in a row multiply',
      means: `Two percentage changes one after the other are two multiplications. Up ${q}% `
        + `then down ${q}% is × ${dec(1 + q / 100)} then × ${dec(1 - q / 100)}, which comes to `
        + `× ${dec((1 + q / 100) * (1 - q / 100))} — not × 1.`,
      elsewhere: 'A shop that marks a £100 item up by 50% and then sells it at "50% off" takes '
        + '£75, not £100. And the same change repeated is how savings grow: 3% a year for five '
        + 'years is × 1.03 five times over, which is more than adding 15%.',
      onThePaper: 'A price rises by 10% and then falls by 10%. Find the overall percentage '
        + 'change.',
    },
    aside: {
      head: 'Does the order matter?',
      body: 'No — and that is worth noticing. Down-then-up lands on exactly the same amount, '
        + 'because multiplication does not care which way round you do it. What matters is '
        + 'that the two percentages are of different amounts, not which one happens first.',
    },
    check: [
      {
        questionId: Q_UP_THEN_DOWN,
        because: 'This section exactly: up by a percentage, then down by the same one. Each of '
          + 'its traps is one of the ways to get it wrong here, and the first is the one '
          + 'almost everybody makes: assuming the fall cancels the rise.',
      },
      {
        questionId: Q_POND,
        challenge: true,
        because: 'The same multiplier applied twice, inside a circle: scale the radius by 1.2 '
          + 'and the area scales by 1.2². It needs the area of a circle as well, which is why '
          + 'it is the challenge rather than the check.',
      },
    ],
  }
}

export const percentageChangeInvestigation: Investigation = {
  skillId: 'percentage_change',
  title: 'What a Percentage Change Really Does',
  invite: 'you try percentage changes yourself and work out what they really do, rather than being told.',
  outcomes: {
    // What the topic is FOR, not what it is made of. "Every percentage change
    // is one multiplication" is the DESTINATION of section 2 — true, useful,
    // and meaningless to someone who has not got there yet.
    lead: 'A sale in a shop, a pay rise, interest on savings, VAT on a bill, a population '
      + 'growing or a phone battery draining — these are all percentage changes. It is the '
      + 'arithmetic you are most likely to meet outside a classroom, and the one most often '
      + 'got wrong in ways that cost people money.',
    // One measurable verb each (lib/skills/bloom.ts): apply, understand,
    // apply, understand. The two "explain" outcomes are the rules sections 2
    // and 4 have the student put into words.
    points: [
      'calculate a percentage of any amount, by finding 1% first',
      'explain why a percentage increase or decrease can be done with a single multiplication',
      'use a multiplier to increase or decrease any amount in one step',
      'explain why going up and then down by the same percentage leaves less than you started with',
    ],
  },
  parameters: {
    values: {
      // Round amounts only: the arithmetic is not the point here, and pence in
      // the stem would make the table about rounding instead of multipliers.
      start: [200, 400, 500],
      // Stage 1's prediction. Away from 50, or "1 + P/100" and "P/100" would
      // be two different options rendering as 1.5 and 0.5 — fine — but 100
      // would collide with the third option.
      pUp: [10, 20, 25],
      // Stage 2's. Never 50: there 1 − P/100 and P/100 are both 0.5, and the
      // prediction would offer the same answer twice.
      pDown: [10, 20, 25, 40],
      // Stage 3's. Big enough that the shortfall is visible in pounds rather
      // than pence — at 5% on £200 it is 50p, which reads as a rounding slip.
      pBoth: [10, 20, 25],
    },
    // Three different percentages across the three stages, so a student cannot
    // carry one section's arithmetic into the next instead of redoing it.
    valid: p => p.pUp !== p.pDown && p.pDown !== p.pBoth && p.pUp !== p.pBoth,
  },
  build: p => [stagePercentOf(p), stageIncrease(p), stageDecrease(p), stageBothWays(p)],
  /**
   * The handover. Both are d4 and both wrap the multiplier in something else —
   * a ratio share, then a best-buy comparison — which is how the skill appears
   * on a paper once it stops being asked for directly.
   */
  transferQuestionIds: [
    '245fb5b8-cb5a-497e-ae90-1e98f3beadcf',  // ratio share, then 20% spent (d4)
    '7a289a0d-e649-49d5-9777-b379d8971de0',  // comparing two shops (d4)
  ],
}
