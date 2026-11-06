import type { Check, Investigation, Params, Stage } from './types'
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
// Two per stage, applying the rule rather than restating it, and each in
// several variants so "try another" is a different question rather than a
// second go at the same one.
//
// The read-it-off-the-diagram ones are the reason `numeric` exists: "what is
// the value of c here" has one right answer, a box is how a student would
// write it, and no list of options can be offered without giving it away.

/** Values used by the read-off checks, kept inside the square axes. */
const C_VALUES = [4, -3, 5, -2] as const
const M_VALUES = [2, -2, 3, -3] as const

function stageOneChecks(): Check[] {
  return [
    {
      // Applying the rule to a line they have not drawn — no diagram, because
      // the point is that they no longer need one.
      variants: C_VALUES.length,
      build: v => {
        const c = C_VALUES[v] * 2        // beyond the axes on purpose: the
        return {                          // rule does not stop at the picture
          ask: `Without drawing it: where does ${lineEquation(1, c)} cross the y-axis? `
            + 'Give the y-value.',
          answer: { kind: 'numeric', value: String(c), prefix: '(0,' },
          right: `Yes — ${fmt(c)}. You did not need the graph, because c IS the crossing point.`,
          wrong: `It crosses at ${fmt(c)}. In y = x + c the number on the end is the height `
            + 'where it meets the y-axis, whatever the rest of the equation does.',
        }
      },
    },
    {
      // Read it off the diagram. Same question a paper asks.
      variants: C_VALUES.length,
      build: v => {
        const c = C_VALUES[v]
        return {
          ask: 'What is the value of c for the line drawn here?',
          figure: straightLineGrid({ x: X, y: Y1, ghosts: [], live: [1, c] }),
          answer: { kind: 'numeric', value: String(c), prefix: 'c =' },
          right: `Yes — c = ${fmt(c)}, read straight off where the line meets the y-axis.`,
          wrong: `c = ${fmt(c)}. Follow the line to the y-axis and read the number there.`,
        }
      },
    },
  ]
}

function stageTwoChecks(): Check[] {
  return [
    {
      // Uses the word `naming` has just introduced, which is how the
      // vocabulary gets exercised rather than merely read.
      variants: 3,
      build: v => {
        const sets = [
          [['y = 2x', 2], ['y = 5x', 5], ['y = ½x', 0.5]],
          [['y = 3x', 3], ['y = −4x', -4], ['y = x', 1]],
          [['y = −2x', -2], ['y = 6x', 6], ['y = 0.5x', 0.5]],
        ] as const
        const set = sets[v]
        const steepest = set.reduce((a, b) => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a))
        return {
          ask: 'Which of these lines has the steepest gradient?',
          answer: {
            kind: 'choice',
            options: set.map(s => s[0]),
            correct: set.findIndex(s => s[0] === steepest[0]),
          },
          right: `Yes — ${steepest[0]} climbs ${Math.abs(steepest[1])} for every 1 across. `
            + 'Steepness is about the SIZE of m; the sign only says which way.',
          wrong: `${steepest[0]} is the steepest: it changes by ${Math.abs(steepest[1])} for `
            + 'every 1 across. A minus sign makes a line fall, not flatten.',
        }
      },
    },
    {
      variants: M_VALUES.length,
      build: v => {
        const m = M_VALUES[v]
        return {
          ask: 'What is the gradient of the line drawn here?',
          figure: straightLineGrid({ x: X, y: Y2, ghosts: [], live: [m, 0] }),
          answer: { kind: 'numeric', value: String(m), prefix: 'm =' },
          right: `Yes — m = ${fmt(m)}. Go across 1 and the line `
            + `${m > 0 ? 'climbs' : 'falls'} ${Math.abs(m)}.`,
          wrong: `m = ${fmt(m)}. Pick a point where the line crosses a corner, go 1 to the `
            + `right, and count how far it ${m > 0 ? 'rises' : 'falls'}.`,
        }
      },
    },
  ]
}

function stageThreeChecks(): Check[] {
  return [
    {
      variants: M_VALUES.length,
      build: v => {
        const m = M_VALUES[v]
        const c = C_VALUES[v]
        return {
          ask: 'Read the gradient of this line.',
          figure: straightLineGrid({ x: X3, y: Y2, ghosts: [], live: [m, c] }),
          answer: { kind: 'numeric', value: String(m), prefix: 'm =' },
          right: `Yes — m = ${fmt(m)}. The ${fmt(c)} moves the line up or down and leaves `
            + 'the steepness alone.',
          wrong: `m = ${fmt(m)}. Count the climb for 1 across — ignore where it crosses, `
            + 'that is c.',
        }
      },
    },
    {
      // Same gradient, different intercept: the clearest test that they have
      // the two apart. "Parallel" is avoided — the investigation never taught
      // the word, and a check is not the place to meet one.
      variants: M_VALUES.length,
      build: v => {
        const m = M_VALUES[v]
        const c = C_VALUES[v]
        const options = [lineEquation(m, c + 3), lineEquation(-m, c), lineEquation(m + 1, c)]
        return {
          ask: `Which of these has the same steepness as ${lineEquation(m, c)}?`,
          answer: { kind: 'choice', options, correct: 0 },
          right: `Yes — same m, so the same steepness. Only c changed, which slides it `
            + 'up the axis.',
          wrong: `${options[0]}. Steepness is m, so look only at the number in front of x `
            + '— the other one moves the line without tilting it.',
        }
      },
    },
  ]
}

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
      reveal: pointsGrid({
        x: X,
        y: Y1,
        ghosts: [[1, 0], [1, c1]],
        expect: [{ x: 0, y: c1 }],
      }),
      right: `(0, ${c1}) is where it crosses — the + ${c1} lifted every point on the `
        + `line up by ${c1}.`,
      wrong: `It crosses at (0, ${c1}). The ring on the graph is where it actually goes — `
        + 'now draw some lines of your own and watch what c does.',
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
          // marked wrong for being correct. See the aside, and docs/audit/31 §4.
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
    },
    naming: {
      term: 'the y-intercept',
      means: 'the value of c — the height where the line crosses the y-axis. Every line '
        + 'you drew had a different one.',
      elsewhere: 'To intercept is to cut across something’s path and meet it: you '
        + 'intercept a pass, a message, a runner. The line is travelling, the y-axis is in its '
        + 'way, and the y-intercept is where they meet. From Latin inter, between, and capere, '
        + 'to seize.',
      onThePaper: 'Write down the coordinates of the point where the line crosses the y-axis.',
    },
    check: stageOneChecks(),
    aside: {
      head: 'One honest complication',
      body: 'Moving y = x up by 3 gives exactly the same line as sliding it 3 to the left — '
        + 'you cannot tell those two apart, because a straight line runs on forever in both '
        + 'directions. (In general, up by k is the same as left by k ÷ m.) That is precisely '
        + 'why we pin a line down by where it crosses and how steep it is, rather than by which '
        + 'way someone pushed it. For a curve the two really are different, which is where this '
        + 'starts to matter.',
    },
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
    check: stageTwoChecks(),
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
    check: stageThreeChecks(),
  }
}

export const understandingStraightLineGraphsInvestigation: Investigation = {
  skillId: 'understanding_straight_line_graphs',
  title: 'What m and c do',
  premise: 'A student can be shown y = mx + c and agree with all of it without holding what m '
    + 'and c mean. The only way to hold it is to move one of them and watch, which is what the '
    + 'classroom version of this lesson does.',
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
  // Nothing authored yet: the page falls back to practice on the skill, which
  // is honest while the bank has no verified question for this handoff.
  transferQuestionIds: [],
}
