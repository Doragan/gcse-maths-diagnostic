import type { SkillBriefing } from './types'
import { circle } from '../../lib/skills/briefingFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Area of a circle — one of a mensuration batch written with
// areasOfSquaresAndRectangles.ts and volumeOfAPrism.ts. A cylinder is a prism
// whose cross-section is a circle, so this page's method is the first step of
// that one, and the two point at each other.
//
// `use_diameter_for_radius` is coded on BOTH tiers and is the trap the page is
// built around: the method starts by finding the radius, and that is the step
// the gate asks about. `forget_the_sector_fraction` is the semicircle and
// quarter circle, and `forget_in_terms_of_pi` / `uses_pi_3_estimate` are the
// form of the answer.
//
// π is the calculator's π, or left as π. Never 3.14: it can move the last
// digit, and a worked answer that uses it teaches that it is fine.
//
// Not routes. A whole circle, a semicircle and a quarter circle share a first
// move — find the radius — and differ only in a fraction taken at the end,
// which is one step of one method.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const areaOfACircleBriefing: SkillBriefing = {
  skillId: 'area_of_a_circle',

  summary:
    'The space inside a circle, or part of one, from its radius: π × radius × radius.',

  recognise: [
    {
      text: 'A circle with a length marked on it, and the word "area".',
      example: 'Work out the area of the circle.',
      figure: circle({
        show: 'radius', label: '5 cm',
        alt: 'A circle with a line from the centre to the edge labelled 5 cm — the radius.',
      }),
    },
    {
      text: 'A length drawn right across the circle through the centre. That is the diameter, and '
        + 'the radius is half of it.',
      example: 'The diameter of the circle is 12 cm.',
      figure: circle({
        show: 'diameter', label: '12 cm',
        alt: 'A circle with a line right across it through the centre, labelled 12 cm — the '
          + 'diameter. The radius is half of it, 6 cm.',
      }),
    },
    {
      text: 'Half or a quarter of a circle, where the area is that fraction of the whole circle.',
      example: 'Work out the area of the semicircle.',
      figure: circle({
        show: 'diameter', label: '10 cm', part: 0.5,
        alt: 'A semicircle whose straight edge, the diameter, is 10 cm.',
      }),
    },
    {
      text: '"Give your answer in terms of π" — which means leaving π in the answer rather than '
        + 'working it out.',
      example: 'Give your answer in terms of π.',
    },
  ],

  confusableWith: [
    {
      skillId: 'circumfrence_of_a_circle',
      thisOne: 'The space INSIDE the circle: π × r × r, in square units.',
      theOther: 'The distance ROUND the circle: π × diameter, in plain units.',
      ask: 'Am I covering the inside, or going round the edge?',
      pair: {
        thisOne: 'A circular rug has a radius of 3 m. Work out its area.',
        theOther: 'A circular rug has a radius of 3 m. Work out the length of trim round its edge.',
      },
    },
    {
      // Mirror of the entry in volumeOfAPrism.ts — same distinction, other side.
      skillId: 'volume_of_a_prism',
      thisOne: 'A flat circle, where the area is the whole answer.',
      theOther: 'A cylinder, where the circle\'s area is only the first step and is multiplied by '
        + 'the height.',
      ask: 'Is it a flat circle, or the end of a solid?',
      pair: {
        thisOne: 'A circle has a radius of 4 cm. Work out its area.',
        theOther: 'A cylinder has a radius of 4 cm and a height of 10 cm. Work out its volume.',
      },
    },
  ],

  examples: [
    {
      stem: 'A circle has a radius of 6 cm. Work out its area. Give your answer to 1 decimal place.',
      isThisSkill: true,
      worked: [
        'Area = π × r²',
        'π × 6² = π × 36, using the π button',
        '113.097… = 113.1 cm²',
      ],
      cue: 'A radius and the word "area". The radius goes straight into the formula.',
    },
    {
      stem: 'The diagram shows a circle with a diameter of 10 cm. Work out its area, leaving your '
        + 'answer in terms of π.',
      isThisSkill: true,
      figure: circle({
        show: 'diameter', label: '10 cm',
        alt: 'A circle with its diameter drawn across it, labelled 10 cm.',
      }),
      worked: [
        'The length drawn right across is the diameter, so the radius is 10 ÷ 2 = 5 cm',
        'π × 5² = 25π cm²',
      ],
      cue: 'The length goes right across, so it is the diameter — halve it before anything else.',
    },
    {
      stem: 'A semicircle has a diameter of 8 cm. Work out its area. Give your answer to 1 decimal '
        + 'place.',
      isThisSkill: true,
      worked: [
        'Radius = 8 ÷ 2 = 4 cm',
        'A whole circle would be π × 4² = 16π',
        'Half of that: 16π ÷ 2 = 8π = 25.1 cm²',
      ],
      cue: 'Half a circle, so half the area — and the length given is the diameter.',
    },
    {
      stem: 'A circular pond has a diameter of 6 m. Work out its circumference.',
      isThisSkill: false,
      actuallySkillId: 'circumfrence_of_a_circle',
      cue: 'Circumference is the distance round the edge — a length, worked out from π × diameter, '
        + 'not an area.',
    },
    {
      stem: 'A cylindrical tin has a radius of 5 cm and a height of 12 cm. Work out its volume.',
      isThisSkill: false,
      actuallySkillId: 'volume_of_a_prism',
      cue: 'The circle\'s area is in there, but it is only the first step. A height makes it a '
        + 'volume.',
    },
  ],

  methodExample: 'A circle has a diameter of 14 cm. Work out its area to 1 decimal place.',
  steps: [
    {
      do: 'Find the radius: halve the diameter if that is what you were given.',
      because:
        'The formula uses the radius — the distance from the centre to the edge. A diameter goes '
        + 'right across, so it is twice as long.',
      watch:
        'Putting the diameter into the formula. With 14 instead of 7 the answer comes out four '
        + 'times too big.',
      example: 'Radius = 14 ÷ 2 = 7 cm',
      nextMoveDistractors: [
        'Square the diameter you were given and multiply by π.',
        'Multiply the diameter by π, because that gives the area.',
      ],
    },
    {
      do: 'Square the radius, then multiply by π.',
      because: 'Area = πr². Only the radius is squared; π is not.',
      watch: 'Doubling the radius instead of squaring it. 7² is 49, not 14.',
      example: 'π × 7² = π × 49 = 153.938…',
    },
    {
      do: 'Use the π button and round only at the end, or leave π in if the question says '
        + '"in terms of π".',
      because:
        'π is not 3.14. Rounding it early can move the last digit, and the mark is for the right '
        + 'one.',
      watch:
        'Using 3 or 3.14 for π, or working out a decimal when the question asked for the answer '
        + 'in terms of π.',
      example: '153.9 cm² to 1 decimal place — or 49π cm² in terms of π',
    },
    {
      do: 'For a semicircle or a quarter circle, take that fraction of the whole circle\'s area.',
      because: 'A semicircle is half of a circle, so it has half the area.',
      watch:
        'Giving the area of the whole circle, or halving the radius instead of the area — which '
        + 'quarters it.',
      example: 'If it were a semicircle: 153.938… ÷ 2 = 77.0 cm²',
    },
  ],

  check: [
    'Did you use the radius? If the length you were given went right across the circle, it was '
      + 'the diameter, and needed halving first.',
    'Are the units squared? An area is in cm² or m².',
    'A rough check: the area is a little more than 3 × r × r. For a radius of 7 cm that is about '
      + '150 cm². An answer near 615 cm² means the diameter went into the formula.',
  ],

  higher: {
    note: {
      text: 'On Higher the answer is usually wanted in terms of π, and the circle often sits inside '
        + 'or around another shape, with a shaded area to find.',
      example: 'A circle of radius 5 cm is cut from a square of side 10 cm.',
    },

    recognise: [
      {
        text: 'A circle and a square together, and the area of the part that is shaded.',
        example: 'Work out the area of the shaded region, in terms of π.',
      },
    ],

    examples: [
      {
        stem: 'A quarter circle has a radius of 10 cm. Work out its area, giving your answer in '
          + 'terms of π.',
        isThisSkill: true,
        worked: [
          'A whole circle would be π × 10² = 100π',
          'A quarter of that: 100π ÷ 4 = 25π cm²',
        ],
        cue: 'A quarter of a circle, and "in terms of π", so π stays in the answer.',
      },
    ],

    methodExample: 'A circle of radius 3 cm is cut from a square of side 6 cm. Find the area left, '
      + 'in terms of π.',
    steps: [
      {
        do: 'Work out each area separately, keeping π as π.',
        because: 'An exact answer needs π kept as a symbol all the way through.',
        watch:
          'Turning 9π into a decimal halfway through, which leaves no way back to the exact answer.',
        example: 'Square: 6 × 6 = 36; circle: π × 3² = 9π',
      },
      {
        do: 'Subtract, and leave the answer as a number minus a multiple of π.',
        because: '36 has no π in it and 9π does, so they cannot be combined into one term.',
        watch: 'Writing 27π. 36 − 9π is not 27π, because the 36 is not a multiple of π.',
        example: 'Area left = 36 − 9π cm²',
      },
    ],

    check: [
      'In terms of π: is π still in your answer, and have you combined only terms that both '
        + 'contain π?',
    ],
  },
}
