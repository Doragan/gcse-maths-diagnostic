import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Calculating simple probability — fifteenth authored briefing, and the most
// frequently occurring skill in Probability and Data (AQA: 16 Foundation parts,
// 13 Higher).
//
// The arithmetic is one division. Nearly every coded trap is the DENOMINATOR or
// the question being answered: `wrong_denominator_for_the_sample_space`,
// `use_a_row_total_as_the_denominator`, `use_a_single_set_total_as_the_denominator`,
// `confuse_set_total_with_universal_total`, `ignore_the_region_outside_the_sets`,
// `give_the_complement`, `use_the_probability_as_a_count`. Step 1 is therefore
// about what goes underneath, and the expected-outcomes comparison is there
// because that trap is a recognition failure rather than a slip.
//
// A large decision-justify share asks which estimate to trust, where the coded
// traps are `use_fewer_trials_estimate`, `fewer_trials_less_reliable` and
// `gamblers_fallacy` — step 4.
//
// Higher moves the counting into Venn diagrams and two-way tables, where
// `double_count_the_intersection` and `forget_the_region_outside_both_sets`
// dominate, and `assume_replacement` starts to appear.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const calculatingSimpleProbabilityBriefing: SkillBriefing = {
  skillId: 'calculating_simple_probability',

  summary:
    'How likely one thing is: the number of outcomes that work, over the number of outcomes there are.',

  recognise: [
    {
      text: 'One event, happening once, with an answer between 0 and 1.',
      example: 'Work out the probability that the counter is red.',
    },
    {
      text: 'A list, a table or a two-way table where you have to work out the total yourself.',
      example: 'The table shows the number of students in each year group.',
    },
    {
      text: 'A question about fairness or bias, where the answer needs a reason as well as a number.',
      example: 'Explain whether you think the dice is biased.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in treeDiagrams.ts — same distinction, other side.
      skillId: 'tree_diagrams',
      thisOne: 'One event. The probability is a count over a count.',
      theOther: 'Two or more events in a row, where you multiply along the branches.',
      ask: 'Does something happen once, or one thing after another?',
    },
    {
      skillId: 'expected_outcomes',
      thisOne: 'The answer is a probability — a fraction, decimal or percentage from 0 to 1.',
      theOther: 'The answer is a NUMBER of times: the probability multiplied by the number of trials.',
      ask: 'Am I being asked how likely it is, or how many times it happens?',
    },
  ],

  examples: [
    {
      stem: 'A bag contains 5 red, 3 blue and 2 green counters. One counter is taken at random. '
        + 'Work out the probability that it is blue.',
      isThisSkill: true,
      cue: '3 blue out of 10 counters altogether. The denominator is everything in the bag, not just the blues.',
    },
    {
      stem: '40 students are surveyed: 18 are in Year 10 and 22 are in Year 11. Of the Year 10s, '
        + '12 walk to school; of the Year 11s, 10 walk. Work out the probability that a student '
        + 'chosen at random walks to school.',
      isThisSkill: true,
      cue: 'No total is handed to you: 12 and 10 walk, so 22 of the 40 do. The denominator is all '
        + '40 students, not one year group.',
    },
    {
      stem: 'The probability that a biased coin lands on heads is 0.3. It is thrown 200 times. '
        + 'How many heads would you expect?',
      isThisSkill: false,
      actuallySkillId: 'expected_outcomes',
      cue: 'The answer is a count of throws, not a probability. The probability is given — it is an input here.',
    },
    {
      stem: 'A bag contains 5 red and 3 blue counters. Two are taken without replacement. '
        + 'Work out the probability that both are red.',
      isThisSkill: false,
      actuallySkillId: 'tree_diagrams',
      cue: 'Two picks in a row, and the second depends on the first. That is branches, multiplied along.',
    },
  ],

  steps: [
    {
      do: 'Count the outcomes that work, then count ALL the outcomes, and write one over the other.',
      because:
        'Both counts are marked, and writing it as a fraction keeps the denominator visible while '
        + 'you work.',
      watch:
        'A denominator that is only part of the picture: one row of a table, or one set in a Venn '
        + 'diagram, instead of the whole group.',
    },
    {
      do: 'If the outcomes are not listed for you, list them systematically before counting.',
      because:
        'Sample-space mistakes come from counting in your head. A table or an ordered list makes the '
        + 'total something you can see.',
      watch:
        'Missing outcomes that look alike, or counting the overlap twice where two groups meet.',
    },
    {
      do: 'Re-read whether the question wants the thing or the opposite of it.',
      because:
        'P(not A) is 1 − P(A), and "at least one" is nearly always quicker through the opposite.',
      watch:
        'Answering the complement by accident — giving "not red" when the question asked for red.',
    },
    {
      do: 'For "is it fair" or "which estimate is better", give a reason as well as a number.',
      because:
        'The relative frequency from MORE trials is the better estimate, and the mark is for saying so.',
      watch:
        'The gambler\'s fallacy. A run of reds does not make blue more likely next time — each pick '
        + 'starts fresh unless something has been removed.',
    },
  ],

  check: [
    'Is the answer between 0 and 1? Anything above 1 means the denominator was too small.',
    'Do the probabilities of everything that could happen add up to 1?',
    'If you are ranking or comparing probabilities, are they all in the same form — all fractions, '
      + 'or all decimals?',
  ],

  higher: {
    note: {
      text: 'On Higher the counting usually comes out of a Venn diagram or a two-way table, and the '
        + 'overlap is where it goes wrong.',
      example: 'Work out the probability that a student studies both subjects.',
    },

    recognise: [
      {
        text: 'Sets that overlap, with "and", "or" or "not" doing the work in the question.',
        example: '… the probability that a student studies French only.',
      },
    ],

    confusableWith: [
      {
        skillId: 'conditional_probability',
        thisOne: 'Everything is out of the whole group.',
        theOther: 'You are told something has already happened, so the total shrinks to just that group.',
        ask: 'Does the question say "given that"? Has the pool already been narrowed?',
      },
    ],

    examples: [
      {
        stem: '60 students are asked about languages. 35 study French, 30 study German and 12 study '
          + 'both. One student is chosen at random. Work out the probability they study French only.',
        isThisSkill: true,
        cue: 'The 12 sit in the overlap, so French only is 35 − 12. The denominator is all 60 — '
          + 'including the 7 who study neither.',
      },
    ],

    steps: [
      {
        do: 'Fill the overlap FIRST, then work outwards, then check every region adds to the total.',
        because:
          'Each region is defined by what is left once the intersection is known, and the group '
          + 'outside both sets only shows up when the rest is filled in.',
        watch:
          'Double counting the overlap — adding 35 and 30 counts those 12 twice — and forgetting '
          + 'anyone who is in neither set.',
      },
    ],

    check: [
      'Do all the regions, including the one outside both sets, add up to the total?',
      'If two things are taken without replacement, has the total gone down for the second one?',
    ],
  },
}
