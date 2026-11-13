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
// The method is in ROUTES, not one numbered list. This skill is asked from a
// drawn line, from two coordinates and from an untidy equation, and the first
// move is different in each; threaded through a single list the steps kept
// changing subject, and a student could not tell which of them were for the
// question in front of them. Each route is a question type, picked the same
// way the rest of the page teaches — by looking at what you have been given.
//
// Both tiers code `gradient_computed_upside_down`, which is the last step of
// route 1 and the first of route 2, and `gradient_read_before_rearranging`,
// which is the whole of route 3.
//
// Higher adds a fourth route rather than steps on the others: the gradient
// arrives as a description (parallel, perpendicular) instead of something to
// read off, which is a different first move again. The
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

  // The method is split by the question, not by difficulty. Threading all
  // three through one numbered list made the steps change subject — tidying
  // an equation above reading a grid — and a student could not tell which of
  // them were for the question in front of them.
  //
  // No step here is gated. The gate asks what comes next and hides the rest
  // of the method until it is answered, which works on one thread and not on
  // three: the answer to route 1 is written out in plain sight as the first
  // step of route 2.
  routes: [
    {
      name: 'The line is drawn for you',
      when: 'A line on a grid, and an answer line wanting an equation.',
      example: 'The line below is drawn on a grid. Work out its equation.',
      figure: lineGraph({
        xRange: [-1, 5], yRange: [-3, 7], line: { m: 2, c: -1 },
        points: [{ x: 0, y: -1 }, { x: 3, y: 5 }], step: true,
        alt: 'A line on a numbered grid crossing the y-axis at −1 and passing through (3, 5), '
          + 'with the step between those two points marked as 3 across and 6 up.',
      }),
      steps: [
        {
          do: 'Find where the line cuts the y-axis and read the value off. That is c.',
          because:
            'c is the value of y when x is zero, and the y-axis is exactly where x is zero. On a line you can see, c is read rather than worked out.',
          watch:
            'Reading where it cuts the across axis instead. c comes off the UP one.',
          example: 'It cuts the y-axis at −1, so c = −1',
        },
        {
          do: 'Pick two points where the line passes exactly through a corner of the grid, and count from one to the other: up, then across.',
          because:
            'A corner is a point you can read exactly. Anywhere else you are estimating, and an estimated gradient is a wrong gradient.',
          watch:
            'Counting SQUARES rather than reading the numbers. If the y-axis climbs in twos, one square up is 2, and every gradient comes out half what it should be.',
          example: 'From (0, −1) to (3, 5): 6 up, 3 across',
        },
        {
          do: 'Divide the up by the across to get m, then write it as y = mx + c.',
          because:
            'The gradient is how far y moves for one step of x, so y is the one being divided. Up over across, every time.',
          watch:
            'Dividing the wrong way round. Across over up gives 3 ÷ 6 here, the reciprocal of the answer — the slip that turns up on both Foundation and Higher papers.',
          example: 'm = 6 ÷ 3 = 2, so y = 2x − 1',
        },
      ],
    },
    {
      name: 'You are given two points',
      when: 'Two coordinates and no picture at all.',
      example: 'A straight line passes through (1, 5) and (4, 17). Work out its equation.',
      steps: [
        {
          do: 'Work out the gradient: the change in y divided by the change in x.',
          because:
            'There is no y-axis to look at, so m has to come first — and two points is all the gradient of a straight line ever needs.',
          watch:
            'Subtracting in a different order top and bottom. Start at the same point for both, or the sign comes out wrong.',
          example: 'm = (17 − 5) ÷ (4 − 1) = 12 ÷ 3 = 4',
        },
        {
          do: 'Put either one of the points into y = mx + c, and solve for c.',
          because:
            'The point is on the line, so its x and y must fit the equation. That leaves c as the only thing you do not know.',
          watch:
            'Using the point AS the intercept: (1, 5) does not make c = 5.',
          example: '5 = 4 × 1 + c, so c = 1',
        },
        {
          do: 'Write the answer as an equation, starting y =, rather than as a single number.',
          because:
            'The last mark is for the equation. A gradient on its own answers a question that was not the one asked.',
          watch:
            'Answering "4", or stopping at "4x + 1".',
          example: 'y = 4x + 1',
        },
      ],
    },
    {
      name: 'You are given an equation, but not in y = form',
      when: 'Something like 3y = 12x − 9, and a question about its gradient or its intercept.',
      example: 'A line has equation 3y = 12x − 9. Write down the gradient of the line.',
      steps: [
        {
          do: 'Rearrange until y stands alone: divide every term by whatever is multiplying y.',
          because:
            'Only when y is on its own does the number in front of x mean the gradient. Until then the equation is describing 3y, not y.',
          watch:
            'Dividing only the x term. Every term goes, including the number on the end.',
          example: 'Divide every term by 3: y = 4x − 3',
        },
        {
          do: 'Now read them off: m is the number multiplying x, c is the number on its own.',
          because:
            'Once it is in y = mx + c there is nothing left to work out — the form IS the answer.',
          watch:
            'Taking the gradient of 3x + y = 7 to be 3. Move the 3x across first and it is −3.',
          example: 'm = 4 — and c would be −3 if the intercept were asked for',
        },
      ],
    },
  ],
  check: [
    'Put one of your points back into your equation. Take (4, 17): putting x = 4 in should give '
      + 'y = 17. If it does not, the gradient or the intercept is wrong.',
    'Does the sign match the way the line leans? Up to the right is a positive gradient, down to '
      + 'the right is negative.',
    'Is your answer actually an equation? "4" and "4x + 1" are not — the mark is for y = 4x + 1.',
    'A line straight up the page is x = a, never y = something. Only a line across the page is y = a.',
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

    // A fourth route rather than extra steps on the others: the gradient
    // arrives by description here, which is a different first move again.
    routes: [
      {
        name: 'Parallel or perpendicular to a line you are given',
        when: 'No gradient stated and no points to count — just another line to take it from.',
        example: 'Line L is perpendicular to y = 2x + 1 and passes through (4, 3). Find its equation.',
        steps: [
          {
            do: 'Get the gradient of the line you were given, rearranging first if y is not already on its own.',
            because:
              'Everything here is built off that one number, so it has to be the real gradient and not the number that happens to sit in front of x.',
            watch:
              'Taking it from an untidy equation. In 2y = 6x + 1 the gradient is 3, not 6.',
            example: 'y = 2x + 1 is already tidy, so its gradient is 2',
          },
          {
            do: 'Parallel keeps that gradient. Perpendicular turns it upside down AND changes its sign.',
            because:
              'Perpendicular gradients multiply to −1. Turning 2 over gives ½, and ½ × 2 is 1 — the sign change is what makes it −1.',
            watch:
              'Doing one half of it and not the other. The perpendicular to y = 2x is neither y = −2x nor y = ½x.',
            example: 'Perpendicular: 2 turns over to ½, then changes sign, so m = −½',
          },
          {
            do: 'Put the point you were given into y = mx + c to find c, exactly as you would from two points.',
            because:
              'The gradient fixes which direction the line runs; the point is what fixes WHICH of the parallel lines in that direction it is.',
            watch:
              'Leaving the point unused. Without it the answer is a direction, not a line — and a parallel answer with the same c is the original line written out again.',
            example: '3 = −½ × 4 + c, so 3 = −2 + c and c = 5, giving y = −½x + 5',
          },
        ],
      },
    ],
    check: [
      'Multiply your gradient by the one you started from. Perpendicular lines must give exactly −1.',
      'A line parallel to another must have a DIFFERENT intercept. If c came out the same, you '
        + 'have written the original line again.',
    ],
  },
}
