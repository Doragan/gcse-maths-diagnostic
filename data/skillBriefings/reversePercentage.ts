import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Reverse percentage — ninth authored briefing, and the one that closes the
// percentage comparisons: `percentage_change` has pointed here from its Higher
// block since it was written.
//
// The method lives in the SHARED block, which matches the tier lists: the skill
// moved to Foundation on 2026-09-22, on the coded evidence of five Foundation
// parts across all three boards (see the citation in courses.ts). It is still
// late-paper stretch content, and below the four-part evidence bar on any single
// board, so the audit panel stays suppressed on Foundation and the page shows
// the authored briefing alone.
//
// The coded traps are all the same error, going forwards when the question goes
// backwards: `forward_percentage_instead_of_reverse`,
// `add_fifty_percent_to_the_given_value`, `subtract_the_percentage_from_the_new_price`,
// `multiply_not_divide`, `divide_by_the_wrong_multiplier`. The method leads on
// naming the given amount as a percentage of the original, and the self-check is
// running the answer forwards.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const reversePercentageBriefing: SkillBriefing = {
  skillId: 'reverse_percentage',

  summary:
    'Working back to the original amount, when you are given what it became after a percentage change.',

  recognise: [
    {
      text: 'The amount you are given has already had the percentage applied — the sale price, the '
        + 'price including VAT, the value after the rise.',
      example: 'In a sale, a jacket costs £68. This is 15% less than its usual price.',
    },
    {
      text: 'The question asks for the price "before", the "original" or "usual" price, or what something was last year.',
      example: 'Work out the price before the reduction.',
    },
    {
      text: 'A percentage of an unknown total, where the part is given and the total is missing.',
      example: '35% of the audience were children. There were 126 children.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in percentageChange.ts — same distinction, other side.
      skillId: 'percentage_change',
      thisOne: 'You have the amount AFTER the change and work backwards to what it started as.',
      theOther: 'You have the amount BEFORE the change and work forwards to what it becomes.',
      ask: 'Is the number I have been given the original, or the one that has already changed?',
    },
    {
      // Mirror of the Higher entry in fractionsDecimalsAndPercentages.ts.
      skillId: 'fractions_decimals_and_percentages',
      thisOne: 'You know the percentage and the part, and the whole is what is missing.',
      theOther: 'You know the part AND the whole, and the percentage is what you are finding.',
      ask: 'Of the part, the whole and the percentage, which one have I not been given?',
    },
  ],

  // The jacket and the audience stems each reappear as a near-miss with the
  // missing value swapped, so the student sees the same numbers from both sides.
  examples: [
    {
      stem: 'A TV costs £504 including VAT at 20%. Work out the cost of the TV before VAT was added.',
      isThisSkill: true,
      cue: '£504 already has the VAT in it, so it is 120% of the price you want.',
    },
    {
      stem: 'A car has lost 35% of its value since it was bought. It is now worth £7,800. '
        + 'Work out how much the car was worth when it was bought.',
      isThisSkill: true,
      cue: '"Now worth" is the after. The car kept 65% of its value, so £7,800 is 65% of the original.',
    },
    {
      stem: 'A jacket usually costs £80. In a sale its price is reduced by 15%. Work out the sale price.',
      isThisSkill: false,
      actuallySkillId: 'percentage_change',
      cue: 'The £80 is the original. You are given the before and asked for the after — that is forwards.',
    },
    {
      stem: 'A concert had an audience of 360. 126 of the audience were children. '
        + 'What percentage of the audience were children?',
      isThisSkill: false,
      actuallySkillId: 'fractions_decimals_and_percentages',
      cue: 'The part and the whole are both given. The percentage is what is missing, not the total.',
    },
  ],

  steps: [
    {
      do: 'Say what percentage of the original the amount you have been given is: after a 15% cut it is '
        + '85%; with 20% VAT added it is 120%.',
      because:
        'The original is always 100%. Naming the given amount as a percentage of it is most of the '
        + 'problem — what is left is one division.',
      watch:
        'Using the change instead of what is left. After a 15% cut, the £68 is 85% of the usual price, '
        + 'not 15% of it.',
    },
    {
      do: 'Divide the amount you were given by that percentage as a decimal: £68 ÷ 0.85. Without a '
        + 'calculator, find 1% first (£68 ÷ 85) and multiply by 100.',
      because:
        'Going forwards is × 0.85, so going back is ÷ 0.85. Both routes give £80, and both are what '
        + 'the mark scheme credits.',
      watch:
        'Adding the 15% back on. 15% of £68 added to £68 is £78.20, not £80 — the 15% was of the '
        + 'original, which is a bigger number than £68.',
    },
    {
      do: 'Check whether the question wants the original amount or the change — the price before VAT, '
        + 'or the VAT itself.',
      because:
        'Once you have the original, the change is a subtraction: £504 − £420 is £84 of VAT.',
      watch:
        'Taking 20% of the price you were given. 20% of £504 is £100.80, which is not the VAT — the '
        + '20% was of £420.',
    },
  ],

  check: [
    'Run it forwards. £80 reduced by 15% should give back exactly £68. If it does not, the original is wrong.',
    'Is the original on the right side? Before a decrease it must be BIGGER than what you were given; '
      + 'before an increase, smaller.',
  ],

  higher: {
    note: {
      text: 'On Higher the change is often stacked — two percentage changes one after the other — or the '
        + 'numbers come in standard form. Going backwards is still a single division.',
      example: 'After a 10% rise and then a 10% fall, the price is £495.',
    },

    recognise: [
      {
        text: 'Two or more changes applied in turn, and only the final amount is given.',
        example: 'Its value rose by 25% in the first year and fell by 8% in the second.',
      },
    ],

    examples: [
      {
        stem: 'The price of a bike is increased by 25%. Later, the new price is reduced by 20%. '
          + 'The bike now costs £300. Work out the original price of the bike.',
        isThisSkill: true,
        cue: 'Only the final price is given, after two changes. Combine the multipliers first: '
          + '1.25 × 0.8 = 1, so the price has not moved at all.',
      },
    ],

    steps: [
      {
        do: 'Multiply together the multipliers for every change, then divide once by the result.',
        because:
          'Changes in a row combine by multiplying — a 10% rise then a 10% fall is × 1.1 × 0.9 = × 0.99 — '
          + 'so one division undoes them all.',
        watch:
          'Adding the percentages. +25% then −20% is not +5%: the multipliers give 1.25 × 0.8 = 1, '
          + 'which is no change at all.',
      },
    ],

    check: [
      'Run every change forwards from your answer, in order, and check you land exactly on the amount '
        + 'you were given.',
      'If the question uses standard form, give the answer in standard form. That final mark is easy to lose.',
    ],
  },
}
