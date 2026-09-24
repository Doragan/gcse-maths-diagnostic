import type { SkillBriefing } from './types'
import { rightTriangle } from '../../lib/skills/briefingFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Pythagoras' theorem — nineteenth authored briefing, closing the Shape and
// Space cluster.
//
// One trap dominates on both tiers, under several names:
// `add_vs_subtract_squares`, `add_where_subtraction_is_needed`,
// `subtract_where_addition_is_needed`, `subtract_squares`. It is a single
// decision — is the missing side the hypotenuse or not — and it is made before
// any arithmetic, so it leads the method and the figure is drawn with the
// unknown as a SHORTER side, which is the case students get wrong.
//
// `forget_the_square_root` is next, which is why the self-check is about the
// size of the answer rather than the working.
//
// Most coded parts are chained: Pythagoras is a step inside an area, a perimeter
// or a circle question rather than the whole of it. Higher adds
// `miss_the_tangent_radius_right_angle` and `use_pythagoras_on_a_non_right_triangle`
// — the second is a recognition failure, so it gets a cue and a comparison.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const pythagorasTheoremBriefing: SkillBriefing = {
  skillId: 'pythagoras_theorem',

  summary:
    'Finding the third side of a right-angled triangle from the other two.',

  recognise: [
    {
      text: 'A right angle in the triangle, with two sides known and one missing. No angles are '
        + 'mentioned anywhere.',
      example: 'Work out the length of the side marked x.',
      figure: rightTriangle({
        base: '15 cm', height: 'x', hypotenuse: '17 cm', unknown: 'height',
        alt: 'A right-angled triangle with the right angle at the bottom left. The base is 15 cm, '
          + 'the sloping hypotenuse is 17 cm, and the vertical side is labelled x. Because x is a '
          + 'shorter side and not the hypotenuse, this is 17² − 15², giving x = 8 cm.',
      }),
    },
    {
      text: 'No triangle is drawn, but the situation makes one: a ladder against a wall, a diagonal '
        + 'across a rectangle, a distance between two points.',
      example: 'A ladder leans against a vertical wall, with its foot 1.5 m from the base.',
    },
    {
      text: 'Two sides and a right angle, and the question wants a LENGTH. If an angle is given or '
        + 'asked for, it is trigonometry instead.',
      example: 'Give your answer correct to 1 decimal place.',
    },
  ],

  confusableWith: [
    {
      skillId: 'trigonometry_missing_sides',
      thisOne: 'Two SIDES are known, and no angle appears anywhere in the question.',
      theOther: 'One side and one angle are known, so you need sin, cos or tan.',
      ask: 'Do I have two sides, or a side and an angle?',
    },
    {
      skillId: 'areas_of_squares_and_rectangles',
      thisOne: 'The missing length is the answer, worked out from the other two sides.',
      theOther: 'The lengths are given and the answer is an area — length times width.',
      ask: 'Am I finding a length, or filling a shape?',
    },
  ],

  examples: [
    {
      stem: 'A right-angled triangle has a base of 15 cm and a hypotenuse of 17 cm. '
        + 'Work out the height of the triangle.',
      isThisSkill: true,
      cue: 'Two sides and a right angle, and the missing one is NOT the hypotenuse — so subtract: '
        + '17² − 15².',
      figure: rightTriangle({
        base: '15 cm', height: 'x', hypotenuse: '17 cm', unknown: 'height',
        alt: 'A right-angled triangle with base 15 cm, hypotenuse 17 cm, and the vertical side '
          + 'labelled x.',
      }),
    },
    {
      stem: 'A rectangle is 8 cm long and 6 cm wide. Work out the length of its diagonal.',
      isThisSkill: true,
      cue: 'The diagonal cuts the rectangle into two right-angled triangles, and it is the longest '
        + 'side of each — so add: 8² + 6².',
    },
    {
      stem: 'A right-angled triangle has a hypotenuse of 12 cm and an angle of 35°. '
        + 'Work out the length of the side opposite that angle.',
      isThisSkill: false,
      actuallySkillId: 'trigonometry_missing_sides',
      cue: 'An angle is given. Pythagoras never uses angles — this is sin, cos or tan.',
    },
    {
      stem: 'A rectangle is 8 cm long and 6 cm wide. Work out its area.',
      isThisSkill: false,
      actuallySkillId: 'areas_of_squares_and_rectangles',
      cue: 'Both lengths are already known and the answer is an area, not a missing side.',
    },
  ],

  steps: [
    {
      do: 'First decide whether the side you want is the hypotenuse — the one opposite the right '
        + 'angle, always the longest.',
      because:
        'This single decision sets everything else: the hypotenuse means ADD the squares, a shorter '
        + 'side means SUBTRACT. It is the most common way these questions are lost.',
      watch:
        'Adding when the hypotenuse is already given. If the answer comes out longer than the '
        + 'hypotenuse, you have added where you should have subtracted.',
    },
    {
      do: 'Square the two sides you have, and write that line down.',
      because:
        'The squaring line is worth a method mark by itself, even if the arithmetic afterwards slips.',
      watch:
        'Doubling instead of squaring, and dropping the squaring step when showing your working — '
        + 'answers with no working score nothing on "show that" questions.',
    },
    {
      do: 'Add or subtract as you decided, then take the SQUARE ROOT.',
      because:
        'The equation gives you x², not x. The root is the last step and it is the one most often '
        + 'forgotten.',
      watch:
        'Handing in the squared value. On the triangle above, 289 − 225 = 64 is not the answer — 8 is.',
    },
    {
      do: 'Check what the question actually wanted: a perimeter, an area, or a rounded length.',
      because:
        'Pythagoras is usually a step inside a longer question, not the end of it.',
      watch:
        'Rounding partway through. Keep the full value on your calculator and round only at the end.',
    },
  ],

  check: [
    'Is the hypotenuse the longest side in your finished triangle? If a shorter side has come out '
      + 'longer than it, the add-or-subtract decision went the wrong way.',
    'Did you square root at the end? An answer in the hundreds where the other sides are single '
      + 'figures is the giveaway.',
    'Is it rounded as asked, and in the right units?',
  ],

  higher: {
    note: {
      text: 'On Higher the right angle is usually something you have to FIND — where a tangent meets '
        + 'a radius, or inside a 3D solid — rather than something marked for you.',
      example: 'The line AB is a tangent to the circle, centre O.',
    },

    recognise: [
      {
        text: 'A tangent and a radius, which meet at 90° and hand you a right-angled triangle.',
        example: 'AT is a tangent to the circle at T.',
      },
      {
        text: 'A 3D solid, where the working goes in two stages: across the base first, then up.',
        example: 'Work out the length of the diagonal of the cuboid.',
      },
    ],

    confusableWith: [
      {
        skillId: 'cosine_rule',
        thisOne: 'There IS a right angle in the triangle.',
        theOther: 'No right angle, so Pythagoras does not apply — it is the cosine rule instead.',
        ask: 'Is there a right angle in this triangle, or am I assuming one?',
      },
    ],

    examples: [
      {
        stem: 'A cuboid measures 6 cm by 8 cm by 24 cm. Work out the length of the longest diagonal '
          + 'inside it.',
        isThisSkill: true,
        cue: 'Two stages: the base diagonal first, 6² + 8² giving 10, then 10² + 24² giving 26 cm.',
      },
    ],

    steps: [
      {
        do: 'In 3D, do the base triangle first and carry its EXACT value into the second triangle.',
        because:
          'The diagonal of the base is one of the two sides of the upright triangle, so the whole '
          + 'answer rests on it.',
        watch:
          'Rounding the base diagonal before using it. Keep it exact, or as a square, and round once '
          + 'at the very end.',
      },
    ],

    check: [
      'Is the final diagonal longer than every edge of the solid? It has to be.',
      'If a circle was involved, did you use the radius rather than the diameter?',
    ],
  },
}
