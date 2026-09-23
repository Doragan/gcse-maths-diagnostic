import type { SkillBriefing } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Converting measurements — thirteenth authored briefing, and the first written
// on its own rather than as part of a cluster. It earns that because it is heavy
// at Foundation (AQA: 18 parts, 41 marks) and because its single comparison,
// with compound units, already had a page to point at.
//
// The defining fact from the audit: it is almost never the question. Only a
// small share of coded parts are bare "convert this"; the rest are real-world
// and multi-route questions where the conversion is a hidden step inside
// something else. So the coded traps are overwhelmingly about NOT NOTICING —
// `compare_without_converting`, `mixed_units_cm_and_m`, `mixed_units_m_and_km`,
// `forget_cm_to_km_conversion`, `units_not_converted` — followed by
// `invert_the_conversion` and `wrong_power_of_ten` for those who do notice.
// `units_omitted` matters too: one coded mark split literally reads
// "A1 (units required)".
//
// Hence a method that opens with a scan for mismatched units rather than with
// any arithmetic, and a first cue that says the mismatch IS the instruction.
//
// Higher shifts to area and volume, where `area_unit_conversion_direction` and
// `premature_rounding` take over — that is what the higher block covers.
//
// Do not restate any framing percentage here or in `recognise`: the page
// computes its own headline claim from the audit.
// ─────────────────────────────────────────────────────────────────────────────

export const convertingMeasurementsBriefing: SkillBriefing = {
  skillId: 'converting_measurements',

  summary:
    'Rewriting a measurement in different units — usually as a hidden step inside a question about something else.',

  recognise: [
    {
      text: 'Two measurements in one question, written in different units. Nothing tells you to '
        + 'convert: the mismatch itself is the instruction.',
      example: 'A 2 m plank is cut into 40 cm pieces.',
    },
    {
      text: 'You are asked to compare, add or subtract amounts that are not in the same unit.',
      example: 'Which is heavier, 0.45 kg or 480 g?',
    },
    {
      text: 'The answer line names a unit that the question never used.',
      example: 'Answer ________ km',
    },
  ],

  confusableWith: [
    {
      // Mirror of the entry in compoundUnits.ts — same distinction, other side.
      skillId: 'compound_units',
      thisOne: 'One measurement rewritten another way. 1.6 m and 1600 mm are the same length.',
      theOther: 'Two different quantities joined into a rate — miles per hour, grams per cm³.',
      ask: 'Is one measurement being rewritten, or are two quantities being combined into a "per"?',
    },
  ],

  examples: [
    {
      stem: 'A piece of ribbon is 2 m long. Nadia cuts off 3 pieces, each 45 cm long. '
        + 'How much ribbon is left, in cm?',
      isThisSkill: true,
      cue: 'Metres and centimetres in the same question, and the answer line says cm. Convert before subtracting.',
    },
    {
      stem: 'Which is heavier, 0.45 kg or 480 g? You must show your working.',
      isThisSkill: true,
      cue: 'Two masses in different units. Rewriting one of them as the other IS the question.',
    },
    {
      stem: '6 books weigh 2.4 kg. Work out the weight of 15 books.',
      isThisSkill: false,
      actuallySkillId: 'proportion',
      cue: 'Both weights are already in kg. Nothing needs rewriting — the two quantities scale together.',
    },
    {
      stem: 'A car travels 150 km in 2 hours. Work out its average speed.',
      isThisSkill: false,
      actuallySkillId: 'compound_units',
      cue: 'The answer joins two quantities into a rate, km/h. No measurement is being rewritten.',
    },
  ],

  steps: [
    {
      do: 'Before any arithmetic, scan the question for two different units — and convert everything to one of them.',
      because:
        'These are rarely "convert this" questions. They are questions about something else where the '
        + 'units quietly disagree, and noticing is most of the mark.',
      watch:
        'Working the whole thing through in mixed units and only noticing at the end, by which time '
        + 'the arithmetic is already wrong.',
    },
    {
      do: 'Decide the direction by asking whether the number should come out bigger or smaller.',
      because:
        'Metres into centimetres makes the number bigger, so multiply by 100; centimetres into metres '
        + 'makes it smaller, so divide. The question answers itself.',
      watch:
        'Inverting the conversion, or slipping a power of ten. 450 cm is 4.5 m — not 45 m, and not 45000 m.',
    },
    {
      do: 'Convert into the unit the ANSWER LINE asks for, not the one the question opened with.',
      because:
        'The final mark is for the value in the right unit, and on some mark schemes the unit has to '
        + 'be written down to earn it at all.',
      watch:
        'Leaving the unit off. Where a mark scheme says "units required", an unlabelled number scores nothing.',
    },
  ],

  check: [
    'Does the size make sense? A person 1600 mm tall is believable; 16000 mm would be 16 m.',
    'Is the unit written down, and is it the one the answer line asked for?',
    'If you compared two amounts, are they in the same unit now? Comparing 0.45 kg against 480 g '
      + 'without converting is the usual way to get it backwards.',
  ],

  higher: {
    note: {
      text: 'On Higher it is usually an AREA or a VOLUME being converted, where the factor is squared '
        + 'or cubed rather than applied once.',
      example: 'A field has an area of 25000 m². Work out its area in km².',
    },

    recognise: [
      {
        text: 'Units carrying a small 2 or 3, so the conversion factor gets squared or cubed too.',
        example: 'Change 3.2 m³ into cm³.',
      },
    ],

    examples: [
      {
        stem: 'A rectangle measures 1.5 m by 80 cm. Work out its area in cm².',
        isThisSkill: true,
        cue: 'Convert the metres to centimetres FIRST, then multiply. Converting the area afterwards '
          + 'is where the factor goes wrong.',
      },
    ],

    steps: [
      {
        do: 'For an area, square the length factor; for a volume, cube it. 1 m = 100 cm, so 1 m² = '
          + '10000 cm² and 1 m³ = 1000000 cm³.',
        because:
          'The conversion applies in every dimension at once. Using the length factor on an area is '
          + 'the single most common Higher slip on this skill.',
        watch:
          'Multiplying an area by 100 instead of 10000 — and going the wrong way as well, which hides '
          + 'the error because the answer still looks tidy.',
      },
    ],

    check: [
      'Sanity-check with the smallest case. A 1 m square is 100 cm by 100 cm, so 10000 cm². If your '
        + 'factor is not 10000, it is wrong.',
      'Keep the conversion exact and round only at the end — rounding partway through is penalised '
        + 'on these questions.',
    ],
  },
}
