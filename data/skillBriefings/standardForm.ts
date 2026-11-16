import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Standard form — twenty-second authored briefing, written with
// simplifyingIndices.ts as a pair. Both clear the four-part evidence bar on
// ALL EIGHT board/tier slices, which no other unbriefed skill does, and both
// are set on every board. It is also the worst-performing well-practised skill
// on the site.
//
// The coded traps split cleanly in two, and the page is built on that split.
//
// The FORM: `mantissa_not_normalised`, `answer_not_in_standard_form`,
// `standard_form_format`, `digit_only_no_magnitude`. The value is right and
// the shape is wrong, which loses the last mark on a question the student
// could do.
//
// The DIRECTION: `negative_index_direction`, `sign_of_the_index_not_reversed`,
// `wrong_power_of_ten`, `power_of_ten_placement`, `negative_power_handling`.
// A negative index means a small number, and the sign is where it goes wrong.
//
// Routes, unlike simplifyingIndices.ts. Putting a number INTO standard form,
// reading one back OUT of it, and calculating with two of them have three
// different first moves — move the point, read the index, split the fronts
// from the powers — and threading them through one list would make every step
// start by asking which question you are on.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const standardFormBriefing: SkillBriefing = {
  skillId: 'standard_form',

  summary:
    'A number written as something between 1 and 10 times a power of ten — writing it, reading '
    + 'it, and calculating without losing the form.',

  recognise: [
    {
      text: 'The words "standard form", on the answer line or in the question itself.',
      example: 'Give your answer in standard form.',
    },
    {
      text: 'A number far too long to be meant literally — a string of zeros either before or '
        + 'after the digits.',
      example: 'Write 0.000 000 45 in standard form.',
    },
    {
      text: 'A value already in standard form, with the question asking for it written out in full.',
      example: 'Write 3.2 × 10⁻⁴ as an ordinary number.',
    },
    {
      text: 'Two numbers in standard form with an operation between them, and the answer wanted '
        + 'in standard form as well.',
      // Not the numbers the drill below asks about.
      example: '(5 × 10⁷) ÷ (2 × 10²)',
    },

  ],

  confusableWith: [
    {
      // Mirror of the entry in simplifyingIndices.ts — same distinction, other
      // side. The index law is the same one; what differs is that this skill
      // also has a form to land in.
      skillId: 'simplifying_indices',
      thisOne: 'The base is always 10, and the answer has to come back as a number between 1 and '
        + '10 times a power of ten.',
      theOther: 'The base can be anything, and the answer is a single tidy power.',
      ask: 'Is the base 10 with a size to report, or just a power to tidy up?',
      pair: {
        thisOne: 'Work out (3 × 10⁴) × (2 × 10⁵), giving your answer in standard form.',
        theOther: 'Simplify 3⁴ × 3⁵, giving your answer as a single power of 3.',
      },
    },
    {
      skillId: 'significant_figures',
      thisOne: 'The instruction is about the SHAPE of the answer: one digit before the point, '
        + 'times a power of ten.',
      theOther: 'The instruction is about the PRECISION of the answer: how many digits to keep.',
      ask: 'Am I being told what the number should look like, or how many digits to round it to?',
      pair: {
        thisOne: 'Write 0.000417 in standard form.',
        theOther: 'Write 0.000417 correct to 2 significant figures.',
      },
    },
  ],

  examples: [
    {
      stem: 'Write 0.00062 in standard form.',
      isThisSkill: true,
      worked: [
        'The point goes just after the first non-zero digit, giving 6.2',
        'It moved 4 places, and the number is less than 1, so the index is −4',
        '6.2 × 10⁻⁴',
      ],
      cue: 'A long string of zeros and nothing else to do with them. The only decisions are where '
        + 'the point goes and which way the index points.',
    },
    {
      stem: 'Work out (6 × 10⁵) × (4 × 10³). Give your answer in standard form.',
      isThisSkill: true,
      worked: [
        '6 × 4 = 24, and 10⁵ × 10³ = 10⁸, giving 24 × 10⁸',
        '24 is not between 1 and 10, so write it as 2.4 × 10',
        '2.4 × 10 × 10⁸ = 2.4 × 10⁹',
      ],
      cue: 'Two numbers in standard form, multiplied. The arithmetic is easy; the mark at the end '
        + 'is for putting the answer back into the form.',
    },
    {
      stem: 'Write 5.3 × 10⁻³ as an ordinary number.',
      isThisSkill: true,
      worked: [
        'The index is −3, so the number is small and the point moves 3 places',
        '0.0053',
      ],
      cue: 'The same skill read backwards. The index is an instruction for the point, and its '
        + 'sign says which way.',
    },
    {
      stem: 'Write 0.004836 correct to 2 significant figures.',
      isThisSkill: false,
      actuallySkillId: 'significant_figures',
      cue: 'The same kind of number, but the instruction is about how many digits survive, not '
        + 'about the shape of the answer. It stays an ordinary number.',
    },
    {
      stem: 'Simplify 2⁷ × 2³, giving your answer as a single power of 2.',
      isThisSkill: false,
      actuallySkillId: 'simplifying_indices',
      cue: 'The index law is the same one, but the base is 2 and the answer is a power. There is '
        + 'no size to report and no form to land in.',
    },
  ],

  routes: [
    {
      name: 'An ordinary number to put into standard form',
      when: 'A long number, large or small, and "in standard form" on the answer line.',
      example: 'Write 0.00062 in standard form.',
      steps: [
        {
          do: 'Put the decimal point straight after the first non-zero digit.',
          because:
            'Standard form allows exactly one digit in front of the point, so where it goes is '
            + 'fixed. There is no choice to make and nothing to decide.',
          watch:
            'Stopping on a front number that is not between 1 and 10. 62 × 10⁻⁵ is the right '
            + 'size, but it is not standard form and does not score.',
          example: '0.00062 gives 6.2',
        },
        {
          do: 'Count how many places the point moved. That count is the index.',
          because:
            'Each place is one multiplication or division by 10, so counting the places IS '
            + 'working out the power.',
          watch:
            'Counting the zeros instead of the places. In 0.00062 the point moves 4 places, '
            + 'though there are only 3 zeros after it.',
          example: 'The point moved 4 places',
        },
        {
          do: 'Give the index a sign: negative for a number below 1, positive for a number above 10.',
          because:
            '10⁻⁴ means divided by 10 four times, which is exactly how a number smaller than 1 '
            + 'is built out of 6.2.',
          watch:
            'Getting the direction the wrong way round. If you started below 1 the index MUST be '
            + 'negative, whatever the arithmetic looked like.',
          example: '0.00062 is below 1, so 6.2 × 10⁻⁴',
        },
      ],
    },
    {
      name: 'A standard-form number to write out in full',
      when: 'A value already in standard form, and "as an ordinary number".',
      example: 'Write 5.3 × 10⁻³ as an ordinary number.',
      steps: [
        {
          do: 'Read the index as a number of places, and its sign as the direction to move.',
          because:
            'The index was only ever a count of places. Reading it back out is the first step run '
            + 'in reverse.',
          watch:
            'Reading a negative index as "subtract". It does not take anything away; it makes the '
            + 'number smaller.',
          example: 'The index is −3, so 3 places, making it smaller',
        },
        {
          do: 'Move the point that many places and fill the gap with zeros.',
          because:
            'The zeros are place holders, not extra digits. They are there so the 5 and the 3 '
            + 'land in the right columns.',
          watch:
            'Writing one zero too few. Count the places you move, not the zeros you have typed.',
          example: '5.3 becomes 0.0053',
        },
      ],
    },
    {
      name: 'Two standard-form numbers to calculate with',
      when: 'A × or ÷ between two values in standard form, with the answer wanted in standard form.',
      example: 'Work out (6 × 10⁵) × (4 × 10³), giving your answer in standard form.',
      steps: [
        {
          do: 'Take the two front numbers together, and the two powers of ten together.',
          because:
            'Multiplication can be done in any order, so (6 × 10⁵) × (4 × 10³) is (6 × 4) with '
            + '(10⁵ × 10³) beside it. The powers then follow the ordinary index laws — '
            + 'multiplying adds the indices, dividing subtracts them.',
          watch:
            'Doing to the indices whatever is being done to the numbers. Multiplying powers of '
            + 'ten ADDS them: 10⁵ × 10³ is 10⁸, not 10¹⁵.',
          example: '6 × 4 = 24, and 10⁵ × 10³ = 10⁸ — a division would give 10⁵ ÷ 10³ = 10²',
        },
        {
          do: 'Check the front number is still between 1 and 10, and fix it if it is not.',
          because:
            'Rewriting the front number changes the index to match, because the two together have '
            + 'to keep the same value.',
          watch:
            'Handing in 24 × 10⁸. The value is right and the form is not, and the form is what '
            + 'the last mark is for.',
          example: '24 = 2.4 × 10, so 24 × 10⁸ becomes 2.4 × 10⁹',
        },
        {
          do: 'For adding or subtracting instead, write both as ordinary numbers first.',
          because:
            'There is no index law for + and −. 10⁵ + 10³ is not 10⁸, and no rearranging makes it '
            + 'one.',
          watch:
            'Adding the front numbers and leaving the powers alone, which treats 10⁵ and 10³ as '
            + 'if they were the same size.',
          example: 'If it were + instead: 600000 + 4000 = 604000 = 6.04 × 10⁵',
        },
      ],
    },
  ],

  check: [
    'Is the front number between 1 and 10? 24 × 10⁸ and 0.4 × 10⁵ are both the right value in '
      + 'the wrong form, and both lose the mark.',
    'Does the sign of the index match the size of the number? Below 1 is negative, above 10 is '
      + 'positive, and a number already between 1 and 10 needs no power of ten at all.',
    'If the question asked for an ordinary number, is that what you have written? An answer left '
      + 'in standard form has not answered it.',
  ],

  higher: {
    note: {
      text: 'On Higher the two numbers are often divided rather than multiplied, and one of the '
        + 'indices is negative — which is where the signs start to fight.',
      example: 'Work out (9 × 10⁴) ÷ (3 × 10⁻²).',
    },

    recognise: [
      {
        text: 'A division, or a negative index on one side. Subtracting a negative index is where '
          + 'the marks go.',
        // Not the numbers the drill below asks about, which it would otherwise
        // answer before the question is put.
        example: 'Work out (1.5 × 10⁶) ÷ (5 × 10⁻²).',
      },
      {
        text: 'Standard form inside a longer question — a rate, a density, an area — where it is '
          + 'the numbers rather than the task.',
        example: 'The mass is 4.2 × 10⁻³ kg and the volume is 7 × 10⁻⁶ m³.',
      },
    ],

    examples: [
      {
        stem: 'Work out (8 × 10⁵) ÷ (2 × 10⁻³), giving your answer in standard form.',
        isThisSkill: true,
        worked: [
          'The front numbers divide: 8 ÷ 2 = 4',
          'Dividing the powers subtracts the indices: 5 − (−3) = 5 + 3 = 8',
          '4 × 10⁸, which is already in standard form',
        ],
        cue: 'A division with a negative index. The subtraction and the negative sign are two '
          + 'different things, and they cancel into an addition.',
      },
    ],

    routes: [
      {
        name: 'One of the indices is negative',
        when: 'A negative index in the question, where subtracting it turns into adding.',
        example: 'Work out (8 × 10⁵) ÷ (2 × 10⁻³), giving your answer in standard form.',
        steps: [
          {
            do: 'Divide the front numbers, and subtract the second index from the first.',
            because:
              'Dividing powers of the same base subtracts the indices — the same law as for any '
              + 'other base, with 10 in the usual place.',
            watch:
              'Adding them out of habit, because the two numbers were multiplied the last time '
              + 'you saw this.',
            example: '8 ÷ 2 = 4, and the indices are 5 and −3',
          },
          {
            do: 'Work the subtraction out in full when the second index is negative.',
            because:
              'Subtracting a negative adds. The minus from the division and the minus in the '
              + 'index are two separate things, and only one of them is a sign.',
            watch:
              'Reading 5 − (−3) as 2. Written out it is 5 + 3, and the answer is eight powers of '
              + 'ten larger, not two.',
            example: '5 − (−3) = 8, giving 4 × 10⁸',
          },
        ],
      },
    ],

    check: [
      'Reverse it. Multiplying your answer by the number you divided by should give back the one '
        + 'you started with.',
      'If an index got smaller when you divided by a number below 1, check the signs: dividing by '
        + 'something small makes the answer BIGGER.',
    ],
  },
}
