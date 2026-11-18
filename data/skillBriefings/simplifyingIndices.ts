import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Simplifying indices — twenty-first authored briefing, written with
// standardForm.ts as a pair. They are the two unbriefed skills that clear the
// four-part evidence bar on ALL EIGHT board/tier slices, so the exam panel is
// populated whichever board a student picks, and they are confusable with each
// other: a calculation in standard form is an index-law question wearing a
// power of ten.
//
// Every coded trap on this skill is the same question asked wrongly — WHAT
// HAPPENS TO THE INDICES. `add_indices` and `multiply_indices` are the error in
// both directions; `add_indices_when_dividing`, `subtract_indices_to_zero` and
// `divide_to_zero_not_one` are it again under division; and
// `multiply_becomes_coefficient` is the index escaping into the number in
// front. So the method separates the coefficient from the index first and then
// makes the law a single decision — which is the step the gate asks about.
//
// `answer_left_in_index_form` and `partial_simplify` are the other half: the
// work is right and the answer is not finished. That is the last step and the
// last check.
//
// Not routes. Multiplying, dividing and a power of a power look like three
// questions but share a first move — split the number from the letter — and
// differ only in which law applies, which is one decision inside one method.
// standardForm.ts, where the first move really does differ, uses routes.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const simplifyingIndicesBriefing: SkillBriefing = {
  skillId: 'simplifying_indices',

  summary:
    'Writing a product, a quotient or a power of powers as one term, using the index laws.',

  recognise: [
    {
      text: 'The word "Simplify", and the same letter or number appearing more than once as a power.',
      example: 'Simplify a⁵ × a³',
    },
    {
      text: 'A bracket with a power outside it, which puts a power onto everything inside.',
      example: 'Simplify (2m³)⁴',
    },
    {
      text: 'A number in front as well as the letter. The numbers multiply or divide as ordinary '
        + 'numbers; only the indices follow an index law.',
      example: 'Simplify 12y⁷ ÷ 4y³',
    },
    {
      // Last, and framed as the exception it is. Sitting second in the list it
      // read as one more way the skill turns up, when it is the opposite: the
      // case where the index laws have nothing to do.
      text: 'And the one that does NOT combine: different bases. There is no index law between '
        + 'c³ and d², so they stay exactly as they are and only the numbers multiply. '
        + '4c³ × 3d² is 12c³d², and that is finished.',
      example: 'Simplify 4c³ × 3d²',
    },
  ],

  confusableWith: [
    {
      skillId: 'simplifying_expressions',
      thisOne: 'The terms are MULTIPLIED or divided, and the indices do the work.',
      theOther: 'The terms are ADDED or subtracted, and the indices do not move at all.',
      ask: 'Is the sign between the terms × or ÷, or is it + or −?',
      pair: {
        thisOne: 'Simplify 3a⁴ × 2a³.',
        theOther: 'Simplify 3a⁴ + 2a⁴.',
      },
    },
    {
      // Mirror of the entry in standardForm.ts — same distinction, other side.
      skillId: 'standard_form',
      thisOne: 'The base can be anything, and the answer is a single tidy power.',
      theOther: 'The base is always 10, and the answer has to come back as a number between 1 and '
        + '10 times a power of ten.',
      ask: 'Is the base 10 with a size to report, or just a power to tidy up?',
      pair: {
        thisOne: 'Simplify 3⁴ × 3⁵, giving your answer as a single power of 3.',
        theOther: 'Work out (3 × 10⁴) × (2 × 10⁵), giving your answer in standard form.',
      },
    },
  ],

  examples: [
    {
      stem: 'Simplify m⁷ × m⁴',
      isThisSkill: true,
      worked: [
        'Same base, and they are multiplied, so the indices add',
        '7 + 4 = 11, giving m¹¹',
      ],
      cue: 'One base, multiplied. The only question is what happens to the 7 and the 4.',
    },
    {
      stem: 'Simplify 20p⁸ ÷ 5p²',
      isThisSkill: true,
      worked: [
        'The numbers in front divide on their own: 20 ÷ 5 = 4',
        'The powers divide, so the indices subtract: 8 − 2 = 6',
        '4p⁶',
      ],
      cue: 'A number in front of each term. It is divided as an ordinary number, and the indices '
        + 'are left to their own law.',
    },
    {
      stem: 'Simplify (3k⁴)³',
      isThisSkill: true,
      worked: [
        'Everything inside the bracket is cubed, the 3 included: 3³ = 27',
        'A power of a power multiplies the indices: 4 × 3 = 12',
        '27k¹²',
      ],
      cue: 'The power outside the bracket reaches the number as well as the letter — that is what '
        + 'makes it 27 and not 3.',
    },
    {
      stem: 'Simplify 7w³ + 2w³',
      isThisSkill: false,
      actuallySkillId: 'simplifying_expressions',
      cue: 'Added, not multiplied. The indices do nothing at all here: 7 and 2 collect to 9 and '
        + 'w³ stays exactly as it is.',
    },
    {
      stem: 'Work out (4 × 10⁵) ÷ (8 × 10²), giving your answer in standard form.',
      isThisSkill: false,
      actuallySkillId: 'standard_form',
      cue: 'The index law is in there, but the base is 10 and the answer has to come back in '
        + 'standard form — which is the extra thing being marked.',
    },
  ],

  methodExample: 'Simplify 6a⁵ × 4a³.',
  steps: [
    {
      do: 'Group the numbers in front with each other, and the powers with each other.',
      because:
        'Multiplication can be done in any order, so 6a⁵ × 4a³ can be read as (6 × 4) × (a⁵ × a³). '
        + 'Nothing is being taken apart — the number and the power are still multiplied together '
        + 'at the end. Grouping them is just what lets each follow its own rule.',
      watch:
        'Letting the number reach the index. 6a⁵ × 4a³ is not 24a¹⁵, and not 10a⁸ either.',
      example: '6a⁵ × 4a³ = (6 × 4) × (a⁵ × a³)',
    },
    {
      do: 'Look at what is being done to the powers, and apply the matching index law.',
      because:
        'Multiplying adds the indices, dividing subtracts them, and a power of a power multiplies '
        + 'them. a⁵ × a³ is five a\'s times three a\'s, which is eight a\'s in a row — the law is '
        + 'a shortcut for counting them.',
      watch:
        'Doing to the indices whatever is being done to the terms. Multiplying the terms does not '
        + 'multiply the indices, and dividing them does not divide the indices.',
      example: 'Multiplying, so the indices add: 5 + 3 = 8',
      nextMoveDistractors: [
        'Multiply the indices together, because the terms are being multiplied.',
        'Add the indices to the numbers in front before simplifying.',
      ],
    },
    {
      do: 'Write it as one term: the number in front, the letter, and a single index.',
      because:
        'The mark is for a simplified expression. Two terms still joined by a × sign is the '
        + 'question copied out again.',
      watch:
        'Stopping part way — 24 × a⁸ rather than 24a⁸, or leaving a⁵ × a³ untouched beside a '
        + 'tidied number.',
      example: '24a⁸',
    },
  ],

  check: [
    'Is the base in your answer the one you started with? The index changes; a stays a.',
    'Try it on a tiny case. a² × a³ should give a⁵ — five a\'s written out. If your rule gives '
      + 'a⁶, it is the rule that is wrong, not the case.',
    'Is it one term, fully simplified? 24a⁸, not 24 × a⁸ and not 24a⁵a³.',
  ],

  higher: {
    note: {
      text: 'On Higher the bases often differ and have to be matched first, and the index can be '
        + 'the unknown. The laws themselves do not change.',
      example: 'Write 8³ × 4² as a single power of 2.',
    },

    recognise: [
      {
        text: 'Two different bases that are both powers of something smaller — 8 and 4 are both '
          + 'powers of 2, 27 and 9 are both powers of 3.',
        example: 'Write 9⁵ as a power of 3.',
      },
      {
        text: 'The unknown sitting in the index, which is solved by making both sides the same base.',
        example: '2ˣ = 32',
      },
    ],

    examples: [
      {
        stem: 'Write 16⁴ as a power of 2.',
        isThisSkill: true,
        worked: [
          '16 is 2⁴, so 16⁴ is (2⁴)⁴',
          'A power of a power multiplies the indices: 4 × 4 = 16',
          '2¹⁶',
        ],
        cue: 'Rebasing, then the ordinary power-of-a-power law. The 4 from the rebase multiplies — '
          + 'it does not add.',
      },
    ],

    methodExample: 'Write 8³ × 4² as a single power of 2.',
    steps: [
      {
        do: 'Rewrite each base as a power of the smallest one before using any law.',
        because:
          'The index laws only work on a shared base. Once everything is a power of 2, the rest '
          + 'is the method you already have.',
        watch:
          'Forgetting that rebasing multiplies the index. 8³ is (2³)³ = 2⁹, not 2⁶ and not 2³⁺³.',
        example: '8³ = (2³)³ = 2⁹, and 4² = (2²)² = 2⁴',
      },
      {
        do: 'Now use the law the question needs, with the shared base.',
        because:
          'Nothing new happens here. Two powers of 2 multiplied add their indices, the same as '
          + 'two powers of a would.',
        watch:
          'Rebasing one side and leaving the other, then adding indices that are not on the same '
          + 'base.',
        example: '2⁹ × 2⁴ = 2¹³',
      },
    ],

    check: [
      'If you rebased, check the index was multiplied and not added: 8³ is 2⁹, because 3 × 3 = 9.',
      'Does the answer use the base the question asked for? "As a power of 2" means the answer '
        + 'starts with a 2, whatever base you were given.',
    ],
  },
}
