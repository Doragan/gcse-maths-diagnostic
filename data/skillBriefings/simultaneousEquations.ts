import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Simultaneous equations — twelfth authored briefing, and the one that closes
// the algebra cluster. `ratio` has pointed here from its Higher block since it
// was written, so the ratio comparison below is that entry told from this side.
//
// Every coded part is chained — there is no one-step version of this skill — and
// the traps come in two kinds. Execution: `sign_error_on_elimination` and
// `arithmetic_in_elimination`, which the add-or-subtract step targets. And
// finishing: `solve_for_one_variable_only`, `answer_in_the_wrong_unit_weight`,
// `money_notation`, `read_the_balance_the_wrong_way_round` — a student who does
// the algebra correctly and then stops one line early. Hence the last step and
// two of the three self-checks.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const simultaneousEquationsBriefing: SkillBriefing = {
  skillId: 'simultaneous_equations',

  summary:
    'Two unknowns, and two facts that have to be true at the same time.',

  recognise: [
    {
      text: 'Two equations printed together, with the same two letters in both.',
      example: 'Solve 3x + y = 21 and 4x − 2y = 8',
    },
    {
      text: 'Two baskets and two totals. The letters are prices or weights you are never told.',
      example: '3 coffees and 2 teas cost £9.60. 1 coffee and 4 teas cost £8.20.',
    },
    {
      text: 'Two conditions given in words, with no equations printed at all.',
      example: 'Two numbers have a sum of 19 and a difference of 5.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the Higher entry in ratio.ts — same distinction, other side.
      skillId: 'ratio',
      thisOne: 'Two genuinely independent unknowns, needing two equations to pin both down.',
      theOther: 'One unknown carries the ratio: the parts are 2n and 3n, and one equation finds n.',
      ask: 'Can I write both quantities using the same single letter, or do I need two?',
    },
    {
      // Mirror of the entry in solvingLinearEquations.ts.
      skillId: 'solving_linear_equations',
      thisOne: 'Two letters, and two equations that have to be true at the same time.',
      theOther: 'One letter to find, and one equation to find it from.',
      ask: 'How many different letters am I solving for — one, or two?',
    },
  ],

  examples: [
    {
      stem: 'Solve 3x + y = 21 and 4x − 2y = 8',
      isThisSkill: true,
      cue: 'The same two letters in both equations, and both have to hold at once.',
    },
    {
      stem: '3 coffees and 2 teas cost £9.60. 1 coffee and 4 teas cost £8.20. '
        + 'Work out the cost of one tea.',
      isThisSkill: true,
      cue: 'Two baskets, two totals, two prices you are never told. Each basket becomes an equation.',
    },
    {
      stem: 'Solve 5x + 3 = 2x + 18',
      isThisSkill: false,
      actuallySkillId: 'solving_linear_equations',
      cue: 'Only one letter. A single equation is enough to pin x down, even with x on both sides.',
    },
    {
      stem: 'Red and blue counters are in the ratio 5 : 3. There are 24 counters altogether. '
        + 'Work out how many are red.',
      isThisSkill: false,
      actuallySkillId: 'ratio',
      cue: 'One total shared into parts. Both amounts can be written with one letter — 5n and 3n — '
        + 'so one equation does it.',
    },
  ],

  steps: [
    {
      do: 'Write both equations in the same form, with the letters lined up in the same order.',
      because:
        'Elimination only works when like terms sit above like terms, and most sign errors start '
        + 'from a ragged layout.',
      watch:
        'Leaving one as 21 = 3x + y. Put both the same way round before you start.',
    },
    {
      do: 'Scale one equation so the number in front of one letter matches in both.',
      because:
        'Removing a letter leaves an ordinary one-letter equation, which you already know how to solve.',
      watch:
        'Multiplying only part of an equation. Doubling 3x + y = 21 means every term: 6x + 2y = 42.',
    },
    {
      do: 'Decide add or subtract from the SIGNS: same signs, subtract; different signs, add.',
      because:
        'This is where the coded papers show the most errors, and saying the rule out loud each time '
        + 'is quicker than repairing it later.',
      watch:
        'Subtracting when the signs differ. With + 2y and − 2y it is ADDING that cancels them; '
        + 'subtracting leaves 4y.',
    },
    {
      do: 'Put the letter you found back into the simpler equation, then answer BOTH.',
      because:
        'The answer is a pair, and the accuracy marks are usually split across the two values.',
      watch:
        'Stopping with one letter found. Even when the question only wants the tea, you need both '
        + 'values to check the work.',
    },
  ],

  check: [
    'Put BOTH values into BOTH original equations. One equation working proves nothing — the pair '
      + 'has to satisfy the pair.',
    'For a word problem, do the numbers make sense? A negative price, or baskets that no longer add '
      + 'up to the totals given, means a sign slip in the elimination.',
    'Are you answering in the units asked for — pounds or pence, grams or kilograms?',
  ],

  higher: {
    note: {
      text: 'On Higher the numbers in front rarely match, so BOTH equations usually have to be '
        + 'scaled before anything cancels.',
      example: 'Solve 3x + 4y = 5 and 5x + 6y = 8',
    },

    recognise: [
      {
        text: 'Neither letter has matching numbers in front of it in the two equations.',
        example: 'Solve 3x + 4y = 5 and 5x + 6y = 8',
      },
    ],

    examples: [
      {
        stem: 'Solve 3x + 4y = 5 and 5x + 6y = 8',
        isThisSkill: true,
        cue: 'Nothing matches as it stands. Scaling by 3 and by 2 gives 12y in both, and then they subtract.',
      },
    ],

    steps: [
      {
        do: 'Pick the letter whose two numbers have the smallest common multiple, and scale both equations to it.',
        because:
          'Smaller multipliers mean smaller numbers and fewer slips: 4 and 6 meet at 12, while 3 and '
          + '5 would drag you to 15.',
        watch:
          'Scaling one equation and forgetting the other — or scaling the left-hand side and leaving '
          + 'the number on the right untouched.',
      },
    ],

    check: [
      'Check the pair in the equation you did NOT use to find the second value. Checking in the one '
        + 'you just substituted into cannot catch the error.',
    ],
  },
}
