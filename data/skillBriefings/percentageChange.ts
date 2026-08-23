import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Percentage change — fourth authored briefing.
//
// The dominant coded misconception is `percentage_change_from_the_wrong_base`
// (three appearances), with `average_the_two_percentages` and
// `add_the_percentages_instead_of_applying_them` behind it. All three are the
// same underlying error: losing track of what the percentage is a percentage
// OF. The method leads on naming the base, and the self-check returns to it.
//
// `reverse_percentage` is a Higher-only skill (see courses.ts), so that
// comparison lives in the higher block — a Foundation student should not be
// told to distinguish something that is not on their paper.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const percentageChangeBriefing: SkillBriefing = {
  skillId: 'percentage_change',

  summary:
    'A quantity turns into more or less of the same kind of thing — a price, a weight, a population.',

  recognise: [
    {
      text: 'Both numbers are the same kind of thing — pounds to pounds, kilograms to kilograms — '
        + 'and the answer is either a percentage or a new amount of what you started with.',
      example: 'The price rises from £40 to £46.',
    },
    {
      text: 'A word for a change: increase, decrease, rise, fall, discount, sale, profit, loss, VAT, interest.',
      example: 'In a sale, all prices are reduced by 15%.',
    },
    {
      text: 'Two offers or two changes set against each other, where the work is deciding which is better.',
      example: 'Which shop gives the bigger reduction? You must show your working.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in proportion.ts — same distinction, other side.
      skillId: 'proportion',
      thisOne: 'Both quantities are the same kind of thing — pounds to pounds, kilograms to kilograms.',
      theOther: 'The two quantities are different kinds of thing — pounds and kilograms, miles and minutes.',
      ask: 'Are the two numbers the same kind of thing, or different kinds?',
    },
    {
      skillId: 'growth_and_decay',
      thisOne: 'A single change, applied to the original amount.',
      theOther: 'Interest or loss that builds on the new amount each time — compound.',
      ask: 'Is the percentage applied once, or again and again once per year?',
    },
  ],

  examples: [
    {
      // Deliberately the same stem that appears as a NO on the proportion page.
      stem: 'A coat costs £45. In a sale its price is reduced by 20%. Work out the sale price.',
      isThisSkill: true,
      cue: 'Pounds before, pounds after — the same kind of thing, changed once.',
    },
    {
      stem: 'A tree was 1.8 m tall. It is now 2.07 m tall. Work out the percentage increase.',
      isThisSkill: true,
      cue: 'Two heights and a percentage for an answer. The original height is what the percentage is of.',
    },
    {
      stem: '4 tins of paint cover 60 m². Work out how many tins are needed to cover 105 m².',
      isThisSkill: false,
      actuallySkillId: 'proportion',
      cue: 'Tins and square metres are different kinds of thing. Nothing is turning into more of itself, '
        + 'so this scales rather than changes.',
    },
    {
      stem: 'A savings account pays 3% interest each year. £2000 is invested for 4 years. '
        + 'Work out the value at the end.',
      isThisSkill: false,
      actuallySkillId: 'growth_and_decay',
      cue: '"Each year", for four years. The 3% is applied four times over, and each time to a larger amount.',
    },
  ],

  steps: [
    {
      do: 'Decide which amount is the base — the one the percentage is a percentage OF.',
      because:
        'Everything in the question hangs off this one decision, and the base is almost always the '
        + 'ORIGINAL amount, before the change.',
      watch:
        'Using the new amount as the base. A rise from £40 to £46 is 15% of 40, not of 46 — this is '
        + 'the single most common way these questions are lost.',
    },
    {
      do: 'For a percentage change, write the change over the base, then multiply by 100.',
      because:
        'Writing it as a fraction first keeps the base visible, so it is harder to divide by the wrong number.',
      watch:
        'Giving the new amount when the question asked for the percentage, or the other way round. '
        + 'Read the answer line before you start.',
    },
    {
      do: 'To apply a change, use one multiplier: 20% off is × 0.8, a 15% rise is × 1.15.',
      because:
        'One multiplication instead of "find the percentage, then add or subtract" — half the arithmetic '
        + 'and half the chances to slip.',
      watch:
        'Adding percentages together. A 10% rise followed by a 10% fall is not back where you started: '
        + 'it is × 1.1 × 0.9, which is 0.99 of the original.',
    },
  ],

  check: [
    'Is the answer on the right side? An increase has to be bigger than what you started with, '
      + 'a decrease smaller. Getting this backwards usually means the multiplier was wrong.',
    'Does the size look right? A 15% change is roughly a seventh of the original. If your answer is '
      + 'nowhere near that, you have probably used the wrong base.',
    'If you compared two offers, did you compare like with like? Two different pack sizes cannot be '
      + 'judged on price alone.',
  ],

  higher: {
    note: {
      text: 'On Higher the change is usually run backwards — you are given the amount AFTER it and asked '
        + 'what it started as — or you are handed a multiplier and asked what change it represents.',
      example: 'After a 12% decrease, a coat costs £39.60. Work out the original price.',
    },

    recognise: [
      {
        text: 'The amount you are given is the one after the change, and the original is what is missing.',
        example: 'The price after a 20% increase is £54.',
      },
      {
        text: 'A multiplier on its own, with the change left for you to name.',
        example: 'A quantity is multiplied by 0.84 each year.',
      },
    ],

    confusableWith: [
      {
        skillId: 'reverse_percentage',
        thisOne: 'You have the amount BEFORE the change and work forwards to what it becomes.',
        theOther: 'You have the amount AFTER the change and work backwards to what it started as.',
        ask: 'Is the number I have been given the original, or the one that has already changed?',
      },
    ],

    examples: [
      {
        stem: 'The price of a phone is reduced by 18% in a sale. It now costs £287. '
          + 'Work out the price before the sale.',
        isThisSkill: true,
        cue: '£287 is the amount after the change, so it is 82% of the original — divide, do not add 18% back on.',
      },
    ],

    steps: [
      {
        do: 'Write the change as a single multiplier, then divide by it to go backwards.',
        because:
          'A 12% decrease is × 0.88, so reversing it is ÷ 0.88. Setting it up as a multiplier makes the '
          + 'reverse obvious and is what the mark scheme credits.',
        watch:
          'Adding the percentage back on. Increasing £39.60 by 12% does not return the original — the '
          + '12% was of a bigger number.',
      },
    ],

    check: [
      'Run your answer forwards. If £45 × 0.88 gives back £39.60, the original was right.',
      'Is the original on the correct side? After a decrease, the original must be BIGGER than what you '
        + 'were given.',
    ],
  },
}
