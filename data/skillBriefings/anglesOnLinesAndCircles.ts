import type { SkillBriefing } from './types'
import { anglesAtAPoint } from '../../lib/skills/briefingFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Angles on lines and circles — seventeenth authored briefing, and the first in
// Shape and Space, which had no briefing at all.
//
// The whole skill is choosing the right angle fact, and the coded traps say so:
// `use_360_not_180`, `use_180_not_360` and `angle_sum_choice` are the same
// mistake, and `forget_two_equal_angles` (isosceles) and `opposite_angles` are
// facts not noticed. So the method starts with naming what the angles sit on,
// before any arithmetic, and the figures show the two cases side by side.
//
// Every Higher coded part is chained, and `give_the_unit_angle_not_the_multiple`
// recurs on both tiers: these questions hand you an equation in disguise and
// then ask for an angle, not for x. That is the last step, and it is the same
// warning solvingLinearEquations.ts gives from the algebra side — which is why
// these two pages point at each other.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const anglesOnLinesAndCirclesBriefing: SkillBriefing = {
  skillId: 'angles_on_lines_and_circles',

  summary:
    'Finding a missing angle from a fact about what the angles sit on — a line, a point, a triangle.',

  recognise: [
    {
      text: 'Angles meeting on a straight line. They add to 180°, however many there are.',
      example: 'Work out the size of angle y.',
      figure: anglesAtAPoint({
        mode: 'line', labels: ['2x', '3x', 'x + 30'],
        alt: 'Three angles meeting at a point on a straight line, labelled 2x, 3x and x + 30. '
          + 'Because they sit on a line they add to 180 degrees, which gives 6x + 30 = 180.',
      }),
    },
    {
      text: 'Angles meeting all the way round a point. Now the same working uses 360°, not 180°.',
      example: 'The diagram shows four angles at a point.',
      figure: anglesAtAPoint({
        mode: 'point', labels: ['110°', '95°', 'y', '80°'],
        alt: 'Four angles meeting at a point: 110 degrees, 95 degrees, an unknown y, and 80 degrees. '
          + 'All the way round a point the angles add to 360 degrees, so y is 75 degrees.',
      }),
    },
    {
      text: 'Two equal sides, or two equal angles, marked with little dashes — an isosceles triangle, '
        + 'where one fact gives you two angles.',
      example: 'Triangle ABC has AB = AC.',
    },
    {
      text: 'The angles are algebra rather than numbers, which means the angle fact is really an equation.',
      example: 'The angles are 2x, 3x and x + 30.',
    },
  ],

  confusableWith: [
    {
      skillId: 'solving_linear_equations',
      thisOne: 'The geometry is the point: which fact applies, and what the diagram is telling you.',
      theOther: 'The equation is printed, or built from a story, and the work is the algebra.',
      ask: 'Am I choosing an angle fact, or solving an equation I have already got?',
    },
    {
      skillId: 'angles_in_polygons',
      thisOne: 'Angles at ONE point, or inside a single triangle.',
      theOther: 'A shape with many sides, where the angle sum depends on how many sides it has.',
      ask: 'Is this one point or one triangle, or a polygon whose sides I need to count?',
    },
  ],

  examples: [
    {
      stem: 'Three angles meet at a point on a straight line. They are 2x, 3x and x + 30. '
        + 'Work out the size of the largest angle.',
      isThisSkill: true,
      cue: 'On a line, so they add to 180 — and the answer wanted is an angle, not x.',
      figure: anglesAtAPoint({
        mode: 'line', labels: ['2x', '3x', 'x + 30'],
        alt: 'Three angles on a straight line labelled 2x, 3x and x + 30, meeting at one point.',
      }),
    },
    {
      stem: 'Triangle PQR has PQ = PR. Angle QPR is 40°. Work out the size of angle PQR.',
      isThisSkill: true,
      cue: 'Two equal sides means two equal angles. The other two share 140°, so they are 70° each.',
    },
    {
      stem: 'Work out the size of each interior angle of a regular octagon.',
      isThisSkill: false,
      actuallySkillId: 'angles_in_polygons',
      cue: 'Eight sides, so the angle sum depends on the number of sides — not on one point or one triangle.',
    },
    {
      stem: 'Solve 5x + 3 = 2x + 18',
      isThisSkill: false,
      actuallySkillId: 'solving_linear_equations',
      cue: 'The equation is already written down. There is no diagram and no angle fact to choose.',
    },
  ],

  steps: [
    {
      do: 'Before any arithmetic, say out loud what the angles sit on: a line is 180°, a full turn is '
        + '360°, a triangle is 180°.',
      because:
        'Choosing the wrong total is the single biggest source of lost marks here, and it is a '
        + 'decision made in the first five seconds.',
      watch:
        'Using 360 for angles on a line, or 180 for angles round a point. Look at whether the arms '
        + 'close all the way round or stop on a straight edge.',
    },
    {
      do: 'Mark every angle you can work out straight onto the diagram as you get it.',
      because:
        'These questions are usually two or three facts chained together, and the angle you need next '
        + 'is often one you have already found.',
      watch:
        'Equal sides you have not used. A pair of dashes means two equal angles, and forgetting that '
        + 'is what leaves these questions unsolvable.',
    },
    {
      do: 'If the angles are algebraic, add them, set the total to 180 or 360, and solve.',
      because:
        'The angle fact IS the equation. Writing 2x + 3x + x + 30 = 180 turns a geometry question '
        + 'into one you already know how to finish.',
      watch:
        'Sign slips when collecting terms, and forgetting that the same x appears in more than one angle.',
    },
    {
      do: 'Read the last line again: it usually wants an ANGLE, not x.',
      because:
        'x is the middle of the problem, not the end of it. In 2x, 3x, x + 30 the total gives x = 25, '
        + 'and the largest angle is 3x — that is 75°, not 25.',
      watch:
        'Stopping at x, or giving the wrong one of the angles you worked out.',
    },
  ],

  check: [
    'Do all your angles add back up to the total you used — 180° on a line, 360° round a point?',
    'Does the picture agree? An angle that looks obtuse in the diagram should not come out as 40°, '
      + 'even though diagrams are not drawn to scale.',
    'If the triangle was isosceles, did the two equal angles come out equal?',
  ],

  higher: {
    note: {
      text: 'On Higher these arrive inside circles, where the tells are a radius meeting a tangent at '
        + '90° and a right angle in a semicircle.',
      example: 'AB is a tangent to the circle at point C.',
    },

    recognise: [
      {
        text: 'A tangent touching the circle, which meets the radius at that point at exactly 90°.',
        example: 'The line TP is a tangent to the circle, centre O.',
      },
      {
        text: 'A triangle drawn on the diameter, with its far corner on the circle — that corner is 90°.',
        example: 'AB is a diameter of the circle, and C is a point on the circumference.',
      },
    ],

    examples: [
      {
        stem: 'A, B and C are points on a circle, and AB is a diameter. Angle BAC is 34°. '
          + 'Work out the size of angle ABC.',
        isThisSkill: true,
        cue: 'The angle at C is 90° because AB is a diameter. The three angles then make 180°, '
          + 'so ABC is 56°.',
      },
    ],

    steps: [
      {
        do: 'Mark the right angles the circle gives you before anything else: radius to tangent, and '
          + 'the angle in a semicircle.',
        because:
          'A 90° you have written down turns the rest into ordinary triangle work, and it is usually '
          + 'the first method mark.',
        watch:
          'Missing the semicircle right angle, or assuming a radius meets any line at 90° — it is the '
          + 'TANGENT that does that.',
      },
    ],

    check: [
      'Did you use the fact that every radius is the same length? Two radii make an isosceles triangle, '
        + 'which is where the next pair of equal angles comes from.',
    ],
  },
}
