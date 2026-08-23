import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Inverse proportion — fifth authored briefing, and the most single-minded of
// the cluster.
//
// One misconception accounts for nearly every coded trap on this skill:
// `direct_vs_inverse_relationship`, `direct_instead_of_inverse`,
// `direct_vs_inverse` and `treat_as_direct_proportion` are four labels for the
// same mistake, six appearances between them. There is no second error worth
// competing for the space, so the method, the comparison cards and the first
// self-check all point at it.
//
// The mechanical tell is worth stating plainly: direct proportion divides to a
// constant, inverse multiplies to one. Everything else follows.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const inverseProportionBriefing: SkillBriefing = {
  skillId: 'inverse_proportion',

  summary:
    'Two quantities where one going up makes the other go down — and multiplying them always gives the same number.',

  recognise: [
    {
      text: 'More of one thing means less of the other. The total work, or the total amount to share, is fixed.',
      example: '6 people build a wall in 10 days.',
    },
    {
      text: 'The words "inversely proportional", which on these questions are usually stated outright.',
      example: 'y is inversely proportional to x.',
    },
    {
      text: 'A table where one row rises as the other falls — and the pairs multiply to the same number.',
      example: '6 × 10 = 60, and 12 × 5 = 60.',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in proportion.ts — same distinction, other side.
      skillId: 'proportion',
      thisOne: 'One goes up, and the other goes down. Twice the workers, half the time.',
      theOther: 'One goes up, and the other goes up with it. Twice the flapjacks, twice the oats.',
      ask: 'If I double the first quantity, does the second one double too, or halve?',
    },
    {
      skillId: 'direct_proportion',
      thisOne: 'Multiply the pair together and you get the same number every time. xy = k.',
      theOther: 'Divide one by the other and you get the same number every time. y ÷ x = k.',
      ask: 'Do the pairs multiply to a constant, or divide to one?',
    },
  ],

  examples: [
    {
      stem: 'It takes 4 painters 9 hours to paint a hall. Work out how long it would take 6 painters.',
      isThisSkill: true,
      cue: 'More painters, fewer hours. The job is fixed at 36 painter-hours however many people turn up.',
    },
    {
      stem: 'y is inversely proportional to x. When x = 5, y = 12. Work out y when x = 4.',
      isThisSkill: true,
      cue: 'Stated outright, and xy = 60 holds for every pair.',
    },
    {
      stem: '5 workers lay 200 bricks in an hour. Work out how many bricks 8 workers lay in an hour.',
      isThisSkill: false,
      actuallySkillId: 'proportion',
      cue: 'More workers, MORE bricks — both go up together. Nothing is being shared out, so this scales.',
    },
  ],

  steps: [
    {
      do: 'Multiply the pair you were given together. That product is the constant.',
      because:
        'In inverse proportion the product never changes, so one multiplication gives you the number the '
        + 'whole question turns on — and writing it down earns the method mark.',
      watch:
        'Dividing instead of multiplying. Dividing is what direct proportion needs, and mixing the two up '
        + 'is by far the most common way these are lost.',
    },
    {
      do: 'Divide that constant by the new value to get the answer.',
      because:
        'Since the product is fixed, the missing half of the new pair is the constant divided by the half '
        + 'you have.',
      watch:
        'Stopping at the constant and writing that down as the answer.',
    },
  ],

  check: [
    'Did your answer move the OPPOSITE way to the input? More painters must mean fewer hours. '
      + 'If both went up, you have treated it as direct proportion.',
    'Multiply your answer by its pair. You should get back exactly the constant you started with.',
    'Does the size make sense? Going from 4 painters to 6 is one and a half times as many, so the time '
      + 'should come down to about two thirds — not to a half, and not to a quarter.',
  ],

  higher: {
    note: {
      text: 'On Higher it is written algebraically rather than described, and the relationship often carries '
        + 'a power — which changes how much the second quantity moves.',
      example: 'y is inversely proportional to the square of x.',
    },

    recognise: [
      {
        text: 'The form y = k ÷ x, or the words "inversely proportional to the square / cube / square root of x".',
        example: 'W is inversely proportional to the square root of d.',
      },
      {
        text: 'A curve that falls away towards both axes without ever touching them.',
        example: 'Sketch the graph of y against x.',
      },
    ],

    confusableWith: [
      {
        skillId: 'proportion_with_powers',
        thisOne: 'y = k ÷ x². Double x and y drops to a quarter.',
        theOther: 'y = kx². Double x and y goes up four times.',
        ask: 'Is the x underneath the fraction, or multiplied?',
      },
    ],

    examples: [
      {
        stem: 'F is inversely proportional to the square of d. When d = 3, F = 20. Work out F when d = 6.',
        isThisSkill: true,
        cue: 'The power is on d, and d doubles — so F falls to a quarter, not a half.',
      },
    ],

    steps: [
      {
        do: 'Write y = k ÷ x — or k ÷ x² for a squared relationship — and substitute the pair to find k.',
        because:
          'k is fixed for the whole question. Find it once and every later part falls out of the same equation.',
        watch:
          'Writing y = kx when y falls as x rises. If the quantities move in opposite directions, x belongs '
          + 'on the bottom.',
      },
    ],

    check: [
      'Substitute back into your equation. If it does not reproduce the pair you were given, k is wrong.',
      'For a squared relationship, doubling x should quarter y. If your answer only halved, the power '
        + 'was dropped somewhere.',
    ],
  },
}
