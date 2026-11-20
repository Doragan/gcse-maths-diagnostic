import type { Investigation, Params, Stage } from './types'
import type { GridLabel, RenderedAxis, RenderedGrid } from '../../lib/questions/gridDraw'
import { barModelGrid, distanceTimeGrid, fitLabel, journeyScene, labelHalfWidth } from '../../lib/skills/investigationFigures'
import type { BarModel, Clock, Drive, MeasureLeg, Road, Trace } from '../../lib/skills/investigationFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Compound units, through speed — the third investigation.
//
// Chosen by exam marks and by what the bank can check (docs: the targets
// review of 2026-11-17): 279 marks across the corpus, and the most
// single-part questions of any candidate.
//
// Sections 1, 2 and 4 show their journey twice, moving together: a vehicle on a road,
// and the same journey drawing itself on a distance–time graph. Bar models
// came first and were right for percentages, but a bar cannot MOVE, and speed
// is about moving; the graph is also where speed turns up on the paper.
//
// Four sections, each opening from something the student can already do:
//
//   1. Distance in each hour — sharing a journey equally between its hours.
//      That share IS the speed.
//   2. From a speed to a distance — one steepness, driven for longer, a step
//      at a time; and the time found by going back the other way.
//   3. Minutes are a fraction of an hour — a fraction of an amount, not a
//      journey: 20 minutes is a third of the hour, so the ride goes a third of
//      the hour's distance. Never 0.2 of it, the error that costs the most
//      marks on paper.
//   4. There and back — out at 60, back at 30, and the average is 40, not 45.
//      A steady van driving at the average gets home at the same moment.
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
// Sections 1, 2 and 4 draw the journey twice, on one clock: a vehicle on a road,
// and the same journey drawn as it happens on a distance–time graph
// (lib/skills/investigationFigures.ts). The road is the real thing; the graph
// is its record, and watching them move together is what makes "steeper means
// faster" something seen rather than told.
//
// Each section's clock is chosen so its longest journey takes under four
// seconds — long enough to watch, short enough to try again.

/** Hours to seconds, sections 1 and 2: six hours in 3.6 seconds. */
const SEC_PER_HOUR = 0.6
/** Hours to seconds, section 4, whose longest trip is nine hours. */
const SEC_PER_HOUR_TRIP = 0.4

/** The road: plain paper, 0–60 across, with room for a vehicle at either end. */
const AX_ROAD: RenderedAxis = { min: 0, max: 60, step: 6, label: '' }
const AY_TWO_LANES: RenderedAxis = { min: 0, max: 30, step: 6, label: '' }
const AY_ONE_LANE: RenderedAxis = { min: 0, max: 18, step: 6, label: '' }
const ROAD_FROM = 4
const ROAD_TO = 56
/**
 * Bottom to top: the clock, the lane being tried, and the faint lane above it
 * to compare with. The clock is under the road it times, with room between
 * for the words under that road.
 */
const CLOCK = 3
const LANE = 10
const UPPER = 20

/** Where a distance lands on a road drawn for `full` km. */
const along = (km: number, full: number) => ROAD_FROM + ((ROAD_TO - ROAD_FROM) * km) / full
/** Where a time lands on the clock strip, which is the graph's time axis drawn under the road. */
const onClock = (t: number, axis: RenderedAxis) => ROAD_FROM + ((ROAD_TO - ROAD_FROM) * t) / axis.max

/**
 * The clock for a graph's time axis: ruled at the axis's steps, numbered
 * every `every` with the unit on the last number, and run from 0 to `until`
 * at `perUnit` seconds per unit — the graph's own pace, so the dot on the
 * strip and the "now" line on the graph are at the same time throughout.
 *
 * `until` is when the LAST vehicle stops, not the one being tried: time
 * cannot stand still while the faint one is still driving.
 */
function clockFor(axis: RenderedAxis, every: number, unit: string, until: number | undefined, perUnit: number) {
  const ticks = Array.from({ length: Math.round(axis.max / axis.step) + 1 }, (_, k) => onClock(k * axis.step, axis))
  const numbered = Array.from({ length: Math.floor(axis.max / every + 1e-9) + 1 }, (_, k) => k * every)
  const labels: GridLabel[] = numbered.map((t, k) => {
    const text = k === numbered.length - 1 ? `${t} ${unit}` : String(t)
    return { x: fitLabel(onClock(t, axis), text, AX_ROAD), y: CLOCK, text, dy: 15 }
  })
  const run: [number, number][] = until === undefined || until === 0
    ? [[0, ROAD_FROM]]
    : [[0, ROAD_FROM], [until * perUnit, onClock(until, axis)]]
  const now: [number, number][] | undefined = until === undefined || until === 0
    ? undefined
    : [[0, 0], [until * perUnit, until]]
  return { clock: { y: CLOCK, from: ROAD_FROM, to: ROAD_TO, ticks, run } as Clock, labels, now }
}

/** A line of words above a lane, clear of the roof of the vehicle on it. */
const caption = (lane: number, text: string): GridLabel =>
  ({ x: fitLabel(30, text, AX_ROAD), y: lane + 3.5, text, dy: -6 })
/** Words under the road, centred on `x`. */
const under = (x: number, lane: number, text: string): GridLabel =>
  ({ x: fitLabel(x, text, AX_ROAD), y: lane, text, dy: 15 })

/**
 * The try the student was looking at before this one, if it was a different
 * value — NOT the one typed last, which is a different try as soon as they go
 * back to an earlier one (see showTry).
 */
function lastTry(drawn: readonly number[], current: number, before: number | undefined): number | undefined {
  if (before === undefined) return undefined
  const w = drawn[before]
  return w === drawn[current] ? undefined : w
}
/** A stage's axes are its graph's. */
const axesOf = (g: RenderedGrid) => ({ x: g.x, y: g.y })

/** Every other value tried, once each. */
const others = (drawn: readonly number[], current: number) =>
  [...new Set(drawn.filter((w, k) => k !== current && w !== drawn[current]))]

/** Half-hour squares where there is room: a graph twelve squares across sits under the road at its width. */
const hoursAxis = (max: number, step = 0.5): RenderedAxis => ({ min: 0, max, step, label: 'time (hours)' })
const kmAxis = (max: number, label = 'distance (km)'): RenderedAxis =>
  ({ min: 0, max, step: max / 6, label })

/** Section 1's time axis, on the graph and on the clock under the road. */
const SIX_HOURS = hoursAxis(6)

/**
 * Section 1: the car drives the same road in however many hours were tried,
 * dropping a marker at the end of every hour — so the road is cut into equal
 * shares — with the try before it racing alongside, faint, in the lane above,
 * and the clock under the road counting the hours as they go.
 */
function carScene(distance: number, drawn: readonly number[], current: number, before?: number): RenderedGrid {
  const v = drawn[current]
  if (v === undefined) {
    const time = clockFor(SIX_HOURS, 1, 'hours', undefined, SEC_PER_HOUR)
    return journeyScene({
      x: AX_ROAD,
      y: AY_TWO_LANES,
      roads: [{ y: LANE, from: ROAD_FROM, to: ROAD_TO }],
      drives: [{ road: LANE, frames: [[0, ROAD_FROM]] }],
      clock: time.clock,
      labels: [caption(LANE, `${distance} km to go`), ...time.labels],
    })
  }
  const share = distance / v
  const w = lastTry(drawn, current, before)
  const time = clockFor(SIX_HOURS, 1, 'hours', Math.max(v, w ?? 0), SEC_PER_HOUR)
  const roads: Road[] = [{
    y: LANE,
    from: ROAD_FROM,
    to: ROAD_TO,
    marks: Array.from({ length: v - 1 }, (_, k) => ({ x: along((k + 1) * share, distance), appear: (k + 1) * SEC_PER_HOUR })),
  }]
  const drives: Drive[] = [{ road: LANE, frames: [[0, ROAD_FROM], [v * SEC_PER_HOUR, ROAD_TO]] }]
  const labels: GridLabel[] = [
    caption(LANE, `${distance} km in ${hours(v)}: ${share} km each hour`),
    ...Array.from({ length: v }, (_, k) => under(along((k + 0.5) * share, distance), LANE, `${share} km`)),
    ...time.labels,
  ]
  if (w !== undefined) {
    roads.push({
      y: UPPER,
      from: ROAD_FROM,
      to: ROAD_TO,
      faint: Array.from({ length: w - 1 }, (_, k) => along(((k + 1) * distance) / w, distance)),
    })
    drives.push({ road: UPPER, frames: [[0, ROAD_FROM], [w * SEC_PER_HOUR, ROAD_TO]], ghost: true })
    labels.push(caption(UPPER, `last try: ${hours(w)}, ${distance / w} km each hour`))
  }
  return journeyScene({ x: AX_ROAD, y: AY_TWO_LANES, roads, drives, clock: time.clock, labels })
}

/**
 * Section 1's graph: every try a line from the start to the same distance,
 * later for more hours — so flatter. Where the line is after one hour is read
 * off with dashed legs, and that reading is the speed. The last try is drawn
 * again alongside the faint car, and the "now" line sweeps across with the
 * clock under the road.
 */
function carGraph(distance: number, drawn: readonly number[], current: number, before?: number): RenderedGrid {
  const x = SIX_HOURS
  const y = kmAxis(distance)
  const v = drawn[current]
  const w = lastTry(drawn, current, before)
  const traces: Trace[] = others(drawn, current).map(o => (o === w
    ? { points: [[0, 0], [o, distance]], times: [0, o * SEC_PER_HOUR], style: 'ghost' }
    : { points: [[0, 0], [o, distance]], style: 'ghost' }))
  if (v === undefined) return distanceTimeGrid({ x, y, traces })
  const share = distance / v
  const time = clockFor(SIX_HOURS, 1, 'hours', Math.max(v, w ?? 0), SEC_PER_HOUR)
  traces.push({ points: [[0, 0], [v, distance]], times: [0, v * SEC_PER_HOUR], style: 'live' })
  const text = `${share} km after 1 hour`
  return distanceTimeGrid({
    x,
    y,
    traces,
    now: time.now,
    legs: [
      { from: [1, 0], to: [1, share], appear: SEC_PER_HOUR },
      { from: [0, share], to: [1, share], appear: SEC_PER_HOUR },
    ],
    // Right of the reading and under the line, which only climbs from there.
    labels: [{ x: 1, y: share, text, dx: labelHalfWidth(text) + 6, dy: 13 }],
  })
}

/**
 * Section 2: one speed, driven for longer and longer. The road is ruled in
 * hours' worth of distance, and a marker drops at the end of each hour.
 */
function lorryScene(speed: number, v: number | undefined): RenderedGrid {
  const full = 6 * speed
  const time = clockFor(SIX_HOURS, 1, 'hours', v, SEC_PER_HOUR)
  const ruler = Array.from({ length: 7 }, (_, k) =>
    under(along(k * speed, full), LANE, k === 6 ? `${k * speed} km` : String(k * speed)))
  const road: Road = {
    y: LANE,
    from: ROAD_FROM,
    to: ROAD_TO,
    faint: Array.from({ length: 5 }, (_, k) => along((k + 1) * speed, full)),
  }
  if (v === undefined) {
    return journeyScene({
      x: AX_ROAD,
      y: AY_ONE_LANE,
      roads: [road],
      drives: [{ road: LANE, frames: [[0, ROAD_FROM]] }],
      clock: time.clock,
      labels: [caption(LANE, `${speed} km/h`), ...ruler, ...time.labels],
    })
  }
  return journeyScene({
    x: AX_ROAD,
    y: AY_ONE_LANE,
    roads: [{
      ...road,
      marks: Array.from({ length: v }, (_, k) => ({ x: along((k + 1) * speed, full), appear: (k + 1) * SEC_PER_HOUR })),
    }],
    drives: [{ road: LANE, frames: [[0, ROAD_FROM], [v * SEC_PER_HOUR, along(v * speed, full)]] }],
    clock: time.clock,
    labels: [caption(LANE, `${hours(v)} at ${speed} km/h: ${v} × ${speed} = ${v * speed} km`), ...ruler, ...time.labels],
  })
}

/** Section 2's graph: one steepness, drawn a step at a time — each hour adds the same climb. */
function lorryGraph(speed: number, drawn: readonly number[], current: number): RenderedGrid {
  const x = SIX_HOURS
  const y = kmAxis(6 * speed)
  const v = drawn[current]
  const traces: Trace[] = others(drawn, current).map(w => ({ points: [[0, 0], [w, w * speed]], style: 'ghost' }))
  if (v === undefined) return distanceTimeGrid({ x, y, traces })
  traces.push({ points: [[0, 0], [v, v * speed]], times: [0, v * SEC_PER_HOUR], style: 'live' })
  const legs: MeasureLeg[] = []
  for (let k = 0; k < v; k++) {
    const at = (k + 1) * SEC_PER_HOUR
    legs.push({ from: [k, k * speed], to: [k + 1, k * speed], appear: at })
    legs.push({ from: [k + 1, k * speed], to: [k + 1, (k + 1) * speed], appear: at })
  }
  const text = `+${speed} km each hour`
  return distanceTimeGrid({
    x,
    y,
    traces,
    legs,
    now: clockFor(x, 1, 'hours', v, SEC_PER_HOUR).now,
    // Beside the first hour's climb, below the line, which is already higher there.
    labels: [{ x: 1, y: speed / 2, text, dx: labelHalfWidth(text) + 6, dy: 4 }],
  })
}

/**
 * Section 3 is a fraction of an amount, not a journey: the minutes are a
 * fraction of the hour, and the distance is the same fraction of the hour's
 * distance. So no road and no graph — two bars the same length, one the
 * hour's 60 minutes and one the hour's kilometres, cut into the same equal
 * parts, with the same parts shaded. It is the bar model students already
 * use for "find 2/3 of 24": divide into the parts, then take the ones you need.
 *
 * The parts are the fraction in its LOWEST terms — 20 minutes cuts the hour
 * into thirds, not sixtieths — so the picture is the sum a student would do.
 */
const AY_BARS: RenderedAxis = { min: 0, max: 24, step: 6, label: '' }
const HOUR_BAR = 14
const KM_BAR = 2
const BAR_HEIGHT = 6
/** Seconds: the hour's share shades in first, then the same share of the distance. */
const SHADE_HOUR = [0.2, 1.2] as const
const SHADE_KM = [1.6, 2.6] as const

function hourBars(speed: number, m: number | undefined): RenderedGrid {
  const parts = m === undefined ? 12 : 60 / gcd(m, 60)
  const each = 60 / parts
  const cuts = Array.from({ length: parts - 1 }, (_, k) => (k + 1) * each)
  const bar = (y: number, [start, end]: readonly [number, number]): BarModel => ({
    y,
    height: BAR_HEIGHT,
    dividers: cuts,
    pieces: m === undefined
      ? [{ from: 0, to: 60, fill: 'empty' }]
      : [{ from: 0, to: 60, fill: 'empty' }, { from: 0, to: m, fill: 'shaded', grow: { from: 0, start, end } }],
  })
  /** Each part's share, written inside it: what one part of the hour, or of the distance, is. */
  const inside = (y: number, value: string): GridLabel[] =>
    Array.from({ length: parts }, (_, k) => ({ x: (k + 0.5) * each, y: y + BAR_HEIGHT / 2, text: value, dy: 4 }))
  const above = (y: number, text: string): GridLabel => ({ x: fitLabel(30, text, AX_ROAD), y: y + BAR_HEIGHT, text, dy: -6 })

  if (m === undefined) {
    return barModelGrid({
      x: AX_ROAD,
      y: AY_BARS,
      bars: [bar(HOUR_BAR, SHADE_HOUR), bar(KM_BAR, SHADE_KM)],
      labels: [above(HOUR_BAR, '1 hour = 60 minutes'), above(KM_BAR, `in 1 hour: ${speed} km`)],
    })
  }
  const frac = fracText(m, 60)
  const d = (speed * m) / 60
  const whole = m === 60
  const result = whole ? `the whole ${speed} km` : `${frac} of ${speed} km = ${one(d)} km`
  return barModelGrid({
    x: AX_ROAD,
    y: AY_BARS,
    bars: [bar(HOUR_BAR, SHADE_HOUR), bar(KM_BAR, SHADE_KM)],
    labels: [
      above(HOUR_BAR, whole ? '60 minutes: the whole hour' : `${m} minutes = ${frac} of the hour`),
      ...inside(HOUR_BAR, String(each)),
      above(KM_BAR, `in 1 hour: ${speed} km`),
      ...inside(KM_BAR, one(speed / parts)),
      { x: fitLabel(30, result, AX_ROAD), y: KM_BAR, text: result, dy: 15 },
    ],
  })
}

/** Section 4's time axis: long enough for the slowest way home. */
const tripHours = (each: number, out: number) => hoursAxis(each / out + each / 20, 1)

function tripScene(each: number, out: number, back: number | undefined): RenderedGrid {
  const t1 = each / out
  const time = clockFor(tripHours(each, out), 1, 'hours', back === undefined ? t1 : t1 + each / back, SEC_PER_HOUR_TRIP)
  const ends = [under(ROAD_FROM, LANE, 'home'), under(ROAD_TO, LANE, `town, ${each} km`)]
  const road: Road = { y: LANE, from: ROAD_FROM, to: ROAD_TO }
  if (back === undefined) {
    return journeyScene({
      x: AX_ROAD,
      y: AY_TWO_LANES,
      roads: [road],
      drives: [{ road: LANE, frames: [[0, ROAD_FROM], [t1 * SEC_PER_HOUR_TRIP, ROAD_TO]] }],
      clock: time.clock,
      labels: [caption(LANE, `out at ${out} km/h`), ...ends, ...time.labels],
    })
  }
  const total = t1 + each / back
  const avg = (2 * each) / total
  const s = SEC_PER_HOUR_TRIP
  return journeyScene({
    x: AX_ROAD,
    y: AY_TWO_LANES,
    roads: [road, { y: UPPER, from: ROAD_FROM, to: ROAD_TO }],
    drives: [
      { road: LANE, frames: [[0, ROAD_FROM], [t1 * s, ROAD_TO], [total * s, ROAD_FROM]] },
      { road: UPPER, frames: [[0, ROAD_FROM], [(total / 2) * s, ROAD_TO], [total * s, ROAD_FROM]], ghost: true },
    ],
    labels: [
      caption(LANE, `out at ${out} km/h, back at ${back} km/h`),
      caption(UPPER, `steady ${one(avg)} km/h (the dashed line)`),
      ...ends,
      ...time.labels,
    ],
    clock: time.clock,
  })
}

/**
 * Section 4's graph counts the distance DRIVEN, so it keeps climbing on the
 * way home: steep out, flatter back. The dashed line goes straight from the
 * start to the finish — the steady van — and its steepness is the average.
 */
function tripGraph(each: number, out: number, drawn: readonly number[], current: number): RenderedGrid {
  const t1 = each / out
  const x = tripHours(each, out)
  const y = kmAxis(2 * each, 'distance driven (km)')
  const s = SEC_PER_HOUR_TRIP
  const back = drawn[current]
  const traces: Trace[] = others(drawn, current)
    .map(w => ({ points: [[0, 0], [t1, each], [t1 + each / w, 2 * each]], style: 'ghost' }))
  if (back === undefined) {
    traces.push({ points: [[0, 0], [t1, each]], times: [0, t1 * s], style: 'live' })
    return distanceTimeGrid({ x, y, traces, now: clockFor(x, 1, 'hours', t1, s).now })
  }
  const total = t1 + each / back
  // Through the half-way point too, where the steady van turns at the town:
  // the line is straight either way, but the two clocks then share every key.
  traces.push({
    points: [[0, 0], [total / 2, each], [total, 2 * each]],
    times: [0, (total / 2) * s, total * s],
    style: 'dashed',
  })
  traces.push({ points: [[0, 0], [t1, each], [total, 2 * each]], times: [0, t1 * s, total * s], style: 'live' })
  return distanceTimeGrid({ x, y, traces, now: clockFor(x, 1, 'hours', total, s).now })
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
    ask: `A car travels ${distance} km in ${t} hours, at a steady speed the whole way. `
      + 'How far does it go in each hour?',
    axes: axesOf(carGraph(distance, [], 0)),
    predict: {
      prompt: 'In each hour, the car goes…',
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
        `${distance} ÷ ${t} = ${share}, so the car goes ${share} km in each hour.`,
      ],
    },
    control: {
      name: 'hours',
      verb: 'try',
      scene: (drawn, current, before) => carScene(distance, drawn, current, before),
      render: (drawn, current, before) => carGraph(distance, drawn, current, before),
      prompt: `Looking at that ${distance} km journey, what happens to the speed of the car if `
        + 'it takes different amounts of time? Try different values for the hours the journey '
        + 'takes and watch the speed of the car, and how steep its line on the graph is.',
      hint: 'Any whole number of hours from 1 to 6.',
      domain: { min: 1, max: 6, step: 1 },
      suggest: [2, 6],
      label: v => `${distance} km in ${hours(v)}`,
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second number of hours — one journey cannot show you what the hours do.'
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
    axes: axesOf(lorryGraph(speed, [], 0)),
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
      scene: (drawn, current) => lorryScene(speed, drawn[current]),
      render: (drawn, current) => lorryGraph(speed, drawn, current),
      prompt: `Keep the speed at ${speed} km/h and change how long the lorry drives. Every hour `
        + 'adds the same distance to the road, and the same climb to the graph.',
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
      means: 'Many people remember it as a triangle: D for distance on top, S for speed and T '
        + 'for time underneath. Cover the one you want, and the other two tell you what to do — '
        + 'side by side, multiply them; one over the other, divide.',
      triangle: { top: 'D', left: 'S', right: 'T' },
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

// ─── Stage 3: minutes are a fraction of an hour ──────────────────────────────
//
// The error that costs the most marks: 20 minutes keyed in as 0.2 hours. It
// is a units mistake hiding as a decimals one, and it is not about motion at
// all — it is a fraction of an amount. So this section drops the road and the
// graph for the bar model students already use for "find 1/3 of 24": the
// hour's 60 minutes and the hour's kilometres, cut into the same parts.

/** [speed, minutes]: speeds are multiples of 12, so every 5 minutes is a whole km. */
const S3 = [[24, 20], [36, 40], [48, 15], [60, 45]] as const

function stageMinutes(p: Params): Stage {
  const [speed, m] = S3[p.s3]
  const d = (speed * m) / 60
  return {
    title: 'Minutes as a fraction of an hour',
    ask: `Journeys are often given in minutes, not hours. A cyclist rides at ${speed} km/h for `
      + `${m} minutes. How far do they go?`,
    axes: axesOf(hourBars(speed, undefined)),
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
      render: (drawn, current) => hourBars(speed, drawn[current]),
      prompt: `Keep the speed at ${speed} km/h and change how many minutes the ride lasts. Watch `
        + `what fraction of the hour the minutes are, and the same fraction of the hour’s ${speed} km.`,
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
      because: 'Minutes are a fraction of an hour, out of 60: 20 minutes is {20/60} = {1/3} of '
        + 'an hour, so a 20-minute ride goes {1/3} of an hour’s distance. They do not count in '
        + 'tenths, so they are not the hour’s decimal part: 30 minutes is 0.5, 45 minutes is '
        + '0.75, 20 minutes is 0.333… — never 0.2.',
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
    axes: axesOf(tripGraph(EACH, out, [], 0)),
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
      scene: (drawn, current) => tripScene(EACH, out, drawn[current]),
      render: (drawn, current) => tripGraph(EACH, out, drawn, current),
      prompt: `Keep the trip out at ${out} km/h and change the speed on the way back. The faint `
        + 'van drives the whole trip at the average speed.',
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
            + 'hour. The steady van gets home with yours because it covers the whole distance in '
            + 'the whole time — that is what makes its speed the average.',
          ],
          misconception: ['', 'averaged_the_rates'],
        },
        {
          options: ['slower', 'faster'],
          correct: 0,
          diagnosis: [
            '',
            'On the graph, the slow half is the flatter, LONGER part of the line, so more of '
            + 'the trip’s time is spent going slowly — and the average is pulled towards that speed.',
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
