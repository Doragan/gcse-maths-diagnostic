import type { SkillBriefing } from './types'
import { prism } from '../../lib/skills/briefingFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Volume of a prism — the third of a mensuration batch written with
// areasOfSquaresAndRectangles.ts and areaOfACircle.ts, and the one the other
// two feed: a prism's volume is the area of its cross-section times its
// length, and that area is a rectangle, a triangle or a circle. Its comparison
// cards point back at both, mirrored there.
//
// The coded traps are things you can only do to a picture:
// `assume_the_solid_is_a_full_cuboid` (multiplying three lengths whatever the
// solid), `use_the_slant_edge_as_a_height`, `read_the_isometric_dimensions_wrongly`,
// and `confuse_volume_and_area` / `3d_instead_of_2d`, which is stopping at the
// area of the face. So every method starts by naming the cross-section, and the
// triangular prism is drawn with both its slanted edge and its perpendicular
// height labelled, for the student to choose between.
//
// The scale-factor traps on AQA Higher (`scale_factor_not_cubed`,
// `linear_vs_volume_sf`) belong to similarity, not here, and are left out.
//
// Routes, because the first move differs: find the cross-section's area, find a
// circle's area, or divide a given volume by the area.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const volumeOfAPrismBriefing: SkillBriefing = {
  skillId: 'volume_of_a_prism',

  summary:
    'The space inside a solid that is the same shape all the way through: the area of its end '
    + 'face times its length.',

  recognise: [
    {
      text: 'A solid with the same shape all the way through — a triangular prism, a cuboid, a '
        + 'cylinder — and the word "volume".',
      example: 'Work out the volume of the prism.',
      figure: prism({
        kind: 'triangular', labels: ['8 cm', '5 cm', '6.4 cm', '12 cm'],
        alt: 'A triangular prism. The triangle at the front has a base of 8 cm, a perpendicular '
          + 'height of 5 cm drawn dashed, and a slanted side of 6.4 cm. The prism is 12 cm long.',
      }),
    },
    {
      text: 'A cuboid, which is a prism whose end face is a rectangle.',
      example: 'Work out the volume of the cuboid.',
      figure: prism({
        kind: 'cuboid', labels: ['7 cm', '3 cm', '5 cm'],
        alt: 'A cuboid 7 cm across the front, 3 cm high and 5 cm long going back.',
      }),
    },
    {
      text: 'A cylinder — a tin, a pipe, a tank — which is a prism whose end face is a circle.',
      example: 'A cylindrical tank has a radius of 6 m.',
      figure: prism({
        kind: 'cylinder', labels: ['6 m', '4 m'],
        alt: 'A cylinder standing upright, with a radius of 6 m marked on the top face and a '
          + 'height of 4 m.',
      }),
    },
    {
      text: 'The volume given and a length missing — or how many small boxes fit inside a big one.',
      example: 'The volume of the box is 360 cm³.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in areasOfSquaresAndRectangles.ts.
      skillId: 'areas_of_squares_and_rectangles',
      thisOne: 'A solid: the area of the end face multiplied by the length, and the answer in cube '
        + 'units.',
      theOther: 'A flat shape: two lengths multiplied, and the answer in square units.',
      ask: 'Is the shape flat, or does it have a length running back?',
      pair: {
        thisOne: 'A cuboid is 6 cm by 4 cm by 10 cm. Work out its volume.',
        theOther: 'A rectangle is 6 cm by 4 cm. Work out its area.',
      },
    },
    {
      // Mirror of the entry in areaOfACircle.ts.
      skillId: 'area_of_a_circle',
      thisOne: 'A cylinder, where the circle\'s area is only the first step and is multiplied by '
        + 'the height.',
      theOther: 'A flat circle, where the area is the whole answer.',
      ask: 'Is it a flat circle, or the end of a solid?',
      pair: {
        thisOne: 'A cylinder has a radius of 4 cm and a height of 10 cm. Work out its volume.',
        theOther: 'A circle has a radius of 4 cm. Work out its area.',
      },
    },
  ],

  examples: [
    {
      stem: 'The diagram shows a triangular prism. Work out its volume.',
      isThisSkill: true,
      figure: prism({
        kind: 'triangular', labels: ['10 cm', '6 cm', '7.8 cm', '15 cm'],
        alt: 'A triangular prism. The triangle at the front has a base of 10 cm, a perpendicular '
          + 'height of 6 cm drawn dashed, and a slanted side of 7.8 cm. The prism is 15 cm long.',
      }),
      worked: [
        'The end face is a triangle, so its area is ½ × base × perpendicular height',
        '½ × 10 × 6 = 30 cm² — using the 6 cm height, not the slanted 7.8 cm',
        'Volume = 30 × 15 = 450 cm³',
      ],
      cue: 'The same triangle all the way through, so it is a prism. The work is all in the area of '
        + 'that triangle.',
    },
    {
      stem: 'A cuboid is 8 cm long, 5 cm wide and 3 cm high. Work out its volume.',
      isThisSkill: true,
      worked: [
        'The end face is a 5 cm by 3 cm rectangle: 5 × 3 = 15 cm²',
        'Volume = 15 × 8 = 120 cm³',
      ],
      cue: 'Three lengths and the word "volume". A cuboid is a prism with a rectangle for its end.',
    },
    {
      stem: 'A cylinder has a radius of 5 cm and a height of 8 cm. Work out its volume. Give your '
        + 'answer to 1 decimal place.',
      isThisSkill: true,
      worked: [
        'The end face is a circle: π × 5² = 25π',
        'Volume = 25π × 8 = 200π',
        '= 628.3 cm³, using the π button',
      ],
      cue: 'A cylinder is a prism with a circle for its end, so it is circle area × height.',
    },
    {
      stem: 'Work out the area of a rectangle 8 cm long and 5 cm wide.',
      isThisSkill: false,
      actuallySkillId: 'areas_of_squares_and_rectangles',
      cue: 'Flat, with two lengths. It is an area in cm², not a volume.',
    },
    {
      stem: 'The end of a cylinder is a circle of radius 5 cm. Work out the area of the end.',
      isThisSkill: false,
      actuallySkillId: 'area_of_a_circle',
      cue: 'A cylinder is mentioned, but the question stops at the circle on its end. That is an '
        + 'area, and the first step of a volume rather than a volume.',
    },
  ],

  routes: [
    {
      name: 'A prism with its end face drawn',
      when: 'A solid that is the same shape all the way through, with its lengths labelled.',
      example: 'A triangular prism has a triangular end with base 12 cm and perpendicular height '
        + '5 cm, and is 20 cm long. Work out its volume.',
      figure: prism({
        kind: 'triangular', labels: ['12 cm', '5 cm', '7.8 cm', '20 cm'],
        alt: 'A triangular prism whose triangular end has a base of 12 cm, a perpendicular height '
          + 'of 5 cm drawn dashed, and a slanted side of 7.8 cm. It is 20 cm long.',
      }),
      steps: [
        {
          do: 'Find the end face — the cross-section that is the same all the way through.',
          because:
            'Every prism is that face repeated back along its length, so the face decides the '
            + 'whole calculation.',
          watch:
            'Treating every solid as a cuboid and multiplying three lengths. For a triangular '
            + 'prism that counts twice the space.',
          example: 'The end face is a triangle',
        },
        {
          do: 'Work out the area of that face, using the perpendicular height, not a slanted edge.',
          because:
            'The area of a triangle is ½ × base × height, where the height is measured at right '
            + 'angles to the base.',
          watch:
            'Using the slanted side, 7.8 cm, as the height. It is longer than the true height, so '
            + 'the volume comes out too big.',
          example: '½ × 12 × 5 = 30 cm²',
        },
        {
          do: 'Multiply the area of the face by the length of the prism.',
          because:
            'The face is repeated slice after slice along the length, and area × length counts '
            + 'every slice.',
          watch:
            'Stopping at the area of the face, or giving the volume in cm². A volume is in cube '
            + 'units, cm³.',
          example: '30 × 20 = 600 cm³',
        },
      ],
    },
    {
      name: 'A cylinder',
      when: 'A tin, a pipe or a tank — a circle all the way through.',
      example: 'A cylinder has a radius of 3 cm and a height of 10 cm. Work out its volume to 1 '
        + 'decimal place.',
      figure: prism({
        kind: 'cylinder', labels: ['3 cm', '10 cm'],
        alt: 'A cylinder standing upright, with a radius of 3 cm marked on the top face and a '
          + 'height of 10 cm.',
      }),
      steps: [
        {
          do: 'Work out the area of the circular end: π × radius².',
          because: 'A cylinder is a prism whose face is a circle. Same method, different face.',
          watch: 'Using the diameter. If the length drawn goes right across, halve it first.',
          example: 'π × 3² = 9π',
        },
        {
          do: 'Multiply by the height, using the π button, and round at the end.',
          because: 'Area of the face × length, exactly as for any other prism.',
          watch:
            'Using 3.14 for π. Here it gives 282.6 instead of 282.7, and the mark is for the right '
            + 'last digit.',
          example: '9π × 10 = 90π = 282.7 cm³',
        },
      ],
    },
    {
      name: 'The volume given, a length missing',
      when: 'The volume is known and one length is what is missing.',
      example: 'A cuboid has a volume of 360 cm³. Its end face is 6 cm by 5 cm. Work out its length.',
      steps: [
        {
          do: 'Work out the area of the end face from the lengths you have.',
          because: 'Volume = area of the face × length, so the area is what the volume is divided by.',
          watch: 'Dividing the volume by just one of the end lengths.',
          example: '6 × 5 = 30 cm²',
        },
        {
          do: 'Divide the volume by that area.',
          because: 'Division undoes the multiplication, which leaves the length on its own.',
          watch: 'Giving the answer in cm³. A length is in plain cm.',
          example: '360 ÷ 30 = 12 cm',
        },
      ],
    },
  ],

  check: [
    'Are the units cubed? A volume is in cm³ or m³. Square units mean you have found the area of '
      + 'one face.',
    'For a triangle, did you use the perpendicular height? A slanted side is always longer, so it '
      + 'makes the volume too big.',
    'Working backwards? Multiply your length by the area of the end face. It should give back the '
      + 'volume.',
  ],

  higher: {
    note: {
      text: 'On Higher the solid is often two prisms joined together, and the answer is often '
        + 'wanted in terms of π.',
      example: 'The solid is made from a cuboid and a half-cylinder.',
    },

    recognise: [
      {
        text: 'Two solids joined, and the volume of the whole thing.',
        example: 'A cylinder stands on top of a cuboid.',
      },
    ],

    examples: [
      {
        stem: 'A cylinder has a diameter of 10 cm and a height of 6 cm. Work out its volume, giving '
          + 'your answer in terms of π.',
        isThisSkill: true,
        worked: [
          'Radius = 10 ÷ 2 = 5 cm',
          'Volume = π × 5² × 6 = 150π cm³',
        ],
        cue: 'A diameter and "in terms of π" — halve it, and keep π as π.',
      },
    ],

    routes: [
      {
        name: 'A solid made of two prisms',
        when: 'Two simpler solids joined — an L-shaped beam, a cylinder on a cuboid.',
        example: 'A cylinder of radius 2 cm and height 5 cm stands on a cuboid 10 cm by 4 cm by '
          + '3 cm. Work out the total volume in terms of π.',
        steps: [
          {
            do: 'Split the solid into prisms you know, and work out each volume.',
            because: 'Volumes add, just as areas do.',
            watch: 'Treating the whole solid as one cuboid, or missing the part that is hidden.',
            example: 'Cuboid: 10 × 4 × 3 = 120; cylinder: π × 2² × 5 = 20π',
          },
          {
            do: 'Add the volumes, keeping π separate if the answer is in terms of π.',
            because: '120 has no π in it and 20π does, so they cannot be combined into one term.',
            watch: 'Writing 140π. Only terms that both contain π can be added together.',
            example: 'Total volume = 120 + 20π cm³',
          },
        ],
      },
    ],

    check: [
      'In terms of π: have you combined only the terms that both contain π?',
    ],
  },
}
