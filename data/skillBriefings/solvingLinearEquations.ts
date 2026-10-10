import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Solving linear equations — tenth authored briefing, and the first of the
// algebra cluster (with `inequalities` and `simultaneous_equations`). It is the
// heaviest skill in the coded audit by marks, and the cluster is self-contained:
// both neighbours have this skill as their prerequisite, so the comparisons
// point inwards.
//
// About half the coded parts are bare "solve this" — but the other half are the
// interesting ones, where no equation is printed at all and the student has to
// build it from an angle fact or a story. That is where the coded traps live:
// `use_360_not_180`, `forget_angles_sum_180`, `give_x_not_the_perimeter`,
// `answer_for_the_wrong_person`. The recognition cues and the last method step
// are built round that, not round the algebra.
//
// The execution traps are `variable_both_sides`, `sign_error_on_transfer`,
// `subtract_the_wrong_way_round` and `divide_before_subtracting`, which the
// first two steps target directly.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const solvingLinearEquationsBriefing: SkillBriefing = {
  skillId: 'solving_linear_equations',

  summary:
    'Finding the one value of the letter that makes both sides balance.',

  recognise: [
    {
      text: 'An equals sign with a letter in it, and the word "solve".',
      example: 'Solve 4y − 2 = 18',
    },
    {
      text: 'The letter on BOTH sides, so the first job is getting it onto one of them.',
      example: 'Solve 7y − 5 = 3y + 11',
    },
    {
      text: 'No equation printed at all. A shape, an angle fact or a story hands you one.',
      example: 'The angles on a straight line are 2x, 3x and x + 30.',
    },
  ],

  confusableWith: [
    {
      skillId: 'substitution',
      thisOne: 'The letter is unknown, and the equals sign is what pins it down.',
      theOther: 'The letter\'s value is GIVEN. You put it in and work the answer out.',
      ask: 'Have I been told what the letter is, or am I being asked to find it?',
      pair: {
        thisOne: 'Solve 3x + 7 = 22.',
        theOther: 'Work out the value of 3x + 7 when x = 5.',
      },
    },
    {
      // Mirror of the entry in inequalities.ts — same distinction, other side.
      skillId: 'inequalities',
      thisOne: 'An equals sign: one value makes it true.',
      theOther: 'An inequality sign: a whole range of values makes it true.',
      ask: 'Is the sign in the middle =, or is it <, >, ≤ or ≥?',
      pair: {
        thisOne: 'Solve 4x − 3 = 17.',
        theOther: 'Solve 4x − 3 ≤ 17.',
      },
    },
    {
      // Mirror of the entry in simultaneousEquations.ts.
      skillId: 'simultaneous_equations',
      thisOne: 'One letter to find, and one equation to find it from.',
      theOther: 'Two letters, and two equations that have to be true at the same time.',
      ask: 'How many different letters am I solving for — one, or two?',
      pair: {
        thisOne: 'Solve 2x + 1 = x + 11.',
        theOther: 'Solve 2x + y = 11 and x − y = 1.',
      },
    },
    {
      // Mirror of the entry in anglesOnLinesAndCircles.ts. Worth having on this
      // side too: a third of the coded parts here build their equation from a
      // diagram, and the student has to notice that is what is happening.
      skillId: 'angles_on_lines_and_circles',
      thisOne: 'The equation is printed, or built from a story, and the work is the algebra.',
      theOther: 'The geometry is the point: which angle fact applies, and what the diagram tells you.',
      ask: 'Am I solving an equation I already have, or choosing an angle fact first?',
      pair: {
        thisOne: 'Solve 3x = 2x + 30.',
        theOther: 'The angles on a straight line are 3x and 2x + 30. Work out x.',
      },
    },
  ],

  examples: [
    {
      stem: 'Solve 5x + 3 = 2x + 18',
      isThisSkill: true,
      worked: [
        'Take the smaller x term off both sides: 3x + 3 = 18',
        'Subtract 3: 3x = 15',
        'Divide by 3: x = 5',
      ],
      cue: 'An equals sign and one letter, on both sides. Collecting the x terms on one side is the first move.',
    },
    {
      stem: 'The angles in a triangle are x, 2x and 3x − 30. '
        + 'Work out the size of the largest angle.',
      isThisSkill: true,
      worked: [
        'Angles in a triangle add to 180: x + 2x + 3x − 30 = 180',
        '6x − 30 = 180, so 6x = 210 and x = 35',
        'The angles are 35°, 70° and 75°, so the largest is 75°',
      ],
      cue: 'No equation is printed. "Angles in a triangle add to 180" is the equation — and the '
        + 'answer line wants an angle, not x.',
    },
    {
      stem: 'Work out the value of 3x + 2 when x = 4.',
      isThisSkill: false,
      actuallySkillId: 'substitution',
      cue: 'You have been told what x is. There is nothing to balance — put the 4 in and work it out.',
    },
    {
      stem: 'Solve 5c − 4 < 21',
      isThisSkill: false,
      actuallySkillId: 'inequalities',
      cue: 'The sign in the middle is <, not =. The answer is a range of values rather than one value.',
    },
  ],

  steps: [
    {
      do: 'If the letter is on both sides, take the SMALLER letter term off both sides first.',
      because:
        'It leaves one letter term and keeps it positive, which avoids the negative-x muddle that '
        + 'costs the most marks.',
      watch:
        'Subtracting the wrong way round and ending up with −3x where you wanted 3x.',
    },
    {
      do: 'Undo what has been done to the letter in reverse order: add or subtract first, then multiply or divide.',
      because:
        'You are unpicking the arithmetic backwards, and each correct step earns a method mark even '
        + 'if the final value slips.',
      watch:
        'Dividing only part of a side. Halving 4y − 2 = 18 is not 2y − 2 = 9 — every term on both '
        + 'sides has to be halved.',
    },
    {
      do: 'Do the same thing to both sides every time, and write each new equation on its own line.',
      because:
        'Balance is the whole idea, and a line per step is what the examiner follows to award the '
        + 'method marks.',
      watch:
        'Sign errors as a term crosses the equals sign. A + 7 on the left becomes − 7 on the right, '
        + 'never + 7.',
    },
    {
      do: 'Read the answer line again. It often wants a length, an angle or a perimeter — not x.',
      because:
        'When the equation came from a shape or a story, x is the middle of the problem rather than '
        + 'the end of it.',
      watch:
        'Stopping at x = 35 when the question asked for the largest angle, or answering for the '
        + 'wrong person in a story.',
    },
  ],

  check: [
    'Put your value back into the ORIGINAL equation and check both sides come to the same number.',
    'If the answer is an angle or a length, is it possible? A negative length, or angles in a '
      + 'triangle that do not total 180, means a slip earlier.',
    'Did the question want x, or something you work out FROM x?',
  ],

  higher: {
    note: {
      text: 'On Higher the equation usually arrives buried in fractions or brackets, so there is a '
        + 'tidying step before the solving starts.',
      example: 'Solve (2x − 1)/5 = (x + 4)/3',
    },

    recognise: [
      {
        text: 'Fractions with the letter on top, where clearing the denominators is the first move.',
        example: 'Solve (3x − 1)/4 = (x + 5)/3',
      },
    ],

    examples: [
      {
        stem: 'Solve (x + 5)/4 + (x − 1)/2 = 6',
        isThisSkill: true,
      worked: [
        'Multiply EVERY term by 4: (x + 5) + 2(x − 1) = 24',
        '3x + 3 = 24, so 3x = 21',
        'x = 7',
      ],
        cue: 'Fractions with x on top. Multiplying every term by 4 clears both denominators at once.',
      },
    ],

    steps: [
      {
        do: 'Multiply EVERY term on both sides by the lowest common denominator.',
        because:
          'It turns a fraction equation into an ordinary linear one in a single line, and that line '
          + 'usually carries the first method mark.',
        watch:
          'Forgetting the whole number on the right, or dropping the brackets: (x − 1)/2 multiplied '
          + 'by 4 is 2(x − 1), not 2x − 1.',
      },
    ],

    check: [
      'Substitute back into the ORIGINAL fractions, not the cleared version. A mistake made while '
        + 'clearing survives a check against the cleared line.',
    ],
  },
}
