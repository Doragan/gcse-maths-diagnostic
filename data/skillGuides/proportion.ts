import type { SkillGuide } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Proportion — the first authored guide, written as the trial for the format.
//
// Chosen because the coded papers make it the strongest case: it appears in
// every Foundation paper, it is almost never asked plainly, and its mark
// schemes chain. That is a skill where execution is easy and SELECTION is the
// whole difficulty — exactly what the recognise/confusable fields exist for.
//
// Do not restate the bare-framing rate here or in `recognise`: the page's
// headline claim is computed from the coded audit, so an authored number goes
// stale the moment a new series lands. (June 2025 moved it 0% -> 6% Foundation,
// 0% -> 4% Higher — band "never" -> "rarely", same student-facing advice.)
// ─────────────────────────────────────────────────────────────────────────────

export const proportionGuide: SkillGuide = {
  skillId: 'proportion',

  summary:
    'Two quantities that scale together — scale one, and the other scales by the same factor.',

  recognise: [
    'Two quantities where one scales with the other, and you are given three of the four numbers.',
    'In a context question the word "proportion" almost never appears. Look for recipe, best buy, '
      + 'exchange rate, per, each, at this rate.',
    'A unit on the answer line — per kg, per hour, £/litre — is the single strongest tell.',
  ],

  confusableWith: [
    {
      skillId: 'ratio',
      thisOne: 'Two quantities that move together. Scale one up and the other scales with it.',
      theOther: 'One total, shared out into parts that add back up to that total.',
      ask: 'Is there a total being shared out, or two things moving together?',
    },
    {
      skillId: 'percentage_change',
      thisOne: 'The two quantities are different kinds of thing — pounds and kilograms, miles and minutes.',
      theOther: 'Both quantities are the same kind of thing — pounds to pounds, kilograms to kilograms.',
      ask: 'Are the two numbers the same kind of thing, or different kinds?',
    },
    {
      skillId: 'inverse_proportion',
      thisOne: 'One goes up, and the other goes up with it. Twice the flapjacks, twice the oats.',
      theOther: 'One goes up, and the other goes down. Twice the workers, half the time.',
      ask: 'If I double the first quantity, does the second one double too, or halve?',
    },
    {
      // Deliberately framed on the ANSWER's units rather than the inputs', so it
      // does not collide with the percentage_change card above, which turns on
      // whether the two given quantities are alike.
      skillId: 'compound_units',
      thisOne: 'You are asked for more of something you were already given — more grams, more pounds.',
      theOther: 'You are asked for a rate that joins both quantities — grams per cm³, miles per hour.',
      ask: 'Does the answer need two units joined by "per", or just one?',
    },
  ],

  // Two that are proportion, two that look like it and are not. The near-misses
  // are the point: they are the two skills named in confusableWith above, so a
  // student can test the tell rather than take it on trust.
  examples: [
    {
      stem: '8 identical pens cost £3.60. Work out the cost of 14 pens.',
      isThisSkill: true,
      cue: 'Two quantities scaling together, three of the four numbers given, and a unit on the answer line (£).',
    },
    {
      stem: 'A recipe for 6 flapjacks uses 180 g of oats. How many grams of oats are needed for 15 flapjacks?',
      isThisSkill: true,
      cue: '"Recipe" is the giveaway word, and flapjacks and oats scale together.',
    },
    {
      stem: 'Yusuf and Kaya share £48 in the ratio 3 : 5. Work out how much Kaya receives.',
      isThisSkill: false,
      actuallySkillId: 'ratio',
      cue: 'There is one total (£48) being divided up, not two quantities moving together. That makes it ratio.',
    },
    {
      stem: 'A coat costs £45. In a sale its price is reduced by 20%. Work out the sale price.',
      isThisSkill: false,
      actuallySkillId: 'percentage_change',
      cue: 'Both quantities are money — £ to £. Same kind of thing on both sides means percentage change, not proportion.',
    },
  ],

  steps: [
    {
      do: 'Write the two quantities as a labelled pair, with units.',
      because:
        'The labels are what stop you dividing the wrong way round. This is the step students skip, '
        + 'and it is where the first method mark lives.',
      watch:
        'Mixed units — minutes against hours, grams against kilograms. Convert before you divide, not after.',
    },
    {
      do: 'Find the value of one unit, or find the scale factor between the pairs.',
      because:
        'Both are valid and the paper credits either. Pick the one where the division is cleaner, '
        + 'not the one you were taught first.',
      watch:
        'Dividing the wrong way. "Per kg" means divide by the kilograms, every time.',
    },
    {
      do: 'Scale up to the quantity you were asked for.',
      because:
        'The arithmetic is safe now, because the units are carrying the meaning.',
      watch:
        'Rounding here instead of at the end. A premature round can lose the accuracy mark '
        + 'even when your method was right.',
    },
  ],

  check: [
    'Is your answer bigger or smaller than what you started with — and does that match the direction '
    + 'the rate goes? More of something cheap should cost more. If it does not, you divided the wrong way.',
    'Does the unit on your answer match the unit on the answer line?',
    'Scale it roughly: ten times the ingredients should be about ten times the cost.',
  ],

  higher: {
    note:
      'On Higher, proportion is usually written algebraically rather than scaled arithmetically, '
      + 'and the two quantities are often not in a simple 1:1 relationship.',

    recognise: [
      'The symbol ∝, or the words "is proportional to" / "varies as" — on Higher these are stated outright.',
      'A power in the relationship: proportional to the square, to the cube, or to the square root.',
    ],

    confusableWith: [
      {
        skillId: 'proportion_with_powers',
        thisOne: 'y ∝ x. Double x and y doubles with it.',
        theOther: 'y ∝ x². Double x and y goes up four times, not twice.',
        ask: 'Is there a power on the x in the relationship — squared, cubed, or a square root?',
      },
      {
        skillId: 'growth_and_decay',
        thisOne: 'One scale factor, applied once.',
        theOther: 'A factor applied over and over, once per period — each year, each hour.',
        ask: 'Does the change happen once, or repeatedly over time?',
      },
    ],

    examples: [
      {
        stem: 'y is proportional to the square of x. When x = 3, y = 45. Work out y when x = 5.',
        isThisSkill: true,
        cue: 'Stated outright with "is proportional to" — and the power sits on x, so doubling x would multiply y by four.',
      },
      {
        stem: 'A car is worth £12,000. Its value falls by 15% each year. Work out its value after 3 years.',
        isThisSkill: false,
        actuallySkillId: 'growth_and_decay',
        cue: '"Each year" means the factor is applied again and again. Proportion scales once; this compounds.',
      },
    ],

    steps: [
      {
        do: 'Write the relationship with a constant: y = kx, or y = kx² for a squared relationship.',
        because:
          'Turning the proportion into an equation is what makes the second part answerable. '
          + 'It is also worth a mark in its own right on most Higher mark schemes.',
        watch:
          'Writing y = kx when the question said proportional to the square. The power belongs on x, '
          + 'not on k.',
      },
      {
        do: 'Substitute the given pair to find k, then use the equation for the value asked for.',
        because:
          'k is fixed for the whole question — find it once and every later part follows from it.',
        watch:
          'Recalculating k for the second part. If k has changed, you have made an error somewhere.',
      },
    ],

    check: [
      'Substitute your answer back into y = kx. If it does not reproduce the pair you were given, k is wrong.',
      'For a squared relationship: did your answer change by the square of the factor, not the factor itself?',
    ],
  },
}
