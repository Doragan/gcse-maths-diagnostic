import type { Investigation, Params, Stage } from './types'
import {
  straightLineGrid, pointsGrid, lineEquation, fmt,
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
      right: `Steeper. For every 1 you go across, y climbs ${m2} instead of 1.`,
      wrong: `It is steeper: for every 1 across, y climbs ${m2} instead of 1. Draw a few values `
        + 'of m and watch the slope.',
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
      row: v => [
        lineEquation(v, 0),
        fmt(v),
        v > 0 ? 'up to the right' : v < 0 ? 'down to the right' : 'flat',
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
    observe: { headers: ['your equation', 'across 1, y changes by', 'direction'] },
    conclude: {
      sentence: [
        'In y = mx + c, m tells you ',
        ', and a negative m makes the line slope ',
        ' as you go right.',
      ],
      slots: [
        {
          options: ['how much y changes for every 1 across', 'where the line crosses the y-axis'],
          correct: 0,
          diagnosis: [
            '',
            'Every line you drew crosses at the same place — (0, 0) — because c stayed '
            + 'at 0 the whole time. Only the slope changed.',
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
      because: 'm is a rate: y changes by m for every 1 that x does. A bigger m is a steeper '
        + 'climb, a fraction is a gentler one, and a negative m means y falls as x rises.',
    },
    naming: {
      term: 'the gradient',
      means: 'the value of m — how much y changes for every 1 across. Not how high the line '
        + 'is, but how fast it climbs.',
      elsewhere: 'A road sign warning of a steep hill gives its gradient: 1 in 5, or 20%, '
        + 'meaning you rise 1 metre for every 5 you drive forward — the same rise over run '
        + 'you have just been measuring. The word is Latin gradus, a step, which is also grade, '
        + 'gradual and degree. How much you go up per step forward.',
      onThePaper: 'Write down the gradient of the line. / Find the gradient of the line joining '
        + 'A and B.',
    },
    check: [
      {
        questionId: Q_GRADIENT,
        because: 'Asks for the gradient by name, using the word naming has just introduced.',
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
      // Stage 3's line, read off the graph.
      m3: [2, 3, -2, -3],
      c3: [-4, -3, -2, 2, 3, 4],
    },
    // m3 = c3 makes the "swapped m and c" distractor render as the SAME
    // equation as the right answer, which hands full marks to a student
    // reading the line backwards. 4 of the 24 combinations do it.
    valid: p => p.m3 !== p.c3,
  },
  build: p => [stageOne(p), stageTwo(p), stageThree(p)],
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
    '4287173a-9ec0-4d43-b9db-43da2230e5b3',  // gradient from two points (d3)
    'f6ac7079-92b4-4912-a1e7-66d3e6bbf871',  // rearrange to find the gradient (d4)
  ],
}
