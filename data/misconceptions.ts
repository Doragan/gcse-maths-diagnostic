// ─────────────────────────────────────────────────────────────────────────────
// The misconception taxonomy — a small, deliberately reusable vocabulary for
// WHY an answer was wrong, shared across questions and skills.
//
// Every authored trap already carries a `response` explaining the mistake, but
// that response is free text written for one question. Two students making the
// same mistake in proportion and in compound units get two unrelated messages,
// and nothing can count how often a student makes it. A shared id is what turns
// 677 individual explanations into something you can aggregate.
//
// ── Why this is NOT the exam-audit trap vocabulary ───────────────────────────
//
// data/exam-audit/*.json codes traps too, and it is tempting to reuse those
// labels directly. They are the wrong shape: 1,281 distinct labels of which
// 1,012 (79%) appear exactly once, because each was written to describe what
// went wrong in ONE exam question. That is a tally, not a taxonomy — adopting
// it wholesale would reproduce the problem it is meant to solve.
//
// So the audit is used as EVIDENCE for choosing entries, not as the entries.
// The 81 labels a coder independently reached for three or more times across 30
// papers are, by that fact, real recurring misconceptions, and several below
// keep the audit's name where it was already the clearest one.
//
// Two vocabularies is a real cost. It is the right one: the audit records
// observations about papers, this records diagnoses about students.
//
// ── Rules ────────────────────────────────────────────────────────────────────
//
//   • Keep it small. A misconception used once is a `response`, not an entry.
//     If a trap fits nothing here, leave its `misconception` null rather than
//     minting a new id — null is legal everywhere.
//   • An entry must be able to fire in more than one skill, or it is a
//     question-specific note in disguise.
//   • misconceptions.test.ts asserts every id used by a trap resolves here, so
//     the vocabulary cannot drift by typo.
// ─────────────────────────────────────────────────────────────────────────────

export type Misconception = {
  id: string
  /** Teacher-facing name. Shown in class-level views, so it must read as a diagnosis. */
  name: string
  /** One line: what the student actually did. */
  description: string
  /**
   * The audit trap label this was seeded from, where one exists. Provenance
   * only — nothing joins on it, and the two vocabularies stay independent.
   */
  seededFrom?: string
}

export const misconceptions: Misconception[] = [
  // ── Rates and compound units ──────────────────────────────────────────────
  {
    id: 'divided_the_wrong_way_round',
    name: 'Divided the wrong way round',
    description: 'Formed the rate as b ÷ a when the question needed a ÷ b — volume ÷ mass rather than mass ÷ volume, time ÷ distance rather than distance ÷ time.',
  },
  {
    id: 'multiplied_instead_of_divided',
    name: 'Multiplied instead of dividing',
    description: 'Combined the two quantities with × when the rate required ÷.',
    seededFrom: 'add_not_multiply',
  },
  {
    id: 'added_instead_of_operating',
    name: 'Added the two quantities',
    description: 'Treated a rate or a scaling as an addition — "speed is distance plus time", or adding the percentage figure straight onto the amount.',
  },
  {
    id: 'averaged_the_rates',
    name: 'Averaged the rates',
    description: 'Took the mean of two speeds instead of total distance ÷ total time, so the two legs were weighted equally when they were not.',
    seededFrom: 'average_the_two_speeds',
  },

  // ── Stopping early ────────────────────────────────────────────────────────
  {
    id: 'stopped_at_an_intermediate',
    name: 'Answered with an intermediate value',
    description: 'The working was right but an intermediate result was given as the answer — the mass rather than the density, the discount rather than the sale price, the constant k rather than y.',
  },
  {
    id: 'stopped_one_step_early',
    name: 'Stopped one step early',
    description: 'Applied a repeated change one time fewer than the question asked — the value after 3 years when 4 were required.',
    seededFrom: 'single_year_only',
  },

  // ── Percentages ───────────────────────────────────────────────────────────
  {
    id: 'percentage_from_the_wrong_base',
    name: 'Percentage taken from the wrong base',
    description: 'Worked the percentage change as a fraction of the new value rather than the original.',
    seededFrom: 'percentage_change_from_the_wrong_base',
  },
  {
    id: 'percent_treated_as_absolute',
    name: 'Treated the percentage as an amount',
    description: 'Subtracted or added the percentage figure itself — took £20 off for "20% off" — instead of finding that percentage of the amount first.',
  },
  {
    id: 'change_found_but_not_applied',
    name: 'Found the change but did not apply it',
    description: 'Correctly calculated the increase or decrease, then gave that figure as the answer instead of adding it to or subtracting it from the original.',
  },
  {
    id: 'simple_instead_of_compound',
    name: 'Used simple instead of compound',
    description: 'Applied the same amount each period rather than the same multiplier, so later periods were not calculated on the grown or reduced amount.',
    seededFrom: 'subtract_the_same_amount_each_year',
  },

  // ── Ratio and proportion ──────────────────────────────────────────────────
  {
    id: 'ratio_order_reversed',
    name: 'Ratio given in the wrong order',
    description: 'Right numbers, wrong order — the parts were not written in the order the question names them.',
    seededFrom: 'ratio_reversed',
  },
  {
    id: 'part_used_as_whole',
    name: 'Confused a part with the whole',
    description: 'Treated one part of a ratio as if it were the total, or applied a fraction of the whole to a share — reading 2 : 3 as "2 out of 3" rather than "2 out of 5".',
    seededFrom: 'use_part_to_part_as_part_to_whole',
  },
  {
    id: 'ratio_left_unsimplified',
    name: 'Ratio not simplified',
    description: 'The ratio is correct but not in its simplest form.',
    seededFrom: 'ratio_left_unsimplified',
  },
  {
    id: 'direct_instead_of_inverse',
    name: 'Treated inverse proportion as direct',
    description: 'Scaled both quantities the same way when one rises as the other falls — more workers should mean fewer days.',
    seededFrom: 'direct_vs_inverse',
  },
  {
    id: 'scale_factor_wrong_power',
    name: 'Wrong power of the scale factor',
    description: 'Used the length scale factor where area needed its square or volume its cube, or the reverse.',
    seededFrom: 'scale_factor_inverted',
  },

  // ── Reading the question ──────────────────────────────────────────────────
  {
    id: 'unit_not_converted',
    name: 'Units not converted',
    description: 'Worked in the units given rather than the units required — minutes as decimal hours, millilitres left as litres, pence answered in pounds.',
    seededFrom: 'mixed_units',
  },
  {
    id: 'compared_unlike_quantities',
    name: 'Compared unlike quantities',
    description: 'Judged two options without first putting them on the same footing — comparing pack prices of different sizes, or discounts rather than final prices.',
    seededFrom: 'compare_unlike_forms',
  },
  {
    id: 'answer_not_in_requested_form',
    name: 'Answer not in the form asked for',
    description: 'The value is right but the presentation is not what the question required — not in standard form, not to the stated accuracy, or a fraction left improper.',
  },
  {
    id: 'bounds_wrong_direction',
    name: 'Bounds used in the wrong direction',
    description: 'Combined upper and lower bounds the wrong way for the quantity asked — dividing by the larger bound to find an upper limit.',
    seededFrom: 'bounds_reversed',
  },
]

export const misconceptionsById: Record<string, Misconception> =
  Object.fromEntries(misconceptions.map(m => [m.id, m]))

/** Null-safe lookup — an untagged trap is normal, not an error. */
export const getMisconception = (id: string | null | undefined): Misconception | null =>
  id ? misconceptionsById[id] ?? null : null
