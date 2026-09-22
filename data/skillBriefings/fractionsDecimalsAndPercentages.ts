import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Fractions, decimals and percentages — eighth authored briefing, and the
// middle of the fractions and percentages cluster.
//
// More often signposted than its neighbours (AQA Foundation codes a large bare
// share: "write these in order", "write 3/8 as a percentage"), so recognition
// is mostly about the word problems — the "what percentage of…" questions that
// look like percentage change or a fraction of an amount.
//
// The coded traps split two ways. Form errors: `percent_decimal_place_shift`,
// `stop_before_converting_to_a_percentage`, `answer_in_the_wrong_form`,
// `compare_unlike_forms`. And base errors: `denominator_is_the_part_not_the_total`,
// `percent_of_the_wrong_total`, `give_the_complement` / `answer_the_complement`.
// On Higher `percent_of_a_percent` recurs, which gets its own step.
//
// `reverse_percentage` is Higher-only in courses.ts, so that comparison sits in
// the higher block, as it does in percentageChange.ts.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const fractionsDecimalsAndPercentagesBriefing: SkillBriefing = {
  skillId: 'fractions_decimals_and_percentages',

  summary:
    'Three ways of writing the same share — moving between them to compare, order, or say what part of a whole something is.',

  recognise: [
    {
      text: 'Fractions, decimals and percentages side by side in one list, to be ordered or compared.',
      example: 'Write these in order of size: 0.35, 3/8, 36%, 1/3',
    },
    {
      text: '"What fraction of…" or "what percentage of…" with both amounts given. The answer is the share itself.',
      example: 'What percentage of the 250 tickets were sold online?',
    },
    {
      text: 'An answer line that names the form the answer must be in.',
      example: 'Give your answer as a fraction in its simplest form.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in fractionsOfAmounts.ts — same distinction, other side.
      skillId: 'fractions_of_amounts',
      thisOne: 'You are given the amounts, and the answer is the fraction or percentage itself.',
      theOther: 'You are given the fraction, and the answer is an amount — pounds, people, sweets.',
      ask: 'Is the fraction something I have been given, or the thing I am being asked to find?',
    },
    {
      skillId: 'percentage_change',
      thisOne: 'A part of a whole at one moment — 14 of the 40 cars are red.',
      theOther: 'One amount turning into another — a before and an after.',
      ask: 'Is this a part of a whole, or something that has changed from one value to another?',
    },
  ],

  // The two car-park stems are a deliberate pair: same setting, same total, and
  // the only difference is which of the fraction and the amount is given.
  examples: [
    {
      stem: 'Write these numbers in order, starting with the smallest: 0.6, 5/8, 58%, 2/3',
      isThisSkill: true,
      cue: 'Four numbers in three different forms, to be compared. Put them all in one form first.',
    },
    {
      stem: 'There are 40 cars in a car park. 14 of the cars are red. '
        + 'What percentage of the cars are red?',
      isThisSkill: true,
      cue: 'Both amounts are given, and the answer is the share: 14 out of 40, as a percentage.',
    },
    {
      stem: 'There are 40 cars in a car park. 3/8 of the cars are red. '
        + 'Work out how many of the cars are red.',
      isThisSkill: false,
      actuallySkillId: 'fractions_of_amounts',
      cue: 'The fraction is given and the answer is a number of cars. This takes a fraction OF the '
        + 'total rather than making one.',
    },
    {
      stem: 'A car cost £12000 when new. Two years later it is worth £9000. '
        + 'Work out the percentage decrease in its value.',
      isThisSkill: false,
      actuallySkillId: 'percentage_change',
      cue: 'A before and an after. £9000 is not a part of the £12000 — it is what the £12000 turned '
        + 'into, and the percentage wanted is the change.',
    },
  ],

  steps: [
    {
      do: 'To compare or order, turn every number into the same form. Decimals are usually easiest.',
      because:
        'You cannot reliably judge 5/8 against 58% by eye. As 0.625 and 0.58 it is obvious.',
      watch:
        'Moving the decimal point the wrong way. 58% is 0.58, not 5.8 — and 5% is 0.05, not 0.5.',
    },
    {
      do: 'For "what fraction of" or "what percentage of", write the part over the whole as a fraction first.',
      because:
        'The fraction IS the share. Turning it into a percentage is one more step — multiply by 100 — '
        + 'once the fraction is right.',
      watch:
        'Putting the wrong number on the bottom. The denominator is the WHOLE — all 40 cars — not '
        + 'the other group, the 26 that are not red.',
    },
    {
      do: 'Give the answer in the form the question asks for, and simplify a fraction fully.',
      because:
        'The answer line decides the form. 14/40 is correct but not finished when it says "simplest '
        + 'form" — that is 7/20.',
      watch:
        'Stopping one step short, like leaving 0.35 when the question asked for a percentage. '
        + 'Or answering for the group the question did not ask about.',
    },
  ],

  check: [
    'Is the share a sensible size? 14 out of 40 is a bit over a third, so 35% is believable and 3.5% is not.',
    'Does your group and the rest make 100%? If 35% are red, 65% are not — a quick way to catch '
      + 'answering for the wrong group.',
    'If you ordered a list, have you written the ORIGINAL numbers in order, not the decimals you '
      + 'turned them into?',
  ],

  higher: {
    note: {
      text: 'On Higher the share is usually part of a bigger problem — a percentage of a percentage, '
        + 'or a share read off a table or a tree diagram.',
      example: '40% of the students are boys. 25% of the boys wear glasses.',
    },

    recognise: [
      {
        text: 'One percentage taken of a group that is itself only part of the whole.',
        example: '… and 30% of those who stayed chose the bus.',
      },
    ],

    confusableWith: [
      {
        skillId: 'reverse_percentage',
        thisOne: 'You know the part AND the whole, and the percentage is what you are finding.',
        theOther: 'You know the percentage and the part, and the whole is what is missing.',
        ask: 'Of the part, the whole and the percentage, which one have I not been given?',
      },
    ],

    examples: [
      {
        stem: '60% of the members of a club are adults. 45% of the adults are women. '
          + 'What percentage of the members of the club are adult women?',
        isThisSkill: true,
        cue: 'A percentage of a percentage. The 45% is of the adults, not of the whole club.',
      },
    ],

    steps: [
      {
        do: 'When one percentage is OF another group, multiply them as decimals: 45% of 60% is 0.45 × 0.6.',
        because:
          'The second percentage is a share of a share, so it has to shrink. Multiplying does that '
          + 'automatically.',
        watch:
          'Adding or subtracting the percentages, or treating the second one as a share of the '
          + 'whole. 45% of the adults is not 45% of the club.',
      },
    ],

    check: [
      'A share of a share is smaller than both. If your answer is bigger than either percentage '
        + 'you started with, you added instead of multiplying.',
    ],
  },
}
