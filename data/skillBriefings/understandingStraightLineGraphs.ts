import type { SkillBriefing } from './types'
import { lineGraph } from '../../lib/skills/briefingFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Understanding straight line graphs — twentieth authored briefing, and the
// first in Algebra since solving_linear_equations.
//
// Picked on three measures agreeing: 143 coded marks across 7 of the 8
// board/tier slices, the largest trap set of any unbriefed skill, and 65
// practice attempts at 60%. It is also the only skill with an investigation
// and no briefing, so /skills was sending those students straight into the
// investigation with nothing in front of it.
//
// The investigation teaches what m and c DO. This page does the other job:
// recognising the question on a paper, and the places the marks go.
//
// Both tiers code `gradient_computed_upside_down`, and
// `gradient_read_before_rearranging` recurs on Foundation and Higher alike.
// That decides the order of the method: tidy the equation FIRST, because the
// number in front of x is not the gradient until y stands alone, and only
// then do the division — which is the step the gate asks about.
//
// Higher adds one idea rather than a new method: the gradient arrives as a
// description (parallel, perpendicular) instead of something to read off. The
// negative-reciprocal traps are the biggest cluster there —
// `forgot_negative_reciprocal`, `sign_error_on_the_negative_reciprocal`,
// `product_of_gradients_not_-1` — and every one of them is half the operation
// done and the other half forgotten, which is why the step says AND.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const understandingStraightLineGraphsBriefing: SkillBriefing = {
  skillId: 'understanding_straight_line_graphs',

  summary:
    'Moving between a line and its equation — reading y = mx + c off a graph, or out of an equation.',

  recognise: [
    {
      text: 'A line already drawn on a grid, and an answer line waiting for an equation.',
      example: 'Find the equation of line L.',
      figure: lineGraph({
        xRange: [0, 6], yRange: [0, 8], line: { m: 2, c: 1 }, lineLabel: 'L',
        alt: 'A straight line drawn on a numbered grid, labelled L. It crosses the y-axis at 1 and '
          + 'climbs 2 units for every 1 across, so its equation is y = 2x + 1.',
      }),
    },
    {
      text: 'Two points and no picture at all. The method does not change — a graph was only ever '
        + 'a way of handing you two points.',
      example: 'A straight line passes through (1, 4) and (3, 10).',
    },
    {
      text: 'An equation that is not in y = ... form yet, with a question about its gradient or '
        + 'its intercept.',
      example: 'A line has equation 2y = 6x − 8. Write down its gradient.',
    },
    {
      text: 'Axes that do not climb in ones. Counting squares instead of reading the numbers puts '
        + 'every gradient out by the same factor.',
      example: 'Work out the gradient of the line.',
      figure: lineGraph({
        xRange: [0, 5], yRange: [0, 10], line: { m: 2, c: 0 },
        unitsPerSquare: { x: 1, y: 2 },
        alt: 'A line on a grid whose y-axis climbs in twos while the x-axis climbs in ones. The '
          + 'line rises one square for each square across, but one square up is 2 units, so the '
          + 'gradient is 2 and not 1.',
      }),
    },
    {
      text: 'The word PARALLEL, which hands you the gradient and leaves the intercept to be found '
        + 'from a point.',
      example: 'Line B is parallel to y = 3x − 1 and passes through (0, 5).',
    },
  ],

  confusableWith: [
    {
      skillId: 'plotting_straight_line_graphs',
      thisOne: 'The line is already there, and the EQUATION is what is missing.',
      theOther: 'The equation is already there, and the LINE is what is missing.',
      ask: 'Which of the two have I been given — the line, or the equation?',
      pair: {
        thisOne: 'A line is drawn on a grid. Work out its equation.',
        theOther: 'Draw the graph of y = 2x − 1 for values of x from −2 to 3.',
      },
    },
    {
      skillId: 'kinematic_graphs',
      thisOne: 'The axes are x and y, and the gradient is a plain number.',
      theOther: 'The axes carry units — seconds, metres — so the gradient is a rate, and the answer '
        + 'needs its units.',
      ask: 'Do the axes have units on them, or are they just x and y?',
      pair: {
        thisOne: 'A line passes through (0, 2) and (4, 10). Work out its gradient.',
        theOther: 'On a distance–time graph the line passes through (0 s, 2 m) and (4 s, 10 m). '
          + 'Work out the speed.',
      },
    },
  ],

  examples: [
    {
      stem: 'The line L is drawn on the grid. Work out the equation of L.',
      isThisSkill: true,
      worked: [
        'It crosses the y-axis at −1, so c = −1',
        'From (0, −1) to (3, 5) is 6 up for 3 across, so m = 6 ÷ 3 = 2',
        'y = 2x − 1',
      ],
      cue: 'The line is printed and the equation is missing. Read c where it crosses the y-axis, '
        + 'then count one step along the line for m.',
      figure: lineGraph({
        xRange: [-1, 5], yRange: [-3, 7], line: { m: 2, c: -1 }, lineLabel: 'L',
        alt: 'A straight line on a numbered grid from about (−1, −3) to (5, 7), crossing the '
          + 'y-axis at −1 and passing through (3, 5).',
      }),
    },
    {
      stem: 'A straight line passes through (2, 7) and (5, 16). Work out the equation of the line.',
      isThisSkill: true,
      worked: [
        'Gradient: (16 − 7) ÷ (5 − 2) = 9 ÷ 3 = 3',
        'Put (2, 7) into y = 3x + c: 7 = 6 + c, so c = 1',
        'y = 3x + 1',
      ],
      cue: 'No picture, but two points is everything the method needs. The graph was never the '
        + 'skill — the two points were.',
    },
    {
      stem: 'A line has equation 3y = 12x − 9. Write down the gradient of the line.',
      isThisSkill: true,
      worked: [
        'Divide every term by 3 so that y stands alone: y = 4x − 3',
        'The gradient is the number multiplying x, so m = 4',
      ],
      cue: 'It does not look like a graph question at all, but it is the same y = mx + c. The 12 '
        + 'is not the gradient until y is on its own.',
    },
    {
      stem: 'Draw the graph of y = 3x − 2 for values of x from −2 to 3.',
      isThisSkill: false,
      actuallySkillId: 'plotting_straight_line_graphs',
      cue: 'The equation is the thing you have been given. What is missing is the line, so this '
        + 'runs the other way round.',
    },
    {
      stem: 'A distance–time graph is a straight line passing through (0 s, 0 m) and (8 s, 60 m). '
        + 'Work out the speed.',
      isThisSkill: false,
      actuallySkillId: 'kinematic_graphs',
      cue: 'The same division, but the axes carry units: 7.5 m/s is a speed, not a bare gradient, '
        + 'and the units are part of the mark.',
    },
  ],

  methodExample: 'A straight line passes through (1, 5) and (4, 17). Find its equation.',
  steps: [
    {
      do: 'If you have been handed an equation rather than a line, rearrange it so that y is on '
        + 'its own before reading anything off it.',
      because:
        'Only when y stands alone does the number in front of x mean the gradient. Until then the '
        + 'equation is describing 2y or 3y, not y.',
      watch:
        'Taking the gradient of 2y = 8x − 6 to be 8, or of 3x + y = 7 to be 3 when it is −3.',
      example: 'Nothing to tidy here — but if it gave 2y = 8x − 6, halve it first: y = 4x − 3',
    },
    {
      do: 'Get two points the line definitely passes through: the pair in the question, or two '
        + 'places where the line cuts a corner of the grid.',
      because:
        'Two points is all a gradient ever needs, and a corner is a point you can read exactly. '
        + 'Anywhere else you are estimating, and the estimate is what goes wrong.',
      watch:
        'Taking a point where the line crosses mid-square, and reading a value off the wrong axis.',
      example: 'The question gives them: (1, 5) and (4, 17)',
    },
    {
      do: 'Work out the gradient: the change in y divided by the change in x.',
      because:
        'The gradient says how far y moves for one step of x, so y is the one being divided. Up '
        + 'over across, every time.',
      watch:
        'Dividing the wrong way round. Across over up gives 3 ÷ 12 here, which is the reciprocal '
        + 'of the answer — the slip that turns up on both Foundation and Higher papers.',
      example: 'm = (17 − 5) ÷ (4 − 1) = 12 ÷ 3 = 4',
      nextMoveDistractors: [
        'Count the squares between the two points and use that as the gradient.',
        'Divide the change in x by the change in y to find the gradient.',
      ],
    },
    {
      do: 'Find c by putting one of your points back into y = mx + c, or read it off the graph '
        + 'where the line crosses the y-axis.',
      because:
        'c is the value of y when x is zero. A point anywhere else only gives it to you after the '
        + 'substitution.',
      watch:
        'Using the point as the intercept: (1, 5) does not make c = 5. Parallel questions lose the '
        + 'same mark — the gradient gets copied across and the point is never used.',
      example: '5 = 4 × 1 + c, so c = 1',
    },
    {
      do: 'Write the answer as an equation, starting y =, rather than as a single number.',
      because:
        'The last mark is for the equation. A gradient on its own answers a question that was not '
        + 'the one asked.',
      watch:
        'Answering "4", or stopping at "4x + 1". And a line straight up the page is x = a, never y =.',
      example: 'y = 4x + 1',
    },
  ],

  check: [
    'Put one of your points back into your equation. If (4, 17) does not come out as 17, either '
      + 'the gradient or the intercept is wrong.',
    'Does the sign match the way the line leans? Up to the right is a positive gradient, down to '
      + 'the right is negative.',
    'Is your answer actually an equation? "4" and "4x + 1" are not — the mark is for y = 4x + 1.',
  ],

  higher: {
    note: {
      text: 'On Higher the gradient usually arrives as a description rather than something to read '
        + 'off: parallel to one line, perpendicular to another. Finding c from a point is unchanged.',
      // Deliberately not the numbers the drill below asks about: a note that
      // states the judged question has answered it before it is asked.
      example: 'Line C is perpendicular to y = 4x − 3 and passes through (8, 1).',
    },

    recognise: [
      {
        text: 'The word PERPENDICULAR. The gradients of two perpendicular lines multiply to −1.',
        example: 'Find the equation of the line perpendicular to AB, passing through P.',
      },
      {
        text: 'A question asking you to SHOW two lines are parallel or perpendicular, rather than '
          + 'to find one of them. The evidence is the two gradients, nothing else.',
        example: 'Show that the line PQ is perpendicular to the line RS.',
      },
    ],

    examples: [
      {
        stem: 'Line L is perpendicular to y = 2x + 1 and passes through (4, 3). '
          + 'Work out the equation of L.',
        isThisSkill: true,
        worked: [
          'Perpendicular to gradient 2: turn it over to ½, then change the sign, so m = −½',
          'Put (4, 3) in: 3 = −½ × 4 + c, so 3 = −2 + c and c = 5',
          'y = −½x + 5',
        ],
        cue: '"Perpendicular" gives you the gradient without a graph; the point is there to give '
          + 'you c. Same two halves as always.',
      },
    ],

    methodExample: 'Line L is perpendicular to y = 2x + 1 and goes through (4, 3). Find its equation.',
    steps: [
      {
        do: 'For perpendicular, turn the gradient upside down AND change its sign.',
        because:
          'Perpendicular gradients multiply to −1. Turning 2 over gives ½, and ½ × 2 is 1 — the '
          + 'sign change is what makes it −1.',
        watch:
          'Doing one half of it and not the other. The perpendicular to y = 2x is neither y = −2x '
          + 'nor y = ½x.',
        example: 'Gradient 2 turns over to ½, then changes sign: m = −½',
      },
      {
        do: 'For parallel, copy the gradient straight across and find a new c from the point.',
        because:
          'Parallel lines differ only in c. Copying the whole equation across gives back the line '
          + 'you started with, which is not parallel to it — it is it.',
        watch:
          'Comparing the intercepts to decide whether two lines are parallel. It is the gradients '
          + 'that decide it, and the intercepts that must differ.',
        example: 'If it said parallel instead: m = 2, then 3 = 8 + c, so c = −5',
      },
    ],

    check: [
      'Multiply your gradient by the one you started from. Perpendicular lines must give exactly −1.',
      'A line parallel to another must have a DIFFERENT intercept. If c came out the same, you '
        + 'have written the original line again.',
    ],
  },
}
