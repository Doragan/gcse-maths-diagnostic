import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Fractions of amounts — seventh authored briefing, first of the fractions and
// percentages cluster (with `fractions_decimals_and_percentages` and
// `reverse_percentage`). The cluster joins the existing ring through `ratio`
// and `percentage_change`, so its comparison cards land on pages that exist.
//
// Almost never bare on the paper: the coded AQA Foundation parts are nearly all
// story questions, several people and several amounts, often more than one
// route through. So recognition matters less than bookkeeping. The recurring
// coded traps are all bookkeeping: `take_fraction_of_wrong_person`,
// `take_the_fraction_of_the_wrong_share` (a fraction of the original when it
// was of the remainder), `give_the_complement`, `give_the_amount_not_the_fraction`,
// and `multiply_where_division_is_needed` / `invert_the_fraction`. The method
// is built round writing the remainder down, and the self-check round what the
// question asked for.
//
// The ratio comparison mirrors the one in ratio.ts, which targets that page's
// most frequent trap (`ratio_read_as_a_fraction_of_the_total`).
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const fractionsOfAmountsBriefing: SkillBriefing = {
  skillId: 'fractions_of_amounts',

  summary:
    'Taking a fraction of a known amount — often more than once, and each time of what is left.',

  recognise: [
    {
      text: 'A fraction and an amount it applies to. On the paper the "of" is usually hidden inside a story.',
      example: 'Jo spends 2/5 of her £30 wages on travel.',
    },
    {
      text: 'Fractions taken one after another, where the second is a fraction of what was LEFT.',
      example: 'She gives 1/4 of the sweets to her brother and 1/3 of the rest to her sister.',
    },
    {
      text: 'The question asks what remains, or what fraction someone ended up with.',
      example: 'What fraction of her money does she have left?',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in ratio.ts — same distinction, other side.
      skillId: 'ratio',
      thisOne: 'The number is a share of the WHOLE already. 3/8 means 3 out of every 8.',
      theOther: 'The numbers compare the parts to EACH OTHER. In 3 : 5 there are 8 shares altogether.',
      ask: 'Is this number telling me a share of the total, or comparing two parts?',
    },
    {
      skillId: 'fractions_decimals_and_percentages',
      thisOne: 'You are given the fraction, and the answer is an amount — pounds, people, sweets.',
      theOther: 'You are given the amounts, and the answer is the fraction or percentage itself.',
      ask: 'Is the fraction something I have been given, or the thing I am being asked to find?',
    },
  ],

  examples: [
    {
      stem: 'A school has 420 students. 3/7 of them walk to school. '
        + 'Work out how many students do not walk to school.',
      isThisSkill: true,
      cue: 'A fraction of a known total. The question asks about the OTHER group, so the '
        + 'share you want is 4/7, not 3/7.',
    },
    {
      stem: 'Priya has £60. She spends 1/4 of it on a book and 2/5 of what is left on a ticket. '
        + 'How much money does she have left?',
      isThisSkill: true,
      cue: 'Two fractions, and the second is of what is LEFT. The book leaves £45, and the 2/5 is of that.',
    },
    {
      stem: 'Ali and Beth share some sweets in the ratio 3 : 5. Beth gets 40 sweets. '
        + 'Work out how many sweets Ali gets.',
      isThisSkill: false,
      actuallySkillId: 'ratio',
      cue: '3 : 5 compares Ali’s share with Beth’s. It is not 3/5 of anything — Beth’s 40 is 5 parts.',
    },
    {
      stem: 'There are 40 cars in a car park. 14 of the cars are red. '
        + 'What percentage of the cars are red?',
      isThisSkill: false,
      actuallySkillId: 'fractions_decimals_and_percentages',
      cue: 'Both amounts are given and the answer is a percentage. You are making the fraction '
        + '14/40, not taking a fraction of something.',
    },
  ],

  steps: [
    {
      do: 'Divide the amount by the bottom number to find one part, then multiply by the top number.',
      because:
        'Dividing first keeps the numbers small, and a line like "1/5 of £30 is £6" earns the first '
        + 'method mark even if something goes wrong later.',
      watch:
        'Doing it the wrong way round — multiplying by the bottom number or dividing by the top. '
        + '2/5 of £30 is £12; if you got £75, you have turned the fraction upside down.',
    },
    {
      do: 'When there is more than one fraction, write down what is LEFT after each one before taking the next.',
      because:
        '"1/3 of the rest" is a fraction of the remainder, not of the original. Writing the remainder '
        + 'down makes it the number you use next.',
      watch:
        'Taking every fraction of the starting amount, or adding the fractions together. 1/4 and then '
        + '1/3 of the rest is not 1/4 + 1/3 of the whole.',
    },
    {
      do: 'Before writing the answer, read the last line again: who is it about, and does it want an amount or a fraction?',
      because:
        'These are story questions with several people and several amounts. The arithmetic is rarely '
        + 'the hard part — answering the question that was asked is.',
      watch:
        'Giving what was spent when the question asked what was left, or the fraction for the wrong '
        + 'person. It costs as many marks as a sum that is wrong.',
    },
  ],

  check: [
    'Is the answer smaller than what you started with? A fraction less than 1 of something is always '
      + 'less than the whole of it.',
    'Do the pieces add back to the total? What was spent plus what is left must come to what there was.',
    'Amount or fraction? If Priya ends with £27 and the question asks what fraction she has left, the '
      + 'answer is 27/60 — which simplifies to 9/20.',
    'If the answer is a number of people, tickets or boxes, have you rounded the way the story needs? '
      + 'Packing 43 eggs into boxes of 6 needs 8 boxes, not 7.',
  ],

  higher: {
    note: {
      text: 'On Higher the fraction is usually run backwards: you are told what part of the amount '
        + 'came to, or what was left, and have to find the whole.',
      example: 'After spending 3/8 of his savings, Tom has £150 left.',
    },

    recognise: [
      {
        text: 'You are given what a fraction of the amount came to, and the whole is what is missing.',
        example: '2/7 of the members are juniors. There are 36 juniors.',
      },
    ],

    examples: [
      {
        stem: 'Kai spends 1/3 of his money on a jacket and 1/4 of his money on shoes. He has £75 left. '
          + 'How much money did he have to start with?',
        isThisSkill: true,
        cue: 'The whole is missing. Both fractions are of his money, so together he spent 7/12 — '
          + 'and £75 is the other 5/12.',
      },
    ],

    steps: [
      {
        do: 'Work out what fraction of the whole the amount you have been given is, then find one part and scale up.',
        because:
          'If £150 is the 5/8 Tom has left, 1/8 is £30 and the whole is £240 — the same "find one part" '
          + 'step, run the other way.',
        watch:
          'Taking the fraction OF the amount you were given. 3/8 of £150 answers nothing: the £150 is '
          + 'what was left, not the whole.',
      },
    ],

    check: [
      'Run it forwards: take the fractions of the whole you found and check they leave exactly the '
        + 'amount you were given.',
    ],
  },
}
