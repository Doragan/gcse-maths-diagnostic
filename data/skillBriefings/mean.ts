import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Mean — fourteenth authored briefing, and the first in Probability and Data,
// which had no briefing at all. It also closes a one-directional comparison:
// compoundUnits.ts has named `mean` since it was written, targeting its own
// dominant trap, and there was no page on this side to say the same back.
//
// Adding a list up and dividing is not where the marks go. The coded parts are
// mostly backwards or comparative: `mean_to_total` and
// `equate_the_age_sum_to_the_mean` (the mean is given, something else is
// missing), `average_the_two_means` (two groups of different sizes), and a large
// decision-justify share where the answer is a SENTENCE —
// `compare_without_naming_the_measure`, `state_values_without_a_comparison`,
// `name_a_better_average_without_a_reason`. Step 2 and step 3 are those.
//
// Higher is almost entirely grouped data, where `class_bound_used_as_midpoint`,
// `use_boundary_not_midpoint` and `divide_by_the_number_of_classes` take over.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const meanBriefing: SkillBriefing = {
  skillId: 'mean',

  summary:
    'Adding the values and dividing by how many there are — and, just as often, running that backwards.',

  recognise: [
    {
      text: 'The word mean or average, with a list, a table or a chart to take the numbers from.',
      example: 'Work out the mean number of goals scored.',
    },
    {
      text: 'The mean is GIVEN, and a value or a total is what is missing.',
      example: 'The mean of 5 numbers is 12. Four of them are 8, 11, 14 and 9.',
    },
    {
      text: 'Two sets to compare, where the answer is a sentence rather than a number.',
      example: 'Compare the times of the two teams.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in compoundUnits.ts — same distinction, other side.
      skillId: 'compound_units',
      thisOne: 'Add the values and divide by how many there are. Every value counts equally.',
      theOther: 'One overall rate, worked out from the totals — all the distance over all the time.',
      ask: 'Am I averaging a list of numbers, or working out one rate from two totals?',
    },
    {
      skillId: 'median',
      thisOne: 'Everything is shared out evenly, so one extreme value pulls the answer towards it.',
      theOther: 'The middle value once they are in order. An extreme value barely moves it.',
      ask: 'Does the question want the total shared out evenly, or the middle of the list?',
    },
  ],

  examples: [
    {
      stem: 'The mean of 5 numbers is 12. Four of the numbers are 8, 11, 14 and 9. '
        + 'Work out the fifth number.',
      isThisSkill: true,
      cue: 'The mean is given and a value is missing. Turn the mean into a total first: 5 × 12 = 60.',
    },
    {
      stem: 'Ten students scored a mean of 6 marks. Five other students scored a mean of 9 marks. '
        + 'Work out the mean mark of all 15 students.',
      isThisSkill: true,
      cue: 'Two groups of different sizes, so totals first — 60 and 45. Averaging 6 and 9 would be wrong.',
    },
    {
      stem: 'A car travels 150 km in 2 hours. Work out its average speed.',
      isThisSkill: false,
      actuallySkillId: 'compound_units',
      cue: '"Average" here means a rate joining two quantities, km/h. There is no list of values to divide.',
    },
    {
      stem: 'Nine people work at a company. One of them earns far more than the other eight. '
        + 'Which average best represents the salaries? Give a reason.',
      isThisSkill: false,
      actuallySkillId: 'median',
      cue: 'One extreme value drags the mean upwards but barely moves the middle value. This asks '
        + 'WHICH average, and the mark is for the reason.',
    },
  ],

  steps: [
    {
      do: 'Add every value, then divide by HOW MANY values there are.',
      because:
        'Both halves are marked separately: a correct total divided by the wrong count still loses '
        + 'the accuracy mark.',
      watch:
        'Dividing by the wrong count — dropping a zero from the list, or dividing by the number of '
        + 'rows in a table rather than the number of items.',
    },
    {
      do: 'If the mean is given, multiply it by the count to get the TOTAL, and work from there.',
      because:
        'Mean × count = total is what unlocks every backwards question: missing values, combined '
        + 'groups, and "what must they score next time".',
      watch:
        'Averaging two means. Ten marks averaging 6 and five averaging 9 give 105 ÷ 15 = 7, not 7.5 — '
        + 'the groups are different sizes.',
    },
    {
      do: 'If you are asked to compare, name the measure and say what it means in the context.',
      because:
        'The marks are for the sentence, not the arithmetic — typically one for an average and one '
        + 'for a spread, both in the words of the question.',
      watch:
        'Writing two numbers down and stopping. "Team A\'s mean is 12.4 and Team B\'s is 10.1" is not '
        + 'a comparison until you say which is better, and why that matters here.',
    },
  ],

  check: [
    'Is the mean between the smallest and largest value? Outside them, the total or the count is wrong.',
    'Does it look about right? The mean normally sits near the middle of the numbers you were given.',
    'If you compared two sets, have you mentioned both an average AND a spread, in context?',
  ],

  higher: {
    note: {
      text: 'On Higher the data is nearly always grouped, so the mean is an ESTIMATE built from the '
        + 'midpoint of each class.',
      example: 'Work out an estimate of the mean weight from the grouped frequency table.',
    },

    recognise: [
      {
        text: 'A table of class intervals rather than single values, so no exact value is known.',
        example: '20 < w ≤ 30',
      },
    ],

    examples: [
      {
        stem: 'A grouped frequency table gives times in the classes 0 < t ≤ 10, 10 < t ≤ 20 and '
          + '20 < t ≤ 30, with frequencies 4, 10 and 6. Work out an estimate of the mean.',
        isThisSkill: true,
        cue: 'Classes, not values. Use the midpoints — 5, 15 and 25 — each weighted by its frequency.',
      },
    ],

    steps: [
      {
        do: 'Take the MIDPOINT of each class, multiply by the frequency, add those products, then '
          + 'divide by the total frequency.',
        because:
          'The real values are unknown, and the midpoint is the best single stand-in for them. That '
          + 'is exactly why the answer is only an estimate.',
        watch:
          'Using a class boundary instead of the midpoint, or dividing by the number of classes '
          + 'rather than the total frequency.',
      },
    ],

    check: [
      'Did you divide by the sum of the frequency column, not by how many rows the table has?',
      'Does the estimate sit inside the range of the data, and somewhere near the biggest class?',
    ],
  },
}
