import type { Investigation, Params, Stage } from './types'
import {
  straightLineGrid, pointsGrid, riseRunGrid, lineEquation, fmt,
} from '../../lib/skills/investigationFigures'

// ─────────────────────────────────────────────────────────────────────────────
// What m and c do — the pilot investigation (docs/audit/31 §7).
//
// Teaches understanding_straight_line_graphs. Plotting is assumed, not taught:
// it is the prerequisite, and a student who cannot plot a point cannot make
// the prediction stage 1 opens with.
//
// The shape is the classroom lesson this came from — hold m, vary c and ask
// what c means; then hold c, vary m and ask the same — with one addition that
// only the digital version can enforce: the student commits to a prediction
// before anything moves, so the figure can contradict them.
// ─────────────────────────────────────────────────────────────────────────────

// Axes are kept SQUARE, and the c domain is trimmed to fit rather than the
// axes stretched to hold it. A grid renders at the column's full width with
// its height following the cell ratio, so 12 across by 16 up came out half a
// screen tall on desktop and worse on a phone. Nothing is taught by the extra
// rows: c from −5 to 5 shows everything c does.
const X = { min: -6, max: 6, step: 1, label: 'x' }
const Y1 = { min: -6, max: 6, step: 1, label: 'y' }
const Y2 = { min: -6, max: 6, step: 1, label: 'y' }
// Stage 3 shares the same square axes: a wider x makes the crossing point
// easier to find, and the steep draws simply leave through the top.
const X3 = { min: -6, max: 6, step: 1, label: 'x' }
/**
 * The measuring stage's axes, sized to the biggest triangle it can draw.
 *
 * Fixed axes do not work here: the triangle runs from the origin, so its top
 * corner sits at m x RUN_MAX, and the legs are drawn rather than clipped — a
 * grid too short simply has the measurement running off the top of it. The
 * height follows the steepest draw, and the width then follows the height,
 * because a grid much taller than it is wide fills a phone screen.
 */
const RUN_MAX = 3
function measureAxes(m: number) {
  const top = m * RUN_MAX + 1
  const y = { min: -2, max: top, step: 1, label: 'y' }
  // Keep the cell ratio under the 1.35 the figure tests hold everything to.
  const across = Math.ceil((top + 2) / 1.3)
  return { x: { min: -2, max: across - 2, step: 1, label: 'x' }, y }
}

// ─── Section checks ──────────────────────────────────────────────────────────
//
// Published questions from the bank, chosen per section. One skill covers
// gradient AND intercept AND reading an equation off a graph, so `because`
// records which half each question is actually about — that is the note that
// stops someone swapping in a plausible-looking question that tests the wrong
// thing.
//
// Not authored here on purpose: a bank question brings its drawn parameters,
// the verification harness, and its authored traps, which say why a specific
// wrong answer is wrong rather than just restating the right one.

/** "What is the y-intercept of the line y = ax + b?" (d2, numeric) */
const Q_Y_INTERCEPT = '507b069f-6a05-4eff-9259-0de1acee1f20'
/** "What is the gradient of the line y = ax + b?" (d2, numeric) */
const Q_GRADIENT = 'd2f9449a-d88e-407d-b4a9-05eda7e954d3'
/** "The line y = ax + b passes through ({{c}}, y). Find y." (d1, numeric) */
const Q_POINT_ON_LINE = 'ccc88b02-19fb-48cd-8e78-382bf3258c8b'
/** Gradient from two given points, no diagram (d3, expression, multi-part) */
const Q_GRADIENT_FROM_POINTS = '4287173a-9ec0-4d43-b9db-43da2230e5b3'
/** Find the equation of the line parallel to L through a point (d3, expression) */
const Q_PARALLEL = '2279ed0d-53c9-4b2e-955c-58f170214459'

function stageOne(p: Params): Stage {
  const c1 = p.c1
  return {
    ask: `This is y = x. Before you change anything — where will ${lineEquation(1, c1)} `
      + 'cross the y-axis?',
    axes: { x: X, y: Y1 },
    predict: {
      prompt: 'Tap the point where you think it crosses. Tap it again to take it back.',
      on: {
        kind: 'grid',
        grid: pointsGrid({ x: X, y: Y1, ghosts: [[1, 0]], expect: [{ x: 0, y: c1 }] }),
        expect: [{ x: 0, y: c1 }],
      },
      // The same axes with the line they were predicting actually drawn on
      // them, so the answer is something they SEE rather than are told.
      reveal: {
        // The crossing point is LABELLED, not just coloured. The canvas draws
        // the right answer in green at 55% opacity and the student's own point
        // in blue, which asks them to tell two colours apart — no good to a
        // colourblind student, and not much better for anyone on a phone in
        // daylight. The label says which point is which in words.
        ...pointsGrid({
          x: X,
          y: Y1,
          ghosts: [[1, 0], [1, c1]],
          expect: [{ x: 0, y: c1 }],
        }),
        labels: [{ x: 0, y: c1, text: `crosses at (0, ${fmt(c1)})`, dx: 62, dy: -8 }],
      },
      right: `(0, ${c1}) is where it crosses — the + ${c1} lifted every point on the `
        + `line up by ${c1}.`,
      wrong: `It crosses at (0, ${c1}) — the labelled point on the graph. Now draw some `
        + 'lines of your own and watch what c does.',
    },
    control: {
      name: 'c',
      prompt: 'Your turn. Type a value for c, draw it, and keep going. Every line you draw '
        + 'stays on the axes.',
      hint: 'Whole numbers from −5 to 5.',
      domain: { min: -5, max: 5, step: 1 },
      suggest: [-2, 5],
      render: (drawn, current) => straightLineGrid({
        x: X,
        y: Y1,
        ghosts: drawn.filter((_, i) => i !== current).map(v => [1, v] as const),
        live: drawn.length ? [1, drawn[current]] : null,
      }),
      label: v => lineEquation(1, v),
      row: v => [lineEquation(1, v), `(0, ${fmt(v)})`],
      coverage: drawn => {
        if (drawn.length < 2) return 'Draw at least two different lines before you state the rule.'
        if (!drawn.some(v => v > 0)) return 'Try a positive value of c as well.'
        if (!drawn.some(v => v < 0)) {
          return 'Try a negative value of c too — you have not seen one of those yet.'
        }
        return null
      },
    },
    observe: { headers: ['your equation', 'crosses the y-axis at'] },
    conclude: {
      sentence: ['In y = x + c, the number c tells you ', ', and making c bigger moves the line ', '.'],
      slots: [
        {
          options: ['where the line crosses the y-axis', 'how steep the line is'],
          correct: 0,
          diagnosis: [
            '',
            'That is what m does, and you have not changed m once. Look at your table: every '
            + 'line you drew is equally steep — only the crossing point moved.',
          ],
          misconception: ['', 'confused_gradient_with_intercept'],
        },
        {
          // NOT up-versus-right. For a straight line, up by k is the same line
          // as left by k over m, so "right" would be wrong only in its
          // direction and a student reasoning about horizontal shifts would be
          // marked wrong for being correct. See docs/audit/31 §4.
          options: ['up', 'down'],
          correct: 0,
          diagnosis: [
            '',
            'Read your table the other way round: the bigger the c, the higher up the axis '
            + 'it crosses.',
          ],
          misconception: ['', 'sign_error'],
        },
      ],
      because: 'At x = 0 every term with an x in it disappears, so whatever c is, that is the '
        + 'height where the line meets the y-axis. Change c and the line moves vertically; its '
        + 'steepness is untouched.',
      algebra: 'y = mx + c → at x = 0: y = m × 0 + c = c',
    },
    naming: {
      term: 'the y-intercept',
      means: 'The y-intercept is where the line plotted crosses the y-axis (this is where '
        + 'x = 0). In the equation y = mx + c, the y coordinate for this is given by the '
        + 'letter c.',
      elsewhere: 'To intercept is to cut across something’s path and meet it: you '
        + 'intercept a pass, a message, a runner. The line is travelling, the y-axis is in its '
        + 'way, and the y-intercept is where they meet. From Latin inter, between, and capere, '
        + 'to seize.',
      onThePaper: 'Write down the coordinates of the point where the line crosses the y-axis.',
    },
    check: [
      {
        questionId: Q_Y_INTERCEPT,
        because: 'Asks for the intercept by name, straight after the section that built it.',
      },
      {
        questionId: Q_POINT_ON_LINE,
        challenge: true,
        because: 'Substitution into the same equation — the rule applied somewhere other '
          + 'than the y-axis, which is where it is easy to think c only matters at x = 0. '
          + 'Harder than the section needs, so it is flagged as a challenge.',
      },
    ],
  }
}

// Section 2 asks WHICH WAY and HOW STEEP, and section 3 asks HOW MUCH.
//
// They used to be one section, which quantified m — "y changes by m for every
// 1 across" — before the student had met the idea that m controls the slope at
// all. A student who has never seen a gradient was being handed the formula
// for one. The split lets the first answer settle before the second is asked.
function stageTwo(p: Params): Stage {
  const m2 = p.m2
  return {
    ask: 'Now c stays at 0, so every line goes through the origin. What changes when the '
      + 'number in front of x changes?',
    axes: { x: X, y: Y2 },
    predict: {
      prompt: `Commit first: compared with y = x, the line ${lineEquation(m2, 0)} will be…`,
      on: {
        kind: 'choice',
        options: ['steeper', 'less steep', 'the same steepness, but shifted up'],
        correct: 0,
      },
      right: 'Steeper. Draw a few of your own and watch which way they lean.',
      wrong: 'It is steeper. Draw a few values of m and watch which way they lean.',
    },
    control: {
      name: 'm',
      prompt: 'Type a value for m and draw it. Halves are allowed, and so are negatives.',
      hint: 'Anything from −4 to 4, in steps of a half.',
      domain: { min: -4, max: 4, step: 0.5 },
      suggest: [2, 0.5, -1],
      render: (drawn, current) => straightLineGrid({
        x: X,
        y: Y2,
        ghosts: drawn.filter((_, i) => i !== current).map(v => [v, 0] as const),
        live: drawn.length ? [drawn[current], 0] : null,
      }),
      label: v => lineEquation(v, 0),
      // No number for the steepness yet: this section is about WHICH WAY and
      // HOW STEEP, and putting the rate in the table here would answer
      // section 3 before it has been asked.
      row: v => [
        lineEquation(v, 0),
        v > 0 ? 'up to the right' : v < 0 ? 'down to the right' : 'flat',
        Math.abs(v) > 1 ? 'steeper than y = x' : Math.abs(v) === 1 ? 'same as y = x' : 'gentler than y = x',
      ],
      coverage: drawn => {
        if (drawn.length < 2) return 'Draw at least two different lines before you state the rule.'
        if (!drawn.some(v => v > 0)) return 'Try a positive value of m as well.'
        if (!drawn.some(v => v < 0)) {
          return 'Try a negative value of m too — that is where the interesting bit is.'
        }
        return null
      },
    },
    observe: { headers: ['your equation', 'which way it slopes', 'compared with y = x'] },
    conclude: {
      sentence: [
        'In y = mx, making m bigger makes the line ',
        ', and a negative m makes it slope ',
        ' as you go right.',
      ],
      slots: [
        {
          options: ['steeper', 'higher up the y-axis'],
          correct: 0,
          diagnosis: [
            '',
            'Every line you drew goes through the same point — (0, 0) — because c stayed at 0 '
            + 'the whole time. They lean differently; none of them sits higher.',
          ],
          misconception: ['', 'confused_gradient_with_intercept'],
        },
        {
          options: ['down', 'up'],
          correct: 0,
          diagnosis: ['', 'Look at your negative value again: as x goes right, y falls.'],
          misconception: ['', ''],
        },
      ],
      because: 'm controls the slope and nothing else. Its size is how steep the line is, and '
        + 'its sign is which way the line leans: positive climbs to the right, negative falls.',
    },
    naming: {
      term: 'the gradient',
      means: 'The gradient is the name for how steep a line is and which way it leans. It is '
        + 'the value of m. The next section works out how to put a number on it.',
      elsewhere: 'A road sign warning of a steep hill gives its gradient: 1 in 5, or 20%. The '
        + 'word is Latin gradus, a step, which is also grade, gradual and degree — how much you '
        + 'go up per step forward.',
      onThePaper: 'Describe the gradient of the line. / Which of these lines has the steepest '
        + 'gradient?',
    },
    check: [
      {
        questionId: Q_GRADIENT,
        because: 'Asks for the gradient by name, using the word naming has just introduced. '
          + 'Reading m off the equation needs only this section, not the measuring in the next.',
      },
    ],
  }
}

/**
 * Measuring the gradient: how far up for how far across.
 *
 * The control is the RUN rather than the line. The line stays put and the
 * student stretches the triangle along it — which is the argument that the
 * gradient belongs to the line and not to the triangle drawn on it, and it is
 * not an argument that can be made by varying the line.
 */
function stageMeasure(p: Params): Stage {
  const m = p.mMeasure
  const line = lineEquation(m, 0)

  return {
    ask: `This is ${line}. You know it climbs — but by how much? Go across 1 and see how far `
      + 'up you have to go to meet the line again.',
    axes: measureAxes(m),
    figure: riseRunGrid({ ...measureAxes(m), m, c: 0, from: 0, run: 1 }),
    predict: {
      prompt: 'Across 1, the line rises by…',
      on: {
        kind: 'choice',
        options: [fmt(m), fmt(m + 1), fmt(1)],
        correct: 0,
      },
      right: `Across 1, up ${fmt(m)} — which is exactly the number in front of x.`,
      wrong: `Across 1 it goes up ${fmt(m)}. Count the squares up the dashed side of the `
        + 'triangle.',
    },
    control: {
      name: 'across',
      prompt: 'Now stretch the triangle. Choose how far across to go, and read off how far up '
        + 'the line has climbed by then.',
      hint: `Whole numbers from 1 to ${RUN_MAX}.`,
      domain: { min: 1, max: RUN_MAX, step: 1 },
      suggest: [2, 3],
      render: (drawn, current) => riseRunGrid({
        ...measureAxes(m),
        m,
        c: 0,
        from: 0,
        run: drawn.length ? drawn[current] : 1,
      }),
      label: v => `across ${v}`,
      row: v => [fmt(v), fmt(m * v), `${fmt(m * v)} ÷ ${fmt(v)} = ${fmt(m)}`],
      coverage: drawn => (drawn.length < 2
        ? 'Try at least two different widths — the point is what stays the same.'
        : null),
    },
    observe: { headers: ['across', 'up', 'up ÷ across'] },
    conclude: {
      sentence: [
        'The gradient is ',
        ', and stretching the triangle wider ',
        ' the answer.',
      ],
      slots: [
        {
          options: ['the up divided by the across', 'the up added to the across'],
          correct: 0,
          diagnosis: [
            '',
            'Check your table: across 2 gave up ' + fmt(m * 2) + ', and ' + fmt(m * 2) + ' + 2 is '
            + 'not ' + fmt(m) + '. It is a division — how much up for each one across.',
          ],
          misconception: ['', 'added_instead_of_operating'],
        },
        {
          options: ['does not change', 'doubles'],
          correct: 0,
          diagnosis: [
            '',
            'Every row of your table came to the same answer. The triangle got bigger, but so '
            + 'did both of its sides, so the division did not move.',
          ],
          misconception: ['', ''],
        },
      ],
      because: 'The gradient is a rate: how far up for each one across. A wider triangle has a '
        + 'taller rise in exactly the same proportion, so the division always comes back to the '
        + 'same number — which is why the gradient belongs to the line rather than to the '
        + 'triangle you drew on it.',
      algebra: 'gradient = up ÷ across = rise ÷ run\u2003→\u2003for y = ' + fmt(m)
        + 'x:\u2003' + fmt(m * 2) + ' ÷ 2 = ' + fmt(m),
    },
    naming: {
      term: 'rise over run',
      means: 'The rise is how far up, the run is how far across, and the gradient is the rise '
        + 'divided by the run. Measured between any two points on the line, it gives the same '
        + 'answer every time.',
      elsewhere: 'It is how a road sign states a hill: 1 in 5 means a rise of 1 for a run of 5. '
        + 'Wheelchair ramps are specified the same way, usually 1 in 12 or gentler.',
      onThePaper: 'Work out the gradient of the line joining A and B. / Find the gradient of the '
        + 'line shown.',
    },
    check: [
      {
        questionId: Q_GRADIENT_FROM_POINTS,
        challenge: true,
        because: 'Rise over run between two given points, with no triangle drawn. The method '
          + 'this section builds, applied without the scaffolding.',
      },
    ],
  }
}

function stageThree(p: Params): Stage {
  const { m3, c3 } = p
  // The distractors: m and c swapped, the sign of m flipped, the sign of c
  // flipped. The parameter constraint keeps all four distinct — see below.
  const options = [
    lineEquation(m3, c3),
    lineEquation(c3, m3),
    lineEquation(-m3, c3),
    lineEquation(m3, -c3),
  ]
  // Rotated by the draw so the answer is not always first, and deterministic so
  // the order cannot change under the student mid-read. The signs are in the
  // hash because magnitudes alone put the answer in the last two slots twice as
  // often as the first two, measured over every legal draw.
  const shift = (Math.abs(m3) + Math.abs(c3) + (m3 < 0 ? 1 : 0) + (c3 < 0 ? 2 : 0)) % 4
  const ordered = [...options.slice(shift), ...options.slice(0, shift)]

  return {
    ask: 'Here is a line you have not seen before. What is its equation?',
    axes: { x: X3, y: Y2 },
    // Nothing varies here, so the figure is fixed: the line to be read.
    figure: straightLineGrid({ x: X3, y: Y2, ghosts: [], live: [m3, c3] }),
    predict: {
      prompt: 'Read it off the graph — crossing point first, then the slope.',
      on: { kind: 'choice', options: ordered, correct: ordered.indexOf(options[0]) },
      right: `It crosses at (0, ${fmt(c3)}) so c = ${fmt(c3)}, and it `
        + `${m3 > 0 ? 'climbs' : 'falls'} ${Math.abs(m3)} for every 1 across, so m = ${fmt(m3)}.`,
      wrong: `It is ${options[0]}. It crosses at (0, ${fmt(c3)}), which fixes c, and it `
        + `${m3 > 0 ? 'climbs' : 'falls'} ${Math.abs(m3)} for every 1 across, which fixes m.`,
    },
    // No control: there is nothing to vary here, which is the point. The
    // student reads a line rather than building one.
    conclude: {
      // Both slots are the formal words now, introduced in stages 1 and 2.
      // This is the vocabulary check, and it needs no free text: the student
      // has to tell gradient from intercept to answer at all.
      sentence: ['On any straight line, c is the ', ' and m is the ', '.'],
      slots: [
        {
          options: ['y-intercept', 'x-intercept'],
          correct: 0,
          diagnosis: [
            '',
            'The x-intercept is where it crosses the other axis. c is read where x = 0, on the '
            + 'vertical axis.',
          ],
          misconception: ['', 'answered_a_different_quantity'],
        },
        {
          options: ['gradient', 'intercept'],
          correct: 0,
          diagnosis: [
            '',
            'An intercept is a place the line passes through; a gradient is how fast it climbs. '
            + 'm is the second one.',
          ],
          misconception: ['', 'confused_gradient_with_intercept'],
        },
      ],
      because: 'Every straight line is fixed by those two numbers — its y-intercept and its '
        + 'gradient. That is the whole of y = mx + c, and those are the words the exam uses.',
    },
    check: [
      {
        questionId: Q_PARALLEL,
        because: 'Same gradient, different intercept: the clearest test that the two are '
          + 'held apart rather than merged.',
      },
    ],
  }
}

export const understandingStraightLineGraphsInvestigation: Investigation = {
  skillId: 'understanding_straight_line_graphs',
  title: 'Understanding Straight Line Graphs',
  outcomes: 'By the end of this you will be able to look at the equation of a straight line and '
    + 'say where it crosses the y-axis and which way it slopes — and go the other way, from a '
    + 'line drawn on a grid back to its equation.',
  parameters: {
    values: {
      // Stage 1's target: positive and at least 2, so the new line is clear of
      // y = x and the stem reads "+ c" rather than "− c".
      c1: [2, 3, 4, 5],
      // Stage 2's comparison: above 1, or "steeper" is not the answer.
      m2: [2, 3, 4],
      // The line the measuring section stretches a triangle along. Positive
      // and a whole number: a first measurement should not also be a lesson in
      // negative or fractional rates.
      mMeasure: [2, 3, 4],
      // The last section's line, read off the graph.
      m3: [2, 3, -2, -3],
      c3: [-4, -3, -2, 2, 3, 4],
    },
    // m3 = c3 makes the "swapped m and c" distractor render as the SAME
    // equation as the right answer, which hands full marks to a student
    // reading the line backwards. 4 of the 24 combinations do it.
    valid: p => p.m3 !== p.c3,
  },
  build: p => [stageOne(p), stageTwo(p), stageMeasure(p), stageThree(p)],
  /**
   * The handover. These are the only questions here that count towards
   * progress.
   *
   * Both are a step up from the checks, because the bank has nothing gentler
   * left: of the seven published questions on this skill, the only two at d1
   * and d2 are already used as section checks and everything else is d3 or d4.
   * Closing that gap needs new questions authored into the bank.
   */
  transferQuestionIds: [
    'f6ac7079-92b4-4912-a1e7-66d3e6bbf871',  // rearrange to find the gradient (d4)
    'a0b123af-b920-42ac-8383-69cb7cda4759',  // perpendicular through a point (d4)
  ],
}
