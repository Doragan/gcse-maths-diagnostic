import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Ratio — second authored briefing, and the mirror of `proportion`.
//
// The `proportion` guide already names ratio as its nearest neighbour, so the
// comparison here is deliberately the same distinction told from the other
// side. If one is reworded the other has to move with it; guides.test.ts
// asserts the pairing stays reciprocal.
//
// Ratio differs from proportion in one way that matters for teaching: it IS
// often signposted. The colon form is usually printed on the page (bare 14% on
// Foundation, 19% on Higher, against 4% for proportion), so recognition is a
// smaller part of the difficulty and execution a larger one. The recurring
// misconception across the coded papers is `use_part_to_part_as_part_to_whole`
// — reading 2 : 3 as "2 out of 3" rather than "2 out of 5".
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const ratioBriefing: SkillBriefing = {
  skillId: 'ratio',

  summary:
    'One total shared into parts, where the parts add back up to the whole.',

  recognise: [
    {
      text: 'The colon form printed in the question is the strongest tell, and unlike most skills '
        + 'it is usually there in plain sight.',
      example: '… divide £4500 in the ratio 4 : 5 …',
    },
    {
      text: 'Words that mean splitting one thing up: share, split, divide between, for every.',
      example: 'Rana and Sam share the prize money between them.',
    },
    {
      text: 'There is a single total, and the parts you are asked about must add back up to it.',
      example: 'A 20 kg bag of mix contains cement and sand.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in proportion.ts — same distinction, other side.
      skillId: 'proportion',
      thisOne: 'One total, shared out into parts that add back up to that total.',
      theOther: 'Two quantities that move together. Scale one up and the other scales with it.',
      ask: 'Is there a total being shared out, or two things moving together?',
    },
    {
      // Directly targets the most frequent coded trap on this skill.
      skillId: 'fractions_of_amounts',
      thisOne: 'The numbers compare the parts to EACH OTHER. In 3 : 5 there are 8 shares altogether.',
      theOther: 'The number is a share of the WHOLE already. 3/8 means 3 out of every 8.',
      ask: 'Is this number comparing two parts, or telling me a share of the total?',
    },
  ],

  // Two that are ratio, two that are not. The pens question is deliberately the
  // same stem that appears as a YES on the proportion page — a student who has
  // read both should see the same question answered from both sides.
  examples: [
    {
      stem: 'Amara and Ben share £60 in the ratio 2 : 3. Work out how much Ben receives.',
      isThisSkill: true,
      cue: 'One total (£60) split between two people, and the shares add back up to it.',
    },
    {
      stem: 'A mortar mix uses cement and sand in the ratio 1 : 4. Work out how much sand is needed for 8 kg of cement.',
      isThisSkill: true,
      cue: 'The colon form is printed, and the two amounts are parts of one mix.',
    },
    {
      stem: '8 identical pens cost £3.60. Work out the cost of 14 pens.',
      isThisSkill: false,
      actuallySkillId: 'proportion',
      cue: 'Nothing is being shared out. Pens and pounds are two quantities moving together, '
        + 'so this scales rather than splits.',
    },
    {
      stem: 'In a year group of 32 students, 3/8 walk to school. Work out how many walk.',
      isThisSkill: false,
      actuallySkillId: 'fractions_of_amounts',
      cue: '3/8 is already a share of the whole year group, not a comparison between two parts. '
        + 'There is no second quantity to balance against.',
    },
  ],

  steps: [
    {
      do: 'Add the numbers in the ratio to find how many shares the total splits into.',
      because:
        'Everything else follows from this one number. Turning 2 : 3 into "5 shares" is what makes '
        + 'the total divisible, and it is usually where the first method mark sits.',
      watch:
        'Treating one of the parts as if it were the whole. In 2 : 3 the total is 5 shares, not 3 — '
        + 'this is the single most common way these questions are lost.',
    },
    {
      do: 'Divide the total by the number of shares to find what one share is worth.',
      because:
        'One share is the unit the rest of the question is built from, and it is worth writing down '
        + 'even when you think you can do it in your head.',
      watch:
        'Dividing by one of the parts rather than by the number of shares.',
    },
    {
      do: 'Multiply one share by the number of parts the question actually asked for.',
      because:
        'The arithmetic is safe once one share is known — what is left is reading the question correctly.',
      watch:
        'Answering for the wrong person or the wrong part. On these questions "read the wrong name" '
        + 'costs as many marks as bad arithmetic.',
    },
  ],

  check: [
    'Do the shares add back up to the total you started with? If Amara gets £24 and Ben gets £36, '
      + 'that has to come to £60. If it does not, something went wrong earlier.',
    'Is the larger share going to the larger number of parts? If Ben has 3 parts to Amara’s 2, '
      + 'Ben cannot end up with less.',
    'If the answer itself is a ratio, is it in its simplest form? Marks are lost here for leaving '
      + '4 : 6 rather than 2 : 3.',
  ],

  higher: {
    note: {
      text: 'On Higher the ratio is often unknown or changing — you are given a situation before and '
        + 'after something happens, and have to work backwards to the original amounts.',
      example: 'The ratio of red to blue is 5 : 3. After 4 red are removed, the ratio becomes 3 : 2.',
    },

    recognise: [
      {
        text: 'The ratio changes partway through, and you are given both the before and the after.',
        example: '… after 5 counters are removed, the ratio becomes 3 : 2 …',
      },
      {
        text: 'The parts are given as expressions rather than numbers, or the answer is asked for '
          + 'as a ratio in terms of n.',
        example: 'Write the ratio of the perimeters in the form n : 1.',
      },
    ],

    confusableWith: [
      {
        skillId: 'simultaneous_equations',
        thisOne: 'One unknown carries the ratio: the parts are 2n and 3n, and one equation finds n.',
        theOther: 'Two genuinely independent unknowns, needing two equations to pin both down.',
        ask: 'Can I write both quantities using the same single letter, or do I need two?',
      },
    ],

    examples: [
      {
        stem: 'A bag holds red and blue counters in the ratio 5 : 3. After 4 red counters are removed, '
          + 'the ratio becomes 3 : 2. Work out how many blue counters are in the bag.',
        isThisSkill: true,
        cue: 'A ratio before and a ratio after. Writing the amounts as 5n and 3n is what makes the '
          + 'second condition solvable.',
      },
    ],

    steps: [
      {
        do: 'Write both quantities as multiples of the same letter: 5n and 3n.',
        because:
          'A single unknown carries the ratio through the change. That is precisely what lets one '
          + 'equation resolve the whole problem.',
        watch:
          'Using two different letters. That throws the ratio away and leaves you with one equation '
          + 'and two unknowns, which cannot be solved.',
      },
      {
        do: 'Write the "after" situation as a second ratio and set it equal to the one given.',
        because:
          'Cross-multiplying turns the second ratio into a normal linear equation in n.',
        watch:
          'Applying the change to both parts when only one of them changed.',
      },
    ],

    check: [
      'Substitute n back and check BOTH ratios — the one before the change and the one after. '
        + 'Getting the first right and the second wrong is the usual sign of a slip.',
      'Is n a whole number? Counters, people and coins cannot come in fractions, so a fractional n '
        + 'means the equation was set up wrongly.',
    ],
  },
}
