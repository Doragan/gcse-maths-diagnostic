import type { SkillGuide } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Compound units — third authored guide, and the hardest recognition case in
// the cluster.
//
// Across all 30 coded papers this skill is asked outright ZERO times on either
// tier. It always arrives as a journey, a material, or a price comparison, and
// the student has to notice a rate is wanted at all. That makes `recognise`
// carry more weight here than anywhere else so far.
//
// One misconception dominates the coded traps: `average_the_two_speeds`, five
// separate appearances — taking the mean of two speeds instead of dividing
// total distance by total time. Both the method and the self-check below are
// built around killing it, and it is why `mean` is listed as a confusable
// rather than something closer in the topic.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const compoundUnitsGuide: SkillGuide = {
  skillId: 'compound_units',

  summary:
    'A rate that ties two different measures together — miles per hour, grams per cm³, pounds per kilogram.',

  recognise: [
    {
      text: 'The word "per", or a unit written as a fraction. If the answer line has one of these, '
        + 'the question is asking for a rate.',
      example: 'Answer ________ g/cm³',
    },
    {
      text: 'Two quantities of genuinely different kinds that have to be combined — a distance and '
        + 'a time, a mass and a volume, a price and a weight.',
      example: 'The journey is 150 km and takes 2 hours 30 minutes.',
    },
    {
      text: 'A comparison between two options where the amounts are not alike, so they cannot be '
        + 'compared until each is reduced to a rate.',
      example: 'Which pack is better value? Show your working.',
    },
  ],

  confusableWith: [
    {
      // Targets the dominant coded trap head-on.
      skillId: 'mean',
      thisOne: 'One overall rate, worked out from the totals — all the distance over all the time.',
      theOther: 'A mean adds the values up and divides by how many there are, weighting each equally.',
      ask: 'Am I averaging a list of numbers, or working out one rate from two totals?',
    },
    {
      // Mirror of the entry in proportion.ts — same distinction, other side.
      skillId: 'proportion',
      thisOne: 'You are asked for a rate that joins both quantities — grams per cm³, miles per hour.',
      theOther: 'You are asked for more of something you were already given — more grams, more pounds.',
      ask: 'Does the answer need two units joined by "per", or just one?',
    },
  ],

  examples: [
    {
      stem: 'A train travels 150 km in 2 hours 30 minutes. Work out its average speed in km/h.',
      isThisSkill: true,
      cue: 'A distance and a time, and the answer line asks for km/h — a rate.',
    },
    {
      stem: 'Priya drives 30 miles at 60 mph, then a further 30 miles at 20 mph. '
        + 'Work out her average speed for the whole journey.',
      isThisSkill: true,
      cue: 'Still a rate, and the one most often got wrong. The answer is not 40 mph — '
        + 'she spends far longer on the slow half, so the totals have to be worked out first.',
    },
    {
      stem: 'Five parcels weigh 2.1 kg, 1.8 kg, 2.4 kg, 1.9 kg and 2.3 kg. Work out the mean weight.',
      isThisSkill: false,
      actuallySkillId: 'mean',
      cue: 'There is only one kind of quantity here — weights. Nothing is being measured against '
        + 'anything else, so there is no rate and no "per".',
    },
  ],

  steps: [
    {
      do: 'Write down the two quantities you have, each with its unit.',
      because:
        'The unit the answer is asked in tells you which way round to divide. "Miles per hour" '
        + 'means miles ÷ hours, every time, and writing the units down makes that impossible to get backwards.',
      watch:
        'Mixed time units. 2 hours 30 minutes is 2.5 hours, not 2.3 — and 20 minutes is one third '
        + 'of an hour, not 0.2 of one.',
    },
    {
      do: 'Convert both quantities into the units the answer needs, before dividing anything.',
      because:
        'Converting afterwards means converting a rate rather than a quantity, which is far easier '
        + 'to get wrong.',
      watch:
        'Going the wrong way with 60. Minutes into hours is ÷ 60; hours into minutes is × 60.',
    },
    {
      do: 'Divide: the quantity named first, by the quantity named after "per".',
      because:
        'With the units already right, this is the only arithmetic left.',
      watch:
        'For a journey in two parts, never average the two speeds. Add the distances, add the times, '
        + 'then divide once at the end.',
    },
  ],

  check: [
    'Does the unit on your answer match what the question asked for — km/h, g/cm³, £ per kg?',
    'Is the size believable? A car at 500 mph, or someone walking at 0.5 mph, means something has '
      + 'gone wrong with a conversion.',
    'For a journey in two parts: your answer must sit between the two speeds, and closer to the one '
      + 'you spent longer travelling at. Landing exactly halfway is the sign you averaged them.',
  ],

  higher: {
    note: {
      text: 'On Higher, rates rarely stand alone. They arrive as the gradient of a graph, or wrapped '
        + 'around a volume formula, so the rate is one step inside a longer problem.',
      example: 'The metal has density 8.9 g/cm³. Work out the mass of the hemisphere.',
    },

    recognise: [
      {
        text: 'A distance–time or velocity–time graph, where the gradient of the line IS the rate.',
        example: 'Work out the gradient of the line between t = 2 and t = 6.',
      },
      {
        text: 'Density given alongside a volume formula — sphere, cone, cylinder or prism.',
        example: 'A solid cone of radius 5 cm is made from wood of density 0.7 g/cm³.',
      },
    ],

    confusableWith: [
      {
        skillId: 'kinematic_graphs',
        thisOne: 'The rate is the number you want, and the graph is just where it is stored.',
        theOther: 'The shape of the graph is the answer — describing the motion, or the area beneath it.',
        ask: 'Am I being asked for a value, or for what the graph is telling me?',
      },
    ],

    examples: [
      {
        stem: 'A solid metal hemisphere has radius 3 cm. The metal has density 8.9 g/cm³. '
          + 'Work out the mass of the hemisphere.',
        isThisSkill: true,
        cue: 'Density is a rate, but the volume has to come first — and it is a hemisphere, not a sphere.',
      },
    ],

    steps: [
      {
        do: 'If the rate comes from a graph, read it as the change up divided by the change across, '
          + 'and carry the units through.',
        because:
          'The gradient of a distance–time graph is a speed; of a velocity–time graph, an acceleration. '
          + 'Naming the units as you read stops the two being confused.',
        watch:
          'Reading one axis in minutes and the other in hours without converting.',
      },
      {
        do: 'If a volume formula is involved, work the volume out fully before applying the rate.',
        because:
          'Density questions are two steps, and the method marks are usually split across both.',
        watch:
          'Using the whole-solid formula for a half solid. Hemispheres need halving, and this is one '
          + 'of the most frequently penalised slips on these questions.',
      },
    ],

    check: [
      'If you used a volume formula, was the shape whole or half? A hemisphere answer that matches '
        + 'the full sphere is wrong by exactly a factor of two.',
      'Do the units of your gradient make sense as the thing being asked for — a speed, or a rate of change?',
    ],
  },
}
