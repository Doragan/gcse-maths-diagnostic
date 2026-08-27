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
    name: 'Added where a different operation was needed',
    description: 'Reached for addition when the method wanted something else — "speed is distance plus time", the two short sides of a right angle added instead of squared, the quartiles added instead of subtracted.',
  },
  {
    id: 'averaged_the_rates',
    name: 'Averaged the averages',
    description: 'Took a plain mean of two rates or two averages that needed weighting — two speeds instead of total distance ÷ total time, or the mean of two class means when the classes are different sizes.',
    seededFrom: 'average_the_two_speeds',
  },
  {
    id: 'subtracted_in_the_wrong_order',
    name: 'Subtracted the wrong way round',
    description: 'Took a − b where the question needed b − a, so a change or difference came out with the wrong sign.',
    seededFrom: 'sign_pair_reversed',
  },
  {
    id: 'sign_error',
    name: 'Sign error',
    description: 'Dropped or flipped a sign while rearranging or expanding — the method is right and one minus is not.',
    seededFrom: 'sign_error',
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
  {
    id: 'omitted_a_final_step',
    name: 'Left out the last step',
    description: 'The working is right, but one required operation or component is missing — the square root after Pythagoras, the ½ on a triangle, the halving of a midpoint, the ×100 to a percentage, a fixed fee left off a formula.',
  },
  {
    id: 'answered_a_different_quantity',
    name: 'Answered a different quantity',
    description: 'Worked out something real and correct, but not the thing asked for — the mode when the mean was wanted, "both" when the question said "neither", February\'s figure when March was asked.',
  },

  // ── Method and structure ──────────────────────────────────────────────────
  {
    id: 'steps_in_wrong_order',
    name: 'Undid the operations in the wrong order',
    description: 'Applied inverse operations out of sequence when rearranging — divided before subtracting, or inverted a fraction before isolating it.',
    seededFrom: 'order_of_operations',
  },
  {
    id: 'power_confused_with_multiply',
    name: 'Confused a power with multiplying',
    description: 'Treated an index as a multiplier or the reverse — read x² as 2x, cubed by multiplying by three, or multiplied indices where they should be added.',
    seededFrom: 'square_vs_double',
  },
  {
    id: 'wrong_shape_formula',
    name: 'Used the formula for a different shape',
    description: 'Applied the wrong area or volume formula — treated a triangular cross-section as a rectangle, or a hemisphere as a whole sphere.',
  },
  {
    id: 'missed_a_dimension',
    name: 'Left out a dimension',
    description: 'Multiplied only two of the three dimensions for a volume, or otherwise used fewer measurements than the shape needs.',
  },
  {
    id: 'wrong_trig_ratio',
    name: 'Used the wrong trig ratio',
    description: 'Picked sin, cos or tan against the wrong pair of sides — usually from mislabelling which side is opposite, adjacent or the hypotenuse.',
    seededFrom: 'wrong_trig_ratio',
  },

  // ── Probability, sets and data ────────────────────────────────────────────
  {
    id: 'wrong_denominator',
    name: 'Divided by the wrong total',
    description: 'Formed a probability or a mean over the wrong denominator — the remaining items rather than all of them, or the number of categories rather than the number of things.',
    seededFrom: 'divide_by_the_wrong_count',
  },
  {
    id: 'used_only_one_branch',
    name: 'Used only one branch',
    description: 'Read a single path through a tree or table where the question needed several combined — one branch of a frequency tree, or one outcome of two.',
  },
  {
    id: 'double_counted_the_overlap',
    name: 'Double-counted the overlap',
    description: 'Added or subtracted the intersection of two sets twice, so members of both groups were counted or removed more than once.',
    seededFrom: 'overlap_counted_twice',
  },
  {
    id: 'wrong_angle_rule',
    name: 'Used the wrong angle fact',
    description: 'Applied the wrong angle rule, or the right one backwards — 360° where 180° applies, equal where supplementary, twice where half, the interior angle where the exterior was asked.',
    seededFrom: 'use_360_not_180',
  },
  {
    id: 'diameter_for_radius',
    name: 'Diameter used for the radius',
    description: 'Put the diameter into a formula that needs the radius, or the reverse — the commonest slip in every circle calculation.',
    seededFrom: 'use_diameter_for_radius',
  },
  {
    id: 'fraction_operation_confused',
    name: 'Did a different fraction operation',
    description: 'Performed the wrong operation on the fractions — added tops and bottoms separately, multiplied when adding, or flipped the wrong fraction when dividing.',
    seededFrom: 'add_numerators_without_a_common_denominator',
  },
  {
    id: 'misremembered_the_formula',
    name: 'Misremembered the formula',
    description: 'Recalled the formula wrongly — πr for an area, n × 180° for a polygon, a plus where the cosine rule has a minus. Distinct from using the right formula on the wrong shape.',
  },
  {
    id: 'converted_with_the_wrong_factor',
    name: 'Converted with the wrong factor',
    description: 'Attempted the unit conversion but with the wrong number or in the wrong direction — 100 where 1000, ÷60 where ×60, dividing where multiplying was needed.',
    seededFrom: 'invert_the_conversion',
  },
  {
    id: 'calculator_in_radians',
    name: 'Calculator in the wrong mode',
    description: 'Evaluated a trig function with the calculator set to radians rather than degrees, so the value is right for the wrong angle unit.',
    seededFrom: 'calculator_in_radians',
  },
  {
    id: 'misread_the_scale',
    name: 'Misread the scale',
    description: 'Took values straight off a graph or diagram without allowing for its scale or interval — reading gridline counts as units, or ignoring a ×10 axis.',
    seededFrom: 'misread_the_scale_interval',
  },
  {
    id: 'used_the_stated_value_not_the_bound',
    name: 'Used the stated value, not its bound',
    description: 'Calculated with the rounded figure given in the question when the answer required its upper or lower bound.',
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
  {
    id: 'used_a_poor_pi_estimate',
    name: 'Used too rough a value for π',
    description: 'Worked the formula correctly but substituted 3.14 or 22/7 for π, landing outside the accuracy the question asks for. Recurs across every circle-derived skill — area, circumference, arc and sector, sphere, cone, cylinder, frustum — and is the one misconception detected from the answer itself rather than an authored trap.',
  },
]

export const misconceptionsById: Record<string, Misconception> =
  Object.fromEntries(misconceptions.map(m => [m.id, m]))

/** Null-safe lookup — an untagged trap is normal, not an error. */
export const getMisconception = (id: string | null | undefined): Misconception | null =>
  id ? misconceptionsById[id] ?? null : null
