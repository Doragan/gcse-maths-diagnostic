import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Growth and decay — sixth authored briefing, and the one where the tiers are
// least alike.
//
// Foundation evidence is THIN: three coded parts across 30 papers, below the
// four-part bar, so the exam panel suppresses itself there and shows only on
// Higher (nine parts, 28 marks). That is the evidence bar working as intended
// rather than a gap in this file — the briefing itself is still worth having,
// because the skill is on the Foundation course whether or not it came up
// often in the series we have coded.
//
// The dominant coded trap is `subtract_the_same_amount_each_year` (three
// appearances), with `multiply_the_single_year_loss_by_five` and
// `compound_not_simple` behind it — all the same error of treating compound
// change as simple. The method is built round the multiplier for exactly that
// reason: raising a multiplier to a power makes the repetition structural
// rather than something to remember.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const growthAndDecayBriefing: SkillBriefing = {
  skillId: 'growth_and_decay',

  summary:
    'The same percentage applied over and over — once a year, once an hour, once each go.',

  recognise: [
    {
      text: 'A percentage with a period attached to it: each year, per annum, every hour, per day.',
      example: 'The value falls by 15% each year.',
    },
    {
      text: 'The standard settings — compound interest, depreciation, population growth, bacteria, '
        + 'radioactive decay.',
      example: '£2000 is invested at 3% compound interest.',
    },
    {
      text: 'A number of periods is given, and the question wants the value at the end of them.',
      example: 'Work out the value after 4 years.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in percentageChange.ts.
      skillId: 'percentage_change',
      thisOne: 'Interest or loss that builds on the new amount each time — compound.',
      theOther: 'A single change, applied to the original amount.',
      ask: 'Is the percentage applied once, or again and again once per year?',
    },
    {
      // Mirror of the entry in the Higher block of proportion.ts.
      skillId: 'proportion',
      thisOne: 'A factor applied over and over, once per period — each year, each hour.',
      theOther: 'One scale factor, applied once.',
      ask: 'Does the change happen once, or repeatedly over time?',
    },
  ],

  examples: [
    {
      // Deliberately the same stem that appears as a NO on the proportion page.
      stem: 'A car is worth £12,000. Its value falls by 15% each year. Work out its value after 3 years.',
      isThisSkill: true,
      cue: '"Each year", for three years. The 15% comes off the new value each time, not the original £12,000.',
    },
    {
      stem: '£2500 is invested at 2.4% compound interest per year. Work out the value after 5 years.',
      isThisSkill: true,
      cue: 'Compound interest is the standard case — one multiplier, raised to the number of years.',
    },
    {
      stem: 'A jacket costs £80. Its price is reduced by 25% in a sale. Work out the sale price.',
      isThisSkill: false,
      actuallySkillId: 'percentage_change',
      cue: 'One reduction, once. There is no period attached, so nothing repeats.',
    },
  ],

  steps: [
    {
      do: 'Turn the percentage into a single multiplier: 15% off is × 0.85, 3% growth is × 1.03.',
      because:
        'The multiplier is what makes repeating possible. Once you have it you raise it to a power '
        + 'instead of doing the percentage over and over.',
      watch:
        'Using 0.15 rather than 0.85. The multiplier is what is LEFT after the change, not what was '
        + 'taken away.',
    },
    {
      do: 'Raise the multiplier to the number of periods, then multiply the starting amount by it.',
      because:
        'Value = start × multiplier to the power n. It is one line, and it is the form the mark scheme '
        + 'is looking for.',
      watch:
        'Taking the same amount off every year. After year one the 15% is a percentage of a smaller '
        + 'number — that difference between simple and compound is the most common way these are lost.',
    },
  ],

  check: [
    'Is the change getting smaller each period? A falling value drops by less each year, because the '
      + 'amount it is a percentage of has shrunk. Equal drops mean you did simple, not compound.',
    'Sanity-check one period on its own. Does start × multiplier give a believable value after year one?',
    'If you worked out one year and multiplied by the number of years, that is simple interest — go back '
      + 'and use the power.',
  ],

  higher: {
    note: {
      text: 'On Higher the unknown is usually the rate or the number of periods rather than the final '
        + 'value, so the work is running the multiplier backwards.',
      example: 'A population grows from 4000 to 5324 in 3 years. Work out the annual percentage rate.',
    },

    recognise: [
      {
        text: 'The start and end values are both given and the rate is what is missing.',
        example: 'Work out the annual rate of decay.',
      },
      {
        text: 'The number of periods is unknown — "how many years until…", "the least number of years".',
        example: 'Find the least number of years for the value to fall below £5000.',
      },
    ],

    examples: [
      {
        stem: 'A machine bought for £18,000 is worth £11,664 after 2 years. '
          + 'Work out the annual rate of depreciation.',
        isThisSkill: true,
        cue: 'Both ends are given and the rate is missing — divide, take the square root, then turn the '
          + 'multiplier back into a percentage.',
      },
    ],

    steps: [
      {
        do: 'For an unknown rate, divide the end by the start and take the nth root.',
        because:
          'start × mⁿ = end rearranges to m = the nth root of (end ÷ start). The rate is then '
          + '(m − 1) × 100.',
        watch:
          'Forgetting to subtract 1 at the end. A multiplier of 1.1 is a rate of 10%, not 110%.',
      },
      {
        do: 'For an unknown number of periods, try values until you cross the target.',
        because:
          'Trial is expected here and is credited — the mark scheme wants to see the value either side '
          + 'of the crossing point, not just the answer.',
        watch:
          'Rounding the year count down. If the value crosses the target partway through year 5, the '
          + 'answer is 5 whole years, not 4.',
      },
    ],

    check: [
      'Run your rate forwards for the full number of periods. You should land back on the value you '
        + 'were given.',
      'For a "how many years" answer, check the year before as well — it must NOT have crossed the target, '
        + 'or your answer is one too many.',
    ],
  },
}
