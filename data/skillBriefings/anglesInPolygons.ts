import type { SkillBriefing } from './types'
import { regularPolygon } from '../../lib/skills/briefingFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Angles in polygons — eighteenth authored briefing, and the middle of the
// Shape and Space cluster.
//
// Two coded traps decide these questions and they are the same confusion:
// `interior_vs_exterior_angle` and `divide_360_to_get_the_interior_angle`
// (360 ÷ n is the EXTERIOR angle; the interior is what is left on the straight
// line). Everything here is built round that one distinction, which is why the
// figure shows both angles on the same shape — the exterior one sitting outside
// the polygon, between a side extended and the next side.
//
// A large decision-justify and consequence share for such a small skill: the
// paper asks whether a statement about polygons is true, and the coded traps
// there are `assume_more_sides_means_a_bigger_exterior_angle` and
// `reflex_angle_thought_possible_in_a_triangle`. Hence the last step and the
// second example.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const anglesInPolygonsBriefing: SkillBriefing = {
  skillId: 'angles_in_polygons',

  summary:
    'Angles inside a many-sided shape, where everything follows from how many sides it has.',

  recognise: [
    {
      text: 'The shape is named by its number of sides, and the question asks for one of its angles.',
      example: 'Work out the size of each interior angle of a regular hexagon.',
      figure: regularPolygon({
        sides: 5, mark: 'both',
        alt: 'A regular pentagon with one interior angle marked inside the shape, and the exterior '
          + 'angle marked outside it — between one side extended past the corner and the next side. '
          + 'The two together make a straight line, so they add to 180 degrees.',
      }),
    },
    {
      text: 'The words interior or exterior. They are different angles at the same corner, and they '
        + 'add to 180°.',
      example: 'The exterior angle of a regular polygon is 24°.',
    },
    {
      text: 'A statement about polygons to judge, rather than an angle to find.',
      example: 'Megan says a polygon with more sides has a bigger exterior angle. Is she right?',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in anglesOnLinesAndCircles.ts.
      skillId: 'angles_on_lines_and_circles',
      thisOne: 'A shape with many sides, where the angle sum depends on how many sides it has.',
      theOther: 'Angles at ONE point, or inside a single triangle.',
      ask: 'Is this one point or one triangle, or a polygon whose sides I need to count?',
    },
  ],

  examples: [
    {
      stem: 'Work out the size of each interior angle of a regular octagon.',
      isThisSkill: true,
      cue: 'Regular and eight-sided. The exterior angle is 360 ÷ 8 = 45°, so each interior angle is 135°.',
    },
    {
      stem: 'The exterior angle of a regular polygon is 24°. Work out how many sides it has.',
      isThisSkill: true,
      cue: 'Run it backwards: the exterior angles always total 360°, so there are 360 ÷ 24 = 15 of them.',
    },
    {
      stem: 'Three angles meet at a point on a straight line. Two of them are 65° and 40°. '
        + 'Work out the third.',
      isThisSkill: false,
      actuallySkillId: 'angles_on_lines_and_circles',
      cue: 'One point on a line, with no shape involved. Nothing depends on counting sides.',
    },
    {
      stem: 'A regular polygon has 12 sides. Work out the total of all its interior angles.',
      isThisSkill: true,
      cue: 'The SUM this time, not one angle: (12 − 2) × 180 = 1800°.',
    },
  ],

  steps: [
    {
      do: 'Go to the exterior angle first: the exterior angles of ANY polygon add to 360°, so for a '
        + 'regular one each is 360 ÷ n.',
      because:
        'It is one division and it never changes with the number of sides, which makes it the safest '
        + 'route into every one of these questions.',
      watch:
        '360 ÷ n is the EXTERIOR angle, not the interior one. Handing that number in as the interior '
        + 'angle is the most common way these are lost.',
    },
    {
      do: 'Get the interior angle by subtracting from 180°, because the two sit on a straight line together.',
      because:
        'The exterior angle is the turn past the corner. Interior and exterior make a straight line, '
        + 'so 180 − exterior is the interior every time.',
      watch:
        'Subtracting from 360 instead of 180. Look at the diagram: the two angles meet along one side.',
    },
    {
      do: 'For the angle SUM, use (n − 2) × 180.',
      because:
        'A polygon splits into n − 2 triangles from one corner, and each triangle carries 180°. '
        + 'Knowing where the formula comes from is what stops you misremembering it.',
      watch:
        'Confusing the sum with one angle. For a regular shape, one interior angle is that total '
        + 'divided by n.',
    },
    {
      do: 'If the question asks whether a statement is true, answer with a number and a reason.',
      because:
        'These marks are for the justification. "No, because the exterior angle of a 10-sided polygon '
        + 'is 36° and of a 6-sided one is 60°" earns them; "no" alone does not.',
      watch:
        'Assuming more sides means bigger angles throughout. More sides means a bigger INTERIOR angle '
        + 'but a smaller EXTERIOR one, since they always share 360° between more corners.',
    },
  ],

  check: [
    'Do your interior and exterior angles add to 180°? If not, one of them is wrong.',
    'Is the interior angle sensible? Every interior angle of a convex polygon is under 180°, and for '
      + 'anything with more than four sides it should be comfortably over 90°.',
    'If you found the number of sides, is it a whole number? A fraction means the exterior angle did '
      + 'not divide into 360.',
  ],

  higher: {
    note: {
      text: 'On Higher the polygon is usually part of a bigger diagram — tiling with other shapes, or '
        + 'with the angle given as algebra.',
      example: 'Regular hexagons and regular polygons of n sides fit together at a point.',
    },

    recognise: [
      {
        text: 'Shapes fitting together round a point with no gaps, so their angles must total 360°.',
        example: 'The shapes tessellate around the point P.',
      },
    ],

    examples: [
      {
        stem: 'Two regular hexagons and one regular polygon of n sides meet exactly at a point. '
          + 'Work out the number of sides of the third polygon.',
        isThisSkill: true,
        cue: 'Angles at a point total 360°. Two hexagons bring 120° each, leaving 120° — so the third '
          + 'shape is a hexagon too.',
      },
    ],

    steps: [
      {
        do: 'When shapes meet at a point, add their interior angles and set the total to 360°.',
        because:
          'That equation is what turns a tiling picture into something solvable, and it is usually '
          + 'where the method marks sit.',
        watch:
          'Using exterior angles in the sum. It is the INTERIOR angles that meet at the point.',
      },
    ],

    check: [
      'Does your polygon exist? Work the interior angle back to a number of sides and check it is a '
        + 'whole number of at least 3.',
    ],
  },
}
