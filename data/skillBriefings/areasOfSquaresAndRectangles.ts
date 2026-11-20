import type { SkillBriefing } from './types'
import { rectilinear } from '../../lib/skills/briefingFigures'

// ─────────────────────────────────────────────────────────────────────────────
// Areas of squares and rectangles — one of a mensuration batch written
// together with areaOfACircle.ts and volumeOfAPrism.ts. The three chain: a
// prism's volume is the area of its cross-section times its length, and a
// cylinder's cross-section is a circle. Written as one batch so the comparison
// cards between them resolve to pages at both ends.
//
// The coded traps are mostly one confusion, AREA FOR PERIMETER:
// `use_perimeter_not_area`, `perimeter_not_area`, `area_reasoning_for_perimeter`,
// and `add_dimensions_not_multiply` is the same thing seen from the arithmetic.
// `divide_by_the_wrong_side` is the question run backwards, and the shaded-region
// traps (`give_the_unshaded_percentage` and friends) are working out the wrong
// region. So the page splits by those three questions.
//
// Routes, because the first move differs: split the shape, take the hole away
// from the whole, or divide the area by the side you know. These are rarely
// asked bare — on AQA Foundation most coded parts are chained into something
// else, a cost or a percentage — which is why the cues lead with the shapes the
// questions are actually set on.
//
// Higher adds sides written as algebra, where the area makes an equation —
// often a quadratic — and `keep_negative_root` is the coded trap: a length
// cannot be negative.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const areasOfSquaresAndRectanglesBriefing: SkillBriefing = {
  skillId: 'areas_of_squares_and_rectangles',

  summary:
    'The space inside a rectangle, or a shape made of rectangles — and working back from an area to '
    + 'a missing side.',

  recognise: [
    {
      text: 'The word "area", or the space inside something — carpet, paint, tiles, grass to cover.',
      example: 'Work out the area of the rectangle.',
      figure: rectilinear({
        points: [[0, 0], [8, 0], [8, 5], [0, 5]],
        sides: { 0: '8 cm', 1: '5 cm' },
        alt: 'A rectangle 8 cm long and 5 cm tall.',
      }),
    },
    {
      text: 'An L-shape or step shape made of rectangles, often with one side length not given.',
      example: 'Work out the area of the shape.',
      figure: rectilinear({
        points: [[0, 0], [7, 0], [7, 7], [3, 7], [3, 3], [0, 3]],
        sides: { 0: '7 cm', 1: '7 cm', 3: '4 cm', 5: '3 cm' },
        alt: 'An L-shaped figure 7 cm along the bottom and 7 cm up the right-hand side, with a '
          + 'notch taken out of the top-left corner. The left side is 3 cm tall and the inside '
          + 'vertical edge is 4 cm.',
      }),
    },
    {
      text: 'A shaded region: a shape with a piece cut out of it, and the area of what is left.',
      example: 'Work out the area of the shaded region.',
      figure: rectilinear({
        points: [[0, 0], [10, 0], [10, 7], [0, 7]],
        sides: { 0: '10 m', 1: '7 m' },
        inner: { x: 3, y: 2, w: 4, h: 3, across: '4 m', down: '3 m' },
        shadeOuter: true,
        alt: 'A 10 m by 7 m rectangle, shaded, with an unshaded 4 m by 3 m rectangle inside it.',
      }),
    },
    {
      text: 'The area given and a side missing — the same question run backwards.',
      example: 'A rectangle has an area of 48 cm² and a width of 6 cm.',
    },
  ],

  confusableWith: [
    {
      skillId: 'lengths_and_perimeters',
      thisOne: 'The space INSIDE the shape — counted in squares, so the units are squared: cm².',
      theOther: 'The distance ROUND the edge — a length, so the units are plain: cm.',
      ask: 'Am I covering the inside, or going round the outside?',
      pair: {
        thisOne: 'A rectangular lawn is 8 m by 5 m. Work out the area of the lawn.',
        theOther: 'A rectangular lawn is 8 m by 5 m. Work out the length of fence needed to go round it.',
      },
    },
    {
      // Mirror of the entry in volumeOfAPrism.ts — same distinction, other side.
      skillId: 'volume_of_a_prism',
      thisOne: 'A flat shape: two lengths multiplied, and the answer in square units.',
      theOther: 'A solid: the area of the end face multiplied by the length, and the answer in cube '
        + 'units.',
      ask: 'Is the shape flat, or does it have a length running back?',
      pair: {
        thisOne: 'A rectangle is 6 cm by 4 cm. Work out its area.',
        theOther: 'A cuboid is 6 cm by 4 cm by 10 cm. Work out its volume.',
      },
    },
    {
      // Mirror of the entry in pythagorasTheorem.ts, which pointed here before
      // this page existed.
      skillId: 'pythagoras_theorem',
      thisOne: 'The lengths are given and the answer is an area — length times width.',
      theOther: 'The missing length is the answer, worked out from the other two sides.',
      ask: 'Am I filling a shape, or finding a length?',
      pair: {
        thisOne: 'A rectangle is 9 cm by 12 cm. Work out its area.',
        theOther: 'A rectangle is 9 cm by 12 cm. Work out the length of its diagonal.',
      },
    },
  ],

  examples: [
    {
      stem: 'A rectangle is 9 cm long and 4 cm wide. Work out its area.',
      isThisSkill: true,
      worked: [
        'Area = length × width',
        '9 × 4 = 36',
        '36 cm²',
      ],
      cue: 'Two sides of a rectangle and the word "area". The sides multiply, and the units come '
        + 'out squared.',
    },
    {
      stem: 'The diagram shows the plan of an L-shaped room. Work out its area.',
      isThisSkill: true,
      figure: rectilinear({
        points: [[0, 0], [10, 0], [10, 4], [4, 4], [4, 9], [0, 9]],
        sides: { 0: '10 m', 1: '4 m', 4: '4 m', 5: '9 m' },
        alt: 'An L-shaped plan 10 m along the bottom and 9 m up the left side. The right-hand side '
          + 'is 4 m tall and the top is 4 m wide; the inside edges are not labelled.',
      }),
      worked: [
        'The missing height on the right of the top part: 9 − 4 = 5 m',
        'Split into a 10 m by 4 m rectangle and a 4 m by 5 m one',
        '10 × 4 = 40 and 4 × 5 = 20',
        '40 + 20 = 60 m²',
      ],
      cue: 'Square corners all the way round, so it splits into rectangles. One side is missing and '
        + 'has to come from the others first.',
    },
    {
      stem: 'A rectangle has an area of 54 cm². Its width is 6 cm. Work out its length.',
      isThisSkill: true,
      worked: [
        'Length × width = area, so length × 6 = 54',
        'Length = 54 ÷ 6 = 9 cm',
      ],
      cue: 'The area is given and a side is missing. Same rule as working forwards, with the unknown '
        + 'in a different place.',
    },
    {
      stem: 'A rectangular garden is 12 m long and 7 m wide. Work out its perimeter.',
      isThisSkill: false,
      actuallySkillId: 'lengths_and_perimeters',
      cue: 'The same kind of rectangle, a different question. Perimeter is the distance round the '
        + 'edge, so the sides are added, not multiplied.',
    },
    {
      stem: 'A box is 10 cm long, 6 cm wide and 4 cm high. Work out its volume.',
      isThisSkill: false,
      actuallySkillId: 'volume_of_a_prism',
      cue: 'Three lengths, not two. It is a solid, so the answer is a volume in cm³.',
    },
  ],

  routes: [
    {
      name: 'A rectangle, or a shape made of rectangles',
      when: 'The sides are given and the area is what is missing.',
      example: 'An L-shaped room is drawn on a plan with its outside edges labelled. Work out its area.',
      figure: rectilinear({
        points: [[0, 0], [12, 0], [12, 5], [5, 5], [5, 8], [0, 8]],
        sides: { 0: '12 m', 1: '5 m', 4: '5 m', 5: '8 m' },
        alt: 'An L-shaped plan 12 m along the bottom and 8 m up the left side. The right-hand side '
          + 'is 5 m tall and the top is 5 m wide.',
      }),
      steps: [
        {
          do: 'Split the shape into rectangles by carrying on one of its inside edges.',
          because:
            'Area is quick to find for a rectangle. Any shape with square corners can be cut into '
            + 'rectangles, and their areas add up to the whole.',
          watch:
            'Cutting it into pieces whose sides you cannot work out. Choose the cut that leaves '
            + 'every piece with two sides you know.',
          example: 'Cut across at the inside corner: a 12 m by 5 m piece and one above it',
        },
        {
          do: 'Work out any side the plan leaves out, from the sides it does give.',
          because:
            'Opposite sides of the whole shape have to match. 8 m up the left, less the 5 m of the '
            + 'bottom piece, leaves 3 m for the piece above.',
          watch:
            'Taking the whole height as the height of the top piece — using the 8 m where 3 m '
            + 'belongs.',
          example: 'Top piece: 5 m wide and 8 − 5 = 3 m tall',
        },
        {
          do: 'Multiply length by width for each rectangle, then add the areas.',
          because:
            'A 12 m by 5 m rectangle holds 5 rows of 12 one-metre squares. That is why the sides '
            + 'multiply, and why the answer is in square metres.',
          watch:
            'Adding the sides instead of multiplying them. That gives the distance round the edge, '
            + 'which is the perimeter — a different question.',
          example: '12 × 5 = 60 and 5 × 3 = 15, so 60 + 15 = 75 m²',
        },
      ],
    },
    {
      name: 'A shaded region',
      when: 'A shape with a piece cut out of it, and the area of what is left.',
      example: 'A garden 12 m by 8 m has a 6 m by 4 m patio in it. Work out the area of the grass.',
      figure: rectilinear({
        points: [[0, 0], [12, 0], [12, 8], [0, 8]],
        sides: { 0: '12 m', 1: '8 m' },
        inner: { x: 3, y: 2, w: 6, h: 4, across: '6 m', down: '4 m' },
        shadeOuter: true,
        alt: 'A 12 m by 8 m garden, shaded, with an unshaded 6 m by 4 m patio inside it.',
      }),
      steps: [
        {
          do: 'Work out the area of the whole shape, as if nothing had been cut out.',
          because:
            'The shaded part is an awkward shape, but the whole and the piece cut out are both '
            + 'rectangles.',
          watch:
            'Trying to measure the shaded border strip by strip. It is slower, and the corners '
            + 'get counted twice.',
          example: '12 × 8 = 96 m²',
        },
        {
          do: 'Work out the area of the piece that has been cut out.',
          because: 'It is a rectangle in its own right, with its own two sides.',
          watch: 'Using the outside lengths for the inside piece.',
          example: '6 × 4 = 24 m²',
        },
        {
          do: 'Subtract: the whole shape take away the piece cut out.',
          because: 'What is left after the piece is removed is exactly the shaded region.',
          watch:
            'Giving the area of the piece cut out, or adding the two areas instead of '
            + 'subtracting.',
          example: '96 − 24 = 72 m²',
        },
      ],
    },
    {
      name: 'The area given, a side missing',
      when: 'An area and one side, and the other side to find.',
      example: 'A rectangle has an area of 72 cm² and a width of 8 cm. Work out its length.',
      steps: [
        {
          do: 'Write down what multiplies to make the area: length × width = area.',
          because:
            'It is the same rule as working forwards, with the missing number in a different place.',
          watch: 'Treating it as a perimeter question and halving or subtracting.',
          example: 'length × 8 = 72',
        },
        {
          do: 'Divide the area by the side you know.',
          because: 'Division undoes multiplication, which leaves the missing side on its own.',
          watch:
            'Giving the answer in cm². A side is a length, so it is in plain cm.',
          example: '72 ÷ 8 = 9 cm',
        },
      ],
    },
  ],

  check: [
    'Are the units squared? An area is in cm² or m². Plain cm means you have found a length — '
      + 'probably the perimeter.',
    'For a shape made of rectangles, the area must be less than the rectangle that fits round the '
      + 'whole shape. If it is more, a piece has been counted twice.',
    'Working backwards from an area? Multiply your answer by the side you were given. It should '
      + 'give back the area.',
  ],

  higher: {
    note: {
      text: 'On Higher the sides are often written as algebra and the area is given, so the area '
        + 'makes an equation — sometimes a quadratic.',
      example: 'The length is (2x + 1) cm and the width is x cm.',
    },

    recognise: [
      {
        text: 'Sides written as expressions in x, and a number for the area.',
        example: 'The area of the rectangle is 35 cm². Show that x² + 2x − 35 = 0.',
      },
    ],

    examples: [
      {
        stem: 'A rectangle has length (x + 4) cm and width x cm. Its area is 45 cm². Work out x.',
        isThisSkill: true,
        worked: [
          'x(x + 4) = 45, so x² + 4x − 45 = 0',
          '(x + 9)(x − 5) = 0, so x = −9 or x = 5',
          'A width cannot be negative, so x = 5',
        ],
        cue: 'The area is a number and the sides are algebra, so area = length × width is an '
          + 'equation to solve.',
      },
    ],

    routes: [
      {
        name: 'The sides are expressions',
        when: 'Sides such as x + 3, and the area given as a number.',
        example: 'A rectangle has sides (x + 2) cm and (x + 5) cm, and an area of 40 cm². Work out x.',
        steps: [
          {
            do: 'Multiply the two sides and set the result equal to the area.',
            because: 'Length × width = area is still the rule; the sides just happen to be algebra.',
            watch: 'Adding the two expressions, which gives half the perimeter, not the area.',
            example: '(x + 2)(x + 5) = 40',
          },
          {
            do: 'Expand, rearrange so one side is zero, and solve.',
            because: 'A quadratic is solved by factorising once everything is on one side.',
            watch: 'Solving before subtracting the 40, so the equation is not equal to zero.',
            example: 'x² + 7x − 30 = 0, so (x + 10)(x − 3) = 0',
          },
          {
            do: 'Reject any solution that makes a side zero or negative.',
            because:
              'Both solutions satisfy the equation, but only one describes a rectangle you could '
              + 'draw.',
            watch: 'Giving both answers, or keeping the negative one.',
            example: 'x = −10 makes a side −8 cm, so x = 3',
          },
        ],
      },
    ],

    check: [
      'Put your value of x back into the sides. Both must be positive, and they must multiply to '
        + 'the area you were given.',
    ],
  },
}
