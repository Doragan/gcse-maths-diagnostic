import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Inequalities — eleventh authored briefing, second of the algebra cluster.
//
// The method is not the difficulty: solving 5c − 4 < 21 is solving an equation
// with a different sign in the middle. Every coded trap is about the BOUNDARY
// and the ANSWER FORM instead — `include_the_open_endpoint`,
// `omit_the_closed_endpoint`, `open_vs_closed_circle`, `off_by_one_boundary`,
// `give_a_value_not_an_inequality`, `give_the_fraction_not_the_integer`. So the
// method spends three of its four steps past the algebra, and the self-check
// tests the boundary explicitly.
//
// The one genuine method trap is `flip_sign_on_divide` /
// `inequality_direction_reversed`, which has its own step.
//
// Higher adds the two-sided form and the shaded region, where the coded traps
// move to `solid_vs_dashed_boundary` and `shade_the_wrong_side`. The comparison
// with `quadratic_inequalities` lives in the higher block because that skill is
// Higher-only (see courses.ts).
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const inequalitiesBriefing: SkillBriefing = {
  skillId: 'inequalities',

  summary:
    'Solving for a RANGE of values rather than a single one — and saying exactly which values are in it.',

  recognise: [
    {
      text: 'A <, >, ≤ or ≥ sitting where an equals sign would be.',
      example: 'Solve 5c − 4 < 21',
    },
    {
      text: 'A number line to mark, with circles to fill in or leave open.',
      example: 'Show your answer on the number line below.',
    },
    {
      text: 'The word "integer". The answer is the whole numbers inside the range, not the range itself.',
      example: 'Write down all the integer values of n that satisfy −3 < n ≤ 2.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in solvingLinearEquations.ts.
      skillId: 'solving_linear_equations',
      thisOne: 'An inequality sign: a whole range of values makes it true.',
      theOther: 'An equals sign: one value makes it true.',
      ask: 'Is the sign in the middle <, >, ≤ or ≥, or is it =?',
    },
  ],

  examples: [
    {
      stem: 'Solve 5c − 4 < 21',
      isThisSkill: true,
      cue: 'A < where the equals sign would be, so the answer is every value below a boundary.',
    },
    {
      stem: 'Write down all the integer values of n that satisfy −3 < n ≤ 2.',
      isThisSkill: true,
      cue: 'The range is handed to you. The work is listing the whole numbers inside it — and the '
        + 'two ends are not treated the same.',
    },
    {
      stem: 'n is an integer and 2n + 1 > 9. Write down the smallest possible value of n.',
      isThisSkill: true,
      cue: 'Solve as normal, then think about whole numbers: n > 4 makes the smallest integer 5, not 4.',
    },
    {
      stem: 'Solve 4y − 2 = 18',
      isThisSkill: false,
      actuallySkillId: 'solving_linear_equations',
      cue: 'An equals sign. Exactly one value works, so there is no range and no boundary to decide about.',
    },
  ],

  steps: [
    {
      do: 'Solve it exactly as you would an equation, carrying the inequality sign down every line.',
      because:
        'Every step is the same as an equation — the sign simply travels with it.',
      watch:
        'Quietly turning it into an equation. The answer is c < 5, not c = 5, and an equals sign '
        + 'there loses the mark.',
    },
    {
      do: 'If you multiply or divide by a NEGATIVE number, flip the sign round.',
      because:
        '−2 < 3 is true, but multiplying both sides by −1 gives 2 and −3, and only 2 > −3 is still true.',
      watch:
        'Forgetting the flip. Where you can, add the letter to the other side instead so it never '
        + 'goes negative and the question does not arise.',
    },
    {
      do: 'On a number line, fill the circle for ≤ or ≥ and leave it open for < or >.',
      because:
        'The circle is the only thing on the page saying whether the boundary itself counts, and it '
        + 'is usually worth a mark on its own.',
      watch:
        'Open and filled the wrong way round, or the arrow pointing the wrong way along the line.',
    },
    {
      do: 'If it asks for integers, list them — and decide about both ends deliberately.',
      because:
        'The boundary is in for ≤ and out for <. That single decision is where the marks on these '
        + 'questions actually sit.',
      watch:
        'Giving the range when it asked for values, or a fraction when it said integer.',
    },
  ],

  check: [
    'Test a value from inside your range in the original inequality. If it does not come out true, '
      + 'the sign is the wrong way round.',
    'Test the boundary itself. Does it belong? ≤ says yes, < says no.',
    'Is the answer in the form asked for — an inequality, a list of integers, or a mark on a number line?',
  ],

  higher: {
    note: {
      text: 'On Higher the inequality is often two-sided, with the letter in the middle, or it is '
        + 'drawn as a shaded region on a grid.',
      example: 'Solve −4 ≤ 3x + 2 < 11',
    },

    recognise: [
      {
        text: 'Two inequality signs at once, with the letter between them.',
        example: 'Solve −4 ≤ 3x + 2 < 11',
      },
      {
        text: 'A grid with lines to draw and a region to shade.',
        example: 'Shade the region that satisfies y < 2x + 1 and x + y ≤ 4.',
      },
    ],

    confusableWith: [
      {
        skillId: 'quadratic_inequalities',
        thisOne: 'One x term, so one boundary and one range.',
        theOther: 'An x² term, so two boundaries — and the answer may be the middle or the two outside pieces.',
        ask: 'Is there an x² in it?',
      },
    ],

    examples: [
      {
        stem: 'Solve −4 ≤ 3x + 2 < 11',
        isThisSkill: true,
        cue: 'Two signs at once. Every step has to be done to all three parts together.',
      },
    ],

    steps: [
      {
        do: 'With the letter in the middle, do each step to all THREE parts.',
        because:
          'Subtracting 2 throughout turns −4 ≤ 3x + 2 < 11 into −6 ≤ 3x < 9, and dividing by 3 '
          + 'finishes it in one pass.',
        watch:
          'Splitting it into two separate inequalities and never putting them back together — or, '
          + 'when dividing by a negative, flipping only one of the two signs.',
      },
    ],

    check: [
      'For a shaded region, take a point clearly inside it and test it in EVERY inequality.',
      'Dashed or solid? A dashed line means strict (< or >); a solid line includes the boundary.',
    ],
  },
}
