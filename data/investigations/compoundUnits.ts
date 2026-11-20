import type { Investigation, Params, Stage } from './types'
import type { GridLabel, RenderedAxis, RenderedGrid } from '../../lib/questions/gridDraw'
import { barModelGrid, fitLabel } from '../../lib/skills/investigationFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Compound units, through speed — the third investigation.
//
// Chosen by exam marks and by what the bank can check (docs: the targets
// review of 2026-11-17): 279 marks across the corpus, the most single-part
// questions of any candidate, and nothing the page cannot already draw — the
// bar model built for percentage change carries every figure here.
//
// Four sections, each opening from something the student can already do:
//
//   1. Distance in each hour — sharing a journey equally between its hours.
//      That share IS the speed.
//   2. From a speed to a distance — the same bar built up an hour at a time,
//      and the time found by going back the other way.
//   3. Minutes are not decimals — the error that costs the most marks on
//      paper: 20 minutes is a third of an hour, never 0.2.
//   4. There and back — out at 60, back at 30, and the average is 40, not 45.
//      The bar is drawn in TIME, so the slow half visibly takes longer.
//
// Density is not a section of its own. It is the same "per" with grams and
// cubic centimetres, so it appears as section 1's second check (with a note
// saying so) and in the questions at the end.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Section checks ──────────────────────────────────────────────────────────

/** "A car travels a×b miles in a hours. Average speed?" (d1, numeric) */
const Q_SPEED = '7d7efd65-ddd9-42a4-bff0-7d1ad33a63d5'
/**
 * "A block has a mass of m g and a volume of v cm³. Density?" (d2, numeric)
 *
 * Section 1's second check, with a note: the same division, in a unit the page
 * has not shown. It is the "per" idea travelling, which is the point of naming
 * these compound units at all.
 */
const Q_DENSITY = '9221a578-51b3-4fd5-ab9e-358fae3613de'
/** "A train travels d km at s km/h. How long does it take?" (d2, numeric) */
const Q_TIME = '1785da89-1ef2-4b5d-99b8-3a688b566a3e'
/**
 * "A cyclist rides at s km/h for m minutes. How far?" (d3, numeric, exam)
 *
 * Tagged time_calculations as well, because it is: the whole question is
 * turning the minutes into hours, which is exactly section 3.
 */
const Q_MINUTES = 'bf2216ef-41cf-4377-969a-c6d33a7b9299'
/**
 * "A van drives d km from A to B at a km/h, and back at b km/h. Average speed
 * for the whole journey?" (d3, numeric)
 *
 * Written for section 4: the bank's only other question on a round trip is
 * multi-part, which a section check cannot show. Its first trap is the
 * average of the two speeds — the answer almost everybody gives — and the
 * others are the speeds added, one leg's distance over the total time, and
 * the total time itself.
 */
const Q_ROUND_TRIP = 'e82eda35-0dae-443f-a01e-4043c60506dc'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** A number to at most one decimal place, without a trailing .0. */
const one = (n: number) => String(Math.round(n * 10) / 10)
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
/** n/d in lowest terms as prose markup — a stacked fraction, or a whole number. */
function fracMark(n: number, d: number): string {
  const g = gcd(n, d)
  return d / g === 1 ? String(n / g) : `{${n / g}/${d / g}}`
}
/** n/d in lowest terms as plain text, for a figure label (which cannot stack). */
function fracText(n: number, d: number): string {
  const g = gcd(n, d)
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`
}
const hours = (n: number) => `${one(n)} hour${n === 1 ? '' : 's'}`

// ─── Figures ─────────────────────────────────────────────────────────────────
//
// Every figure is a bar model (lib/skills/investigationFigures.ts), and every
// one acts out the change when a value is tried. Steps match on both axes, as
// barModelGrid requires: 0–60 in sixes for a bar measured in tenths of a
// journey, sixths of a drive, or minutes; 0–10 in ones for a bar of hours.

const GROW = 0.7
const PAUSE = 0.2

const AX_SIXTY: RenderedAxis = { min: 0, max: 60, step: 6, label: '' }
const AY_ONE_BAR: RenderedAxis = { min: 0, max: 18, step: 6, label: '' }
const AX_HOURS: RenderedAxis = { min: 0, max: 10, step: 1, label: '' }
const AY_HOURS: RenderedAxis = { min: 0, max: 3, step: 1, label: '' }

const above = (x: number, y: number, text: string, axis: RenderedAxis): GridLabel =>
  ({ x: fitLabel(x, text, axis), y, text, dy: -7 })
const below = (x: number, y: number, text: string, axis: RenderedAxis, line = 1): GridLabel =>
  ({ x: fitLabel(x, text, axis), y, text, dy: line === 1 ? 15 : 29 })

/**
 * Section 1: the journey as one bar, cut into equal hours. Each hour's share
 * is written inside it, and the first is shaded — that share is the speed.
 */
function journeyBar(distance: number, v: number | undefined): RenderedGrid {
  if (v === undefined) {
    return barModelGrid({
      x: AX_SIXTY,
      y: AY_ONE_BAR,
      bars: [{ y: 6, height: 6, pieces: [{ from: 0, to: 60, fill: 'light' }] }],
      labels: [above(30, 12, `${distance} km`, AX_SIXTY)],
    })
  }
  const w = 60 / v
  const share = distance / v
  return barModelGrid({
    x: AX_SIXTY,
    y: AY_ONE_BAR,
    bars: [{
      y: 6,
      height: 6,
      pieces: [
        { from: 0, to: 60, fill: 'light' },
        { from: 0, to: w, fill: 'shaded', grow: { from: 0, start: 0, end: GROW } },
      ],
      dividers: Array.from({ length: v + 1 }, (_, k) => k * w),
    }],
    labels: [
      above(30, 12, `${distance} km in ${hours(v)}`, AX_SIXTY),
      // Inside every hour: each one gets the same share.
      ...Array.from({ length: v }, (_, k): GridLabel => ({ x: (k + 0.5) * w, y: 9, text: `${share} km`, dy: 4 })),
      below(30, 6, `${distance} ÷ ${v} = ${share} km in each hour`, AX_SIXTY),
    ],
  })
}

/** Section 2: one hour's distance, laid end to end as many times as there are hours. */
function driveBar(speed: number, v: number | undefined): RenderedGrid {
  if (v === undefined) {
    return barModelGrid({ x: AX_SIXTY, y: AY_ONE_BAR, bars: [], labels: [] })
  }
  return barModelGrid({
    x: AX_SIXTY,
    y: AY_ONE_BAR,
    bars: [{
      y: 6,
      height: 6,
      // One piece per drive, growing hour by hour: its dividers turn up as
      // the edge passes them.
      pieces: [{ from: 0, to: 10 * v, fill: 'shaded', grow: { from: 0, start: 0, end: GROW } }],
      dividers: Array.from({ length: v + 1 }, (_, k) => k * 10),
    }],
    labels: [
      above(5 * v, 12, `${hours(v)} at ${speed} km/h`, AX_SIXTY),
      below(5 * v, 6, `${v} × ${speed} = ${v * speed} km`, AX_SIXTY),
    ],
  })
}

/** Section 3: one hour as a bar of 60 minutes, with the ride shaded. */
function hourBar(speed: number, m: number | undefined): RenderedGrid {
  const labels = [above(30, 12, `1 hour = 60 minutes: ${speed} km`, AX_SIXTY)]
  const pieces = m === undefined
    ? [{ from: 0, to: 60, fill: 'light' as const }]
    : [
      { from: 0, to: 60, fill: 'light' as const },
      { from: 0, to: m, fill: 'shaded' as const, grow: { from: 0, start: 0, end: GROW } },
    ]
  if (m !== undefined) {
    labels.push(below(m / 2, 6, `${m} min: ${one((speed * m) / 60)} km`, AX_SIXTY))
    labels.push(below(30, 6, m === 60
      ? '60 minutes = 1 hour'
      : `${m} minutes = ${m}/60 = ${fracText(m, 60)} of an hour`, AX_SIXTY, 2))
  }
  return barModelGrid({
    x: AX_SIXTY,
    y: AY_ONE_BAR,
    bars: [{ y: 6, height: 6, pieces, dividers: Array.from({ length: 13 }, (_, k) => k * 5) }],
    labels,
  })
}

/**
 * Section 4: the round trip drawn in TIME, out then back. The same distance
 * each way, so the slower half is the longer piece of bar — which is the whole
 * reason the average is pulled towards it.
 */
function tripBar(each: number, out: number, back: number | undefined): RenderedGrid {
  const t1 = each / out
  if (back === undefined) {
    return barModelGrid({
      x: AX_HOURS,
      y: AY_HOURS,
      bars: [{ y: 1, height: 1, pieces: [{ from: 0, to: t1, fill: 'light' }], dividers: Array.from({ length: 11 }, (_, k) => k) }],
      labels: [above(t1 / 2, 2, `out: ${hours(t1)} at ${out} km/h`, AX_HOURS)],
    })
  }
  const t2 = each / back
  const total = t1 + t2
  return barModelGrid({
    x: AX_HOURS,
    y: AY_HOURS,
    bars: [{
      y: 1,
      height: 1,
      pieces: [
        { from: 0, to: t1, fill: 'light', grow: { from: 0, start: 0, end: GROW } },
        { from: t1, to: total, fill: 'shaded', grow: { from: 0, start: GROW + PAUSE, end: 2 * GROW + PAUSE } },
      ],
      dividers: Array.from({ length: 11 }, (_, k) => k),
    }],
    labels: [
      above(t1 / 2, 2, `out: ${one(t1)} h at ${out} km/h`, AX_HOURS),
      below(t1 + t2 / 2, 1, `back: ${one(t2)} h at ${back} km/h`, AX_HOURS),
      below(total / 2, 1, `${2 * each} km ÷ ${one(total)} h = ${one((2 * each) / total)} km/h`, AX_HOURS, 2),
    ],
  })
}

// ─── Stage 1: distance in each hour ──────────────────────────────────────────
//
// Starts from sharing, which every student can already do: a steady journey
// hands each hour the same distance. The share is the speed — named only at
// the end, once they have found it.

/** [distance, hours]: every distance divides by 1–6, so every share is whole. */
const S1 = [[120, 3], [180, 4], [240, 4], [360, 5]] as const

function stageEachHour(p: Params): Stage {
  const [distance, t] = S1[p.s1]
  const share = distance / t
  return {
    title: 'Distance in each hour',
    ask: `A coach travels ${distance} km in ${t} hours, at a steady speed the whole way. `
      + 'How far does it go in each hour?',
    axes: { x: AX_SIXTY, y: AY_ONE_BAR },
    predict: {
      prompt: 'In each hour, the coach goes…',
      on: {
        kind: 'choice',
        options: [`${share} km`, `${distance * t} km`, `1/${share} km`],
        correct: 0,
        wrong: [
          '',
          `${distance} × ${t} = ${distance * t} km is ${t} times further than the whole `
            + `journey. Each hour is only part of the trip, so it covers less than the `
            + `${distance} km, not more.`,
          `That is ${t} ÷ ${distance} = {1/${share}} — how long each kilometre takes, in hours. `
            + 'A real rate, but the wrong way round: the question wants kilometres for each hour.',
        ],
      },
      right: `${share} km in each hour — ${t} equal shares of ${distance} km.`,
      explain: [
        `The speed is steady, so every hour covers the same distance: share the ${distance} km `
          + `equally between the ${t} hours.`,
        `${distance} ÷ ${t} = ${share}, so the coach goes ${share} km in each hour.`,
      ],
    },
    control: {
      name: 'hours',
      verb: 'try',
      render: (drawn, current) => journeyBar(distance, drawn[current]),
      prompt: `Keep the same ${distance} km, but take a different number of hours. Watch each `
        + 'hour’s share.',
      hint: 'Any whole number of hours from 1 to 6.',
      domain: { min: 1, max: 6, step: 1 },
      suggest: [2, 6],
      label: v => `${distance} km in ${hours(v)}`,
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second number of hours — one bar cannot show you what the hours do.'
        : null),
    },
    conclude: {
      sentence: ['A speed is the distance travelled in ', ', so to find it you ', '.'],
      slots: [
        {
          options: ['one hour', 'the whole journey'],
          correct: 0,
          diagnosis: [
            '',
            'The whole journey is the distance. A speed is a share of it — how much each hour '
            + 'gets — which is why more hours for the same distance means a slower speed.',
          ],
          misconception: ['', 'answered_a_different_quantity'],
        },
        {
          options: ['divide the distance by the time', 'multiply the distance by the time'],
          correct: 0,
          diagnosis: [
            '',
            'Multiplying gives more than the whole journey. The journey is shared out between '
            + 'the hours, and sharing is dividing.',
          ],
          misconception: ['', 'multiplied_instead_of_divided'],
        },
      ],
      because: 'A speed is a share. A steady journey gives every hour the same distance, so '
        + 'dividing the distance by the number of hours gives one hour’s share — and that share '
        + 'is the speed. More hours for the same distance means a smaller share: a slower speed.',
      algebraLead: 'In symbols:',
      algebra: 'speed = {distance/time}',
    },
    // A hint, not a definition: the unit IS the formula, which is the most
    // useful thing to carry into an exam where the formula is not given.
    naming: {
      label: 'Hint',
      term: 'the unit tells you the formula',
      means: 'km/h means kilometres ÷ hours — a distance divided by a time. So a speed in km/h '
        + 'is distance ÷ time. If you forget the formula, read it off the unit.',
      elsewhere: 'It works for every compound unit. Density in g/cm³ is grams ÷ cm³, so density '
        + '= mass ÷ volume. A price in £/kg is pounds ÷ kilograms. And it works backwards to '
        + 'check an answer: km/h × hours leaves km, so speed × time gives a distance.',
      onThePaper: 'A car travels 150 miles in 3 hours. Work out its average speed in miles per '
        + 'hour.',
    },
    check: [
      {
        questionId: Q_SPEED,
        because: 'The section exactly: a distance and a time, and the share of the distance '
          + 'each hour gets. Its traps are multiplying, and dividing the wrong way round.',
      },
      {
        questionId: Q_DENSITY,
        note: 'This one uses the same idea in a different compound unit: density, the grams in '
          + 'each cubic centimetre. We have not shown you density yet, so have a go — the '
          + 'explanation afterwards walks you through it.',
        because: 'The "per" idea travelling: mass shared out between cubic centimetres is the '
          + 'same division as distance shared out between hours. It is what makes these '
          + 'COMPOUND units rather than a fact about speed.',
      },
    ],
  }
}

// ─── Stage 2: from a speed to a distance ─────────────────────────────────────

/** [speed, hours] */
const S2 = [[50, 3], [40, 4], [70, 2]] as const

function stageFromSpeed(p: Params): Stage {
  const [speed, h] = S2[p.s2]
  return {
    title: 'From a speed to a distance',
    ask: `Now the other way round. A lorry drives at a steady ${speed} km/h for ${h} hours. `
      + 'How far does it go?',
    axes: { x: AX_SIXTY, y: AY_ONE_BAR },
    predict: {
      prompt: `In ${h} hours, the lorry goes…`,
      on: {
        kind: 'choice',
        options: [`${speed * h} km`, `${one(speed / h)} km`, `${speed + h} km`],
        correct: 0,
        wrong: [
          '',
          `${speed} ÷ ${h} shares ONE hour’s distance between ${h} hours, so it comes out less `
            + `than an hour’s drive. In ${h} hours the lorry goes further than in one, not less.`,
          `${speed} + ${h} adds kilometres to hours, which are different kinds of thing. Each `
            + `hour adds another ${speed} km, so ${h} hours is ${h} lots of ${speed}.`,
        ],
      },
      right: `${speed * h} km — ${speed} km in each of ${h} hours.`,
      explain: [
        `At ${speed} km/h the lorry covers ${speed} km in each hour.`,
        `${h} hours is ${h} lots of that: ${h} × ${speed} = ${speed * h} km.`,
        `And back the other way: ${speed * h} km at ${speed} km/h takes ${speed * h} ÷ ${speed} `
          + `= ${h} hours.`,
      ],
    },
    control: {
      name: 'hours',
      verb: 'try',
      render: (drawn, current) => driveBar(speed, drawn[current]),
      prompt: `Keep the speed at ${speed} km/h and change how long the lorry drives. Watch the `
        + 'distance build up, an hour at a time.',
      hint: 'Any whole number of hours from 1 to 6.',
      domain: { min: 1, max: 6, step: 1 },
      suggest: [1, 5],
      label: v => `${hours(v)} at ${speed} km/h`,
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second length of drive, so you can see what each extra hour adds.'
        : null),
    },
    conclude: {
      sentence: ['To find a distance, ', '; to find a time, ', '.'],
      slots: [
        {
          options: ['multiply the speed by the time', 'divide the speed by the time'],
          correct: 0,
          diagnosis: [
            '',
            'Dividing gives less than one hour’s drive. Every extra hour adds another hour’s '
            + 'distance, and adding the same amount again and again is multiplying.',
          ],
          misconception: ['', ''],
        },
        {
          options: ['divide the distance by the speed', 'multiply the distance by the speed'],
          correct: 0,
          diagnosis: [
            '',
            `Multiplying a distance by a speed gives an enormous number in no sensible unit. `
            + `The question is how many hours fit into the distance — how many lots of `
            + `${speed} km make ${speed * h} km — and that is dividing.`,
          ],
          misconception: ['', 'multiplied_instead_of_divided'],
        },
      ],
      because: 'Speed, distance and time are one relationship looked at three ways. The '
        + 'distance is the speed times the time; divide it by either of those to get the other '
        + 'one back. Which one you want decides which you do.',
      algebraLead: 'All three, from the one line:',
      algebra: 'distance = speed × time\n'
        + '  speed = {distance/time}\n'
        + '  time = {distance/speed}',
    },
    naming: {
      label: 'Worth knowing',
      term: 'the formula triangle',
      means: 'Many people remember it as a triangle, D on top and S and T underneath. Cover '
        + 'the one you want and the other two tell you what to do: D = S × T, S = D ÷ T, '
        + 'T = D ÷ S.',
      elsewhere: 'A sat-nav’s arrival time is this, worked out again and again: the distance '
        + 'left divided by your speed, updated every time you slow down.',
      onThePaper: 'A train travels 210 km at 70 km/h. How long does the journey take?',
    },
    check: [
      {
        questionId: Q_TIME,
        because: 'The second half of the rule: a distance and a speed, and the time between '
          + 'them. Its traps are multiplying, and dividing the wrong way round.',
      },
    ],
  }
}

// ─── Stage 3: minutes are not decimals ───────────────────────────────────────
//
// The error that costs the most marks: 20 minutes keyed in as 0.2 hours. It
// is a units mistake hiding as a decimals one, and the bar makes the hour's
// 60 minutes visible.

/** [speed, minutes]: speeds are multiples of 12, so every 5 minutes is a whole km. */
const S3 = [[24, 20], [36, 40], [48, 15], [60, 45]] as const

function stageMinutes(p: Params): Stage {
  const [speed, m] = S3[p.s3]
  const d = (speed * m) / 60
  return {
    title: 'Minutes are not decimals',
    ask: `Journeys are often given in minutes, not hours. A cyclist rides at ${speed} km/h for `
      + `${m} minutes. How far do they go?`,
    axes: { x: AX_SIXTY, y: AY_ONE_BAR },
    predict: {
      prompt: `In ${m} minutes, the cyclist goes…`,
      on: {
        kind: 'choice',
        options: [`${d} km`, `${one((speed * m) / 100)} km`, `${speed * m} km`],
        correct: 0,
        wrong: [
          '',
          `That uses ${m} minutes as ${m / 100} of an hour. But an hour has 60 minutes, not `
            + `100: ${m} minutes is {${m}/60} = ${fracMark(m, 60)} of an hour.`,
          `${speed} × ${m} treats the ${m} minutes as if they were ${m} hours. Change the minutes `
            + `into hours first: ${m} minutes is ${fracMark(m, 60)} of an hour.`,
        ],
      },
      right: `${d} km — ${m} minutes is ${fracMark(m, 60)} of an hour.`,
      explain: [
        `An hour is 60 minutes, so ${m} minutes is {${m}/60} = ${fracMark(m, 60)} of an hour.`,
        `In a whole hour the cyclist goes ${speed} km, so in ${fracMark(m, 60)} of an hour they `
          + `go ${speed} × ${fracMark(m, 60)} = ${d} km.`,
      ],
    },
    control: {
      name: 'minutes',
      verb: 'try',
      render: (drawn, current) => hourBar(speed, drawn[current]),
      prompt: `Keep the speed at ${speed} km/h and change how many minutes the ride lasts.`,
      hint: 'Any number of minutes from 5 to 60, in fives.',
      domain: { min: 5, max: 60, step: 5 },
      suggest: [30, 45],
      label: v => `${v} minutes at ${speed} km/h`,
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second number of minutes, and watch what fraction of the hour it is.'
        : null),
    },
    conclude: {
      sentence: ['To change minutes into hours, ', ', so 30 minutes is ', ' of an hour.'],
      slots: [
        {
          options: ['divide by 60', 'divide by 100'],
          correct: 0,
          diagnosis: [
            '',
            'There are 60 minutes in an hour, not 100. Dividing by 100 is right for pence in a '
            + 'pound or centimetres in a metre — time is the odd one out.',
          ],
          misconception: ['', 'converted_with_the_wrong_factor'],
        },
        {
          options: ['0.5', '0.3'],
          correct: 0,
          diagnosis: [
            '',
            'Half an hour is 30 minutes, and a half is 0.5. 0.3 of an hour is three tenths of 60 '
            + 'minutes, which is 18.',
          ],
          misconception: ['', 'converted_with_the_wrong_factor'],
        },
      ],
      because: 'Minutes do not count in tenths of an hour, so they are not its decimal part. '
        + '30 minutes is a half, 0.5; 45 minutes is three quarters, 0.75; 20 minutes is a third, '
        + '0.333… — never 0.2.',
      algebraLead: 'In symbols, for a ride of M minutes:',
      algebra: 'hours = {M/60}\n'
        + '  distance = speed × {M/60}',
    },
    aside: {
      head: 'Why is 1 hour 30 minutes not 1.3 hours?',
      body: 'A clock shows 1:30, which looks like 1.30. But the 30 is minutes out of 60, so it '
        + 'is half an hour: 1.5 hours. A journey of 1 hour 30 minutes at 40 km/h is '
        + '40 × 1.5 = 60 km — using 1.3 would give 52.',
    },
    check: [
      {
        questionId: Q_MINUTES,
        because: 'The section exactly: a speed in km/h and a time in minutes. The minutes have '
          + 'to become a fraction of an hour before anything else, and its traps are the two '
          + 'ways of not doing that.',
      },
    ],
  }
}

// ─── Stage 4: there and back ─────────────────────────────────────────────────
//
// The surprise, as percentage change's "up, then down" is there: the same
// distance each way, so the slow half takes longer and pulls the average
// towards it. Out at 60 and back at 30 averages 40, not 45.
//
// Checked by a question written for it (Q_ROUND_TRIP): the bank's only other
// round-trip question is multi-part, which a section check cannot show.

/** The trip each way, in km. Every speed below divides it. */
const EACH = 120
/** [out, back] for the prediction: every average comes out whole. */
const S4 = [[60, 30], [40, 120], [60, 20], [40, 60]] as const

function stageThereAndBack(p: Params): Stage {
  const [out, back] = S4[p.s4]
  const t1 = EACH / out
  const t2 = EACH / back
  const avg = (2 * EACH) / (t1 + t2)
  const mean = (out + back) / 2
  return {
    title: 'There and back',
    ask: `A van drives ${EACH} km to a town at ${out} km/h, then drives the same ${EACH} km `
      + `back at ${back} km/h. What is its average speed for the whole trip?`,
    axes: { x: AX_HOURS, y: AY_HOURS },
    predict: {
      prompt: 'The average speed for the whole trip is…',
      on: {
        kind: 'choice',
        options: [`${avg} km/h`, `${mean} km/h`, `${out + back} km/h`],
        correct: 0,
        wrong: [
          '',
          'That is the average of the two speeds, and almost everybody says it. But the van '
            + 'does not spend the same time at each speed — the slower half takes longer, so '
            + 'it counts for more. The working is below.',
          `${out} + ${back} is faster than the van ever goes. An average speed has to sit `
            + 'between the speeds it is made of.',
        ],
      },
      right: `${avg} km/h — and most people say ${mean}.`,
      explain: [
        `Out: ${EACH} km at ${out} km/h takes ${EACH} ÷ ${out} = ${hours(t1)}.`,
        `Back: ${EACH} km at ${back} km/h takes ${EACH} ÷ ${back} = ${hours(t2)}.`,
        `Whole trip: ${2 * EACH} km in ${hours(t1 + t2)}, so ${2 * EACH} ÷ ${one(t1 + t2)} = `
          + `${avg} km/h.`,
      ],
    },
    control: {
      name: 'back',
      verb: 'try',
      render: (drawn, current) => tripBar(EACH, out, drawn[current]),
      prompt: `Keep the trip out at ${out} km/h and change the speed on the way back. Watch how `
        + 'long each half takes.',
      hint: 'Any speed from 20 to 120 km/h, in twenties.',
      domain: { min: 20, max: 120, step: 20 },
      suggest: [20, 120],
      label: v => `back at ${v} km/h`,
      coverage: drawn => {
        if (new Set(drawn).size < 2) return 'Try a second speed for the way back.'
        // The one case where halving the speeds works: the same speed both
        // ways, so the same time each way. Worth seeing once.
        if (!drawn.includes(out)) {
          return `Now come back at ${out} km/h — the same speed both ways — and see what the `
            + 'average does.'
        }
        return null
      },
    },
    conclude: {
      sentence: [
        'Average speed is the total distance divided by ',
        ', so it ends up closer to the ',
        ' speed.',
      ],
      slots: [
        {
          options: ['the total time', 'the two speeds added'],
          correct: 0,
          diagnosis: [
            '',
            'Speeds cannot be added like that: an average speed is still a distance in each '
            + 'hour. Every bar you made worked it out from the hours — the whole distance shared '
            + 'over the whole time.',
          ],
          misconception: ['', 'averaged_the_rates'],
        },
        {
          options: ['slower', 'faster'],
          correct: 0,
          diagnosis: [
            '',
            'Check a bar: the slow half is always the longer piece, so more of the trip’s time is '
            + 'spent going slowly — and the average is pulled towards that speed.',
          ],
          misconception: ['', 'averaged_the_rates'],
        },
      ],
      because: 'The trip spends longer at the slower speed — twice as long when the speed '
        + 'halves — so the slow half counts for more. Adding the two speeds and halving only '
        + 'works when you spend the same TIME at each, not the same distance: come back at the '
        + 'same speed and it does.',
      algebraLead: 'In symbols, for D km each way at a and then b km/h:',
      algebra: 'average = {2D/(D ÷ a + D ÷ b)}',
    },
    naming: {
      label: 'Worth knowing',
      term: 'equal times, not equal distances',
      means: 'Halving the sum of two speeds gives the average speed only when the same TIME is '
        + 'spent at each. Drive an hour at 60 and an hour at 30, and the average is 45. Drive '
        + 'the same distance at each, and it is not.',
      elsewhere: 'It is why a traffic jam ruins an average speed: the minutes spent crawling '
        + 'count for far more than the motorway miles either side.',
      onThePaper: 'A car travels 60 km at 60 km/h, then 60 km at 30 km/h. Work out its average '
        + 'speed for the whole journey.',
    },
    check: [
      {
        questionId: Q_ROUND_TRIP,
        because: 'This section exactly: the same distance each way at two speeds, and the '
          + 'average for the whole trip. Its first trap is the average of the two speeds, which '
          + 'is the answer this section exists to talk students out of.',
      },
    ],
  }
}

export const compoundUnitsInvestigation: Investigation = {
  skillId: 'compound_units',
  title: 'Speed, Distance and Time',
  outcomes: {
    lead: 'Speed, density, a price per kilogram: each is one quantity per another, and the '
      + 'word "per" does all the work. These are compound units, and the one everybody meets '
      + 'first is speed — the distance you go in each hour.',
    // One measurable verb each (lib/skills/bloom.ts): apply, apply, apply,
    // understand. The last is the rule section 4 has the student put into
    // words.
    points: [
      'calculate a speed from a distance and a time',
      'rearrange the speed formula to find a distance or a time',
      'convert a time in minutes into hours, as a fraction of an hour',
      'explain why the average speed of a round trip is not the average of its two speeds',
    ],
  },
  underConstruction: 'This one is new and still being worked on. The maths is right, but the '
    + 'wording and the questions at the end of each section may still change.',
  parameters: {
    // One authored scenario per section, by index, so every number divides
    // exactly and the space stays small enough for the tests to walk.
    values: {
      s1: [0, 1, 2, 3],
      s2: [0, 1, 2],
      s3: [0, 1, 2, 3],
      s4: [0, 1, 2, 3],
    },
  },
  build: p => [stageEachHour(p), stageFromSpeed(p), stageMinutes(p), stageThereAndBack(p)],
  /**
   * The handover: density turned round into a mass (d3), and a speed read off a
   * distance–time graph (d4). Both wrap the skill in something else, which is
   * how it turns up once a paper stops asking for it directly.
   */
  transferQuestionIds: [
    '127a4998-4aa0-41e9-8a60-3f365936ab67', // mass from density, cuboid (d3)
    '558967df-a83f-4820-b124-bae1f5fc5770', // speed from a distance-time graph (d4)
  ],
}
