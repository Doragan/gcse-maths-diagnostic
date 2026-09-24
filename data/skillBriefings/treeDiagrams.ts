import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Tree diagrams — sixteenth authored briefing, and the one that closes the
// Probability and Data cluster.
//
// Every coded Foundation part is bare: the diagram is printed and partly filled
// in, so recognition barely matters there and execution is everything. The
// traps are four, and each has a step: `add_not_multiply` / `multiply_vs_add_branches`,
// `use_the_same_probabilities_for_both_bags` (the without-replacement error, and
// the most frequent of the lot), `complement_error` / `at_least_one_complement`,
// and `branches_sum_to_one`.
//
// The `frequency_trees` comparison has no page to point at yet, which is normal
// — the card renders without a link. It is worth making anyway: the two
// diagrams look identical and differ only in what rides on the branches.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const treeDiagramsBriefing: SkillBriefing = {
  skillId: 'tree_diagrams',

  summary:
    'Two or more events one after the other, drawn as branches — multiply along a path, add between paths.',

  recognise: [
    {
      text: 'The diagram is usually printed for you, with some of the branches left blank.',
      example: 'Complete the tree diagram.',
    },
    {
      text: 'Two picks, throws or games in a row, rather than a single event.',
      example: 'Two counters are taken from the bag, one after the other.',
    },
    {
      text: '"Without replacement", or anything that says the first thing is not put back.',
      example: 'She does not replace the first counter.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in calculatingSimpleProbability.ts.
      skillId: 'calculating_simple_probability',
      thisOne: 'Two or more events in a row, where you multiply along the branches.',
      theOther: 'One event. The probability is a count over a count.',
      ask: 'Does something happen once, or one thing after another?',
    },
    {
      skillId: 'frequency_trees',
      thisOne: 'The branches carry probabilities — fractions or decimals, which multiply.',
      theOther: 'The branches carry NUMBERS of people or things, which add back to the total.',
      ask: 'Are the numbers on the branches probabilities, or counts?',
    },
  ],

  examples: [
    {
      stem: 'A bag contains 5 red and 3 blue counters. Two counters are taken without replacement. '
        + 'Work out the probability that both are red.',
      isThisSkill: true,
      cue: 'Two picks in a row, and the bag changes between them: 5/8 and then 4/7.',
    },
    {
      stem: 'The probability that it rains on any day is 0.3. Work out the probability that it rains '
        + 'on exactly one of the next two days.',
      isThisSkill: true,
      cue: 'Two routes through the tree — rain then dry, or dry then rain — so multiply along each and add them.',
    },
    {
      stem: 'A bag contains 5 red, 3 blue and 2 green counters. One counter is taken at random. '
        + 'Work out the probability that it is blue.',
      isThisSkill: false,
      actuallySkillId: 'calculating_simple_probability',
      cue: 'One pick, and nothing follows it. There are no branches to multiply along.',
    },
    {
      stem: 'Of 80 patients, 50 were given the new drug and 35 of those recovered. '
        + 'Complete the frequency tree.',
      isThisSkill: false,
      actuallySkillId: 'frequency_trees',
      cue: 'The branches carry counts of people. They add back to 80 rather than multiplying towards 1.',
    },
  ],

  steps: [
    {
      do: 'Fill in every branch, using "1 minus" for the second option at each fork.',
      because:
        'A pair of branches from the same point always adds to 1, which fills the blanks and checks '
        + 'the ones you were given.',
      watch:
        'Two branches from one point that do not add to 1 — a sign that something earlier is wrong.',
    },
    {
      do: 'Decide whether the bag changes. Without replacement, the second set of branches has a '
        + 'total one smaller.',
      because:
        'The second set of branches is the whole difficulty of these questions: one item has been '
        + 'removed, so the denominator drops.',
      watch:
        'Reusing the first probabilities for the second pick — the most common error on the coded '
        + 'papers — or dropping the denominator while forgetting the numerator when the same colour went.',
    },
    {
      do: 'Multiply ALONG a path, and add BETWEEN paths.',
      because:
        '"And" as you travel one route, "or" when more than one route counts as a win.',
      watch:
        'Adding along a path. If the answer is bigger than the branch probabilities that made it, '
        + 'you have added where you should have multiplied.',
    },
    {
      do: 'For "at least one", work out the probability of NONE and subtract from 1.',
      because:
        'One subtraction replaces adding up every other route, and it is the method the mark scheme '
        + 'is written around.',
      watch:
        'Forgetting that "at least one" includes both of them, not just exactly one.',
    },
  ],

  check: [
    'Do the probabilities of all the final outcomes add up to 1?',
    'Is each path\'s answer smaller than the branch probabilities that made it? Multiplying '
      + 'fractions makes them smaller.',
    'If it was without replacement, does the second denominator go down by one?',
  ],

  higher: {
    note: {
      text: 'On Higher the tree is often not drawn for you, there may be three stages, and the answer '
        + 'usually feeds into something else.',
      example: 'The probability the machine fails is 0.05 on each of three days.',
    },

    recognise: [
      {
        text: 'Three stages rather than two, or a probability that then gets applied to a population.',
        example: '… and 40% of the 5000 customers were affected.',
      },
    ],

    examples: [
      {
        stem: 'A machine fails on any day with probability 0.05, independently of other days. '
          + 'Work out the probability that it fails on at least one of three days.',
        isThisSkill: true,
        cue: '"At least one" over three days is 1 minus the probability it never fails: 1 − 0.95³.',
      },
    ],

    steps: [
      {
        do: 'With three or more stages, reach for the complement instead of drawing every branch.',
        because:
          '1 − 0.95³ replaces adding seven separate routes, and there is far less to get wrong.',
        watch:
          'Cubing the wrong probability. It is 0.95 — the chance of NOT failing — that gets cubed, not 0.05.',
      },
    ],

    check: [
      'Does the answer sit between the one-day probability and 1? Three chances to fail must be '
        + 'likelier than one.',
      'If the probability then feeds into a population, have you applied it to the right group?',
    ],
  },
}
