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
// recurs on both tiers: the angle just found is usually a stepping stone, and
// where the angles are algebraic, x is never the answer. That is the last step
// of the method.
//
// The comparisons are the two skills this is genuinely mistaken for. Corresponding
// angles look identical until you notice there are TWO crossings and a pair of
// parallel marks; trigonometry asks for an angle in a triangle too, but hands you
// lengths, which no angle fact can reach. A card pairing this with
// `solving_linear_equations` was removed on review (2026-11-04): a printed
// "solve 5x + 3 = 2x + 18" is not something anyone mistakes for geometry, so it
// crowded out the two comparisons that do get mixed up. The pairing stays apt in
// the other direction — an angle fact IS where many linear equations come from —
// but comparisons are kept reciprocal, so both sides go, and that page already
// covers diagram-built equations in its own cues and drill.
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
      skillId: 'alternate_and_corresponding_angles',
      thisOne: 'Every angle you need meets at ONE point — on a line, round a point, or in one triangle.',
      theOther: 'The angles are at TWO different crossings, joined by a pair of parallel lines.',
      ask: 'Are these angles all at the same point, or at two crossings with parallel arrows?',
      pair: {
        thisOne: 'Two angles meet at a point on a straight line. One of them is 118°. Work out the other.',
        theOther: 'A straight line crosses two parallel lines. An angle at the first crossing is 118°. '
          + 'Work out the corresponding angle at the second crossing.',
      },
    },
    {
      skillId: 'trigonometry_missing_angles',
      thisOne: 'You are given ANGLES, and an angle fact reaches the missing one.',
      theOther: 'You are given LENGTHS, and the angle only comes out of sin, cos or tan.',
      ask: 'What am I actually given here — angles, or side lengths?',
      pair: {
        thisOne: 'In triangle ABC, angle A is 40° and angle B is 65°. Work out angle C.',
        theOther: 'In triangle ABC, angle B is 90°, AB = 7 cm and BC = 24 cm. Work out angle ACB.',
      },
    },
    {
      skillId: 'angles_in_polygons',
      thisOne: 'Angles at ONE point, or inside a single triangle.',
      theOther: 'A shape with many sides, where the angle sum depends on how many sides it has.',
      ask: 'Is this one point or one triangle, or a polygon whose sides I need to count?',
      pair: {
        thisOne: 'Two angles on a straight line are 108° and x. Work out x.',
        theOther: 'Work out the size of an interior angle of a regular pentagon.',
      },
    },
  ],

  examples: [
    {
      stem: 'Three angles meet at a point on a straight line. They are 2x, 3x and x + 30. '
        + 'Work out the size of the largest angle.',
      isThisSkill: true,
      worked: [
        'They sit on a line, so they add to 180: 2x + 3x + x + 30 = 180',
        '6x + 30 = 180, so 6x = 150 and x = 25',
        'The angles are 50°, 75° and 55°, so the largest is 75°',
      ],
      cue: 'On a line, so they add to 180 — and the answer wanted is an angle, not x.',
      figure: anglesAtAPoint({
        mode: 'line', labels: ['2x', '3x', 'x + 30'],
        alt: 'Three angles on a straight line labelled 2x, 3x and x + 30, meeting at one point.',
      }),
    },
    {
      stem: 'Triangle PQR has PQ = PR. Angle QPR is 40°. Work out the size of angle PQR.',
      isThisSkill: true,
      worked: [
        'Two equal sides means the other two angles are equal',
        'They share 180 − 40 = 140° between them',
        'Each is 140 ÷ 2 = 70°',
      ],
      cue: 'Two equal sides means two equal angles. The other two share 140°, so they are 70° each.',
    },
    {
      stem: 'Work out the size of each interior angle of a regular octagon.',
      isThisSkill: false,
      actuallySkillId: 'angles_in_polygons',
      cue: 'Eight sides, so the angle sum depends on the number of sides — not on one point or one triangle.',
    },
    {
      stem: 'In triangle ABC, angle ABC is 90°, AB = 5 cm and BC = 12 cm. '
        + 'Work out the size of angle ACB.',
      isThisSkill: false,
      actuallySkillId: 'trigonometry_missing_angles',
      cue: 'It wants an angle in a triangle, which is why it looks like this skill — but what you '
        + 'are given is two LENGTHS. No angle fact can reach it; tan can.',
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
          example: 'ABD and DBC sit on a line, so they add to 180°',
    },
    {
      do: 'Mark every angle you can work out straight onto the diagram as you get it.',
      because:
        'These questions are usually two or three facts chained together, and the angle you need next '
        + 'is often one you have already found.',
      watch:
        'Equal sides you have not used. A pair of dashes means two equal angles, and forgetting that '
        + 'is what leaves these questions unsolvable.',
          example: 'Angle DBC = 180 − 118 = 62°. Write 62° onto the diagram at B',
    },
    {
      do: 'If the angles are algebraic, add them, set the total to 180 or 360, and solve.',
      because:
        'The angle fact IS the equation. Writing 2x + 3x + x + 30 = 180 turns a geometry question '
        + 'into one you already know how to finish.',
      watch:
        'Sign slips when collecting terms, and forgetting that the same x appears in more than one angle.',
          example: 'If the angles on the line were 2x, 3x and x + 30: 6x + 30 = 180, so x = 25',
    },
    {
      do: 'Read the last line again and check which angle it actually names.',
      because:
        'The angle you have just worked out is usually a stepping stone, not the answer — these '
        + 'questions are built so the easiest angle to reach is not the one asked for. And where '
        + 'the angles are algebraic, x is never the answer: the angle built from it is.',
      watch:
        'Handing in the angle you found on the way, or stopping at x.',
          example: 'It wants DCB: 180 − 62 − 25 = 93°, not the 62° found on the way',
    },
  ],

  methodExample: 'ABC is a straight line. Angle ABD is 118° and angle BDC is 25°. Find angle DCB.',
  check: [
    'Do all your angles add back up to the total you used — 180° on a line, 360° round a point?',
    'Is every angle you found possible? A negative angle, or 200° among angles on a straight line, '
      + 'means a slip further back. What it LOOKS like is not evidence — papers print "not '
      + 'accurately drawn" for exactly that reason.',
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
      worked: [
        'AB is a diameter, so the angle at C is 90°',
        'The three angles make 180°: 34 + 90 = 124',
        'Angle ABC = 180 − 124 = 56°',
      ],
        cue: 'The angle at C is 90° because AB is a diameter. The three angles then make 180°, '
          + 'so ABC is 56°.',
      },
    ],

    methodExample: 'A, B and C are on a circle and AB is a diameter. Angle BAC is 34°. Find angle ABC.',
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
              example: 'AB is a diameter, so angle C is 90°: 180 − 90 − 34 = 56°',
      },
    ],

    check: [
      'Did you use the fact that every radius is the same length? Two radii make an isosceles triangle, '
        + 'which is where the next pair of equal angles comes from.',
    ],
  },
}
