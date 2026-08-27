import './env'
import { createClient } from '@supabase/supabase-js'
import { misconceptionsById } from '../data/misconceptions'

// ─────────────────────────────────────────────────────────────────────────────
// First tagging pass — assigns misconception ids to traps on the six skills
// that have an exam briefing.
//
//   npx tsx scripts/tag-misconceptions.ts              dry run, prints every match
//   npx tsx scripts/tag-misconceptions.ts --apply      writes to the database
//
// Tagging is driven by phrases in the trap's own `response`, not by the answer
// template. The responses are formulaic — "That is the mass, not the density",
// "the wrong way around", "you MULTIPLIED" — because they were written to
// explain one mistake plainly, which is exactly what makes them classifiable.
//
// Every rule below is explicit and its matches are printed, so a wrong
// assignment is visible in review rather than buried. Order matters: the first
// matching rule wins, so the more specific patterns come first.
//
// A trap matching nothing is LEFT UNTAGGED. That is the designed outcome for
// anything that does not fit the shared vocabulary — see data/misconceptions.ts
// on why minting a one-off id would defeat the point.
// ─────────────────────────────────────────────────────────────────────────────

// Pass 1 tagged only the six briefed skills. Pass 2 covers the whole bank —
// `--all` (now the default) drops the filter. The BRIEFED list is kept so the
// original slice can still be re-run in isolation with --briefed-only.
const BRIEFED = ['proportion', 'ratio', 'compound_units', 'percentage_change', 'inverse_proportion', 'growth_and_decay']
const BRIEFED_ONLY = process.argv.includes('--briefed-only')

type Rule = { id: string; test: RegExp; why: string }

const RULES: Rule[] = [
  // ── Specific first ────────────────────────────────────────────────────────
  {
    id: 'averaged_the_rates',
    test: /mean of the two speeds|average speed uses total|mean of the two means|averaged the graph|averaged the midpoints|must weight each by its frequency/i,
    why: 'took a plain mean of things that needed weighting',
  },
  {
    id: 'wrong_trig_ratio',
    test: /used (sin|cos|tan)\b.*instead of|multiplied by cos instead|divided by sin\(|opposite as adjacent|uses the hypotenuse|that is the exact value of/i,
    why: 'picked the wrong trig ratio for the sides available',
  },
  {
    // Before answered_a_different_quantity: "That is the diameter…" would
    // otherwise land in the named-measure rule, and this is the more useful
    // diagnosis — it is the single commonest slip in circle work.
    id: 'diameter_for_radius',
    test: /used the diameter|instead of the radius|use the radius:|diameter formula|that is the diameter\. the question asks for the radius/i,
    why: 'diameter where the formula needs the radius, or the reverse',
  },
  {
    id: 'wrong_angle_rule',
    test: /sum to (180|360)°?, not (90|180|360)|add up to (180|360)°?, not (90|180|360)|\(n − 2\) × 180|supplementary \(not equal\)|twice the angle at the circumference — not half|that's the interior angle|but (corresponding|angles in the same segment)/i,
    why: 'wrong angle fact, or the right one backwards',
  },
  {
    // Before multiplied_instead_of_divided and added_instead_of_operating —
    // "that's multiplying the fractions" and "adding tops and bottoms" name a
    // fraction-specific confusion, not a general operation error.
    id: 'fraction_operation_confused',
    test: /adding (the )?(numerators|tops) and (the )?(denominators|bottoms)|subtracting numerators and denominators|that's (what you'd get )?multiplying the fractions|that's adding the fractions|flip the second fraction|result of dividing instead of multiplying|common denominator before/i,
    why: 'wrong operation on the fractions themselves',
  },
  {
    id: 'used_the_stated_value_not_the_bound',
    test: /you used the stated|use the upper bound of each|the true (weight|value) is within|halfway between this measurement/i,
    why: 'calculated with the rounded figure instead of its bound',
  },
  {
    id: 'double_counted_the_overlap',
    test: /double-subtract|subtracted the overlap twice|add back the overlap/i,
    why: 'counted or removed the intersection twice',
  },
  {
    id: 'used_only_one_branch',
    test: /only the first counter|from BOTH branches|narrow it to those|only applies .* ONCE/i,
    why: 'read one branch where several had to be combined',
  },
  {
    id: 'missed_a_dimension',
    test: /only multiplied two dimensions|uses all three dimensions/i,
    why: 'used fewer dimensions than the shape needs',
  },
  {
    id: 'wrong_shape_formula',
    test: /treated the cross-section as|it is a TRIANGLE, so halve|forget to halve for a hemisphere|4πR³ for the sphere|formula for the volume of a cone|halving applies to triangles|that's pythagoras — only valid/i,
    why: 'applied the formula for a different shape',
  },
  {
    // After wrong_shape_formula: that one is "right formula, wrong shape";
    // this is "the formula itself recalled wrongly".
    id: 'misremembered_the_formula',
    test: /but the formula is|the formula uses|use both parallel sides|has a minus sign: c²|the cosine rule has a minus/i,
    why: 'recalled the formula itself wrongly',
  },
  {
    id: 'power_confused_with_multiply',
    test: /multiplied the indices|means .* x's multiplied together|found x², not x|not applied to the power|mistakes? in the power/i,
    why: 'treated an index as a multiplier, or the reverse',
  },
  {
    id: 'steps_in_wrong_order',
    test: /must happen BEFORE|inverted before subtracting|one step at a time|isolate the fraction before|must multiply both sides by .* first|operations in the wrong order|apply g first|subtract .* first,? (then|before)|before dividing by/i,
    why: 'undid the operations out of sequence',
  },
  {
    id: 'wrong_denominator',
    test: /out of the TOTAL|rather than by \d+ \(the total|÷ TOTAL|divided by \d+ — the number of sectors|the number of values|sum ÷ count|not by the number of classes|by the TOTAL frequency|denominator should be the TOTAL|equally likely outcomes, not/i,
    why: 'divided by the wrong total',
  },
  {
    id: 'subtracted_in_the_wrong_order',
    test: /the wrong way round\. the change|subtract the lowest reading from the highest|do not add them/i,
    why: 'took a − b where b − a was needed',
  },
  {
    id: 'misread_the_scale',
    test: /graph values are all ×|check the first sector|read straight off/i,
    why: 'took values off the diagram without allowing for its scale',
  },
  {
    id: 'omitted_a_final_step',
    test: /correctly but forgot|but forgot the ½|forgot the ½|forgot to take the square root|forgot to multiply your answer by 100|forgot to (add|subtract) it|forgot to halve|but not halved|but forgot the £|forgot to multiply by the numerator|forgot to add π|don'?t forget (the|to include)/i,
    why: 'right working, last operation missing',
  },
  {
    id: 'simple_instead_of_compound',
    test: /simple interest|adding the same amount each year|of the starting number added/i,
    why: 'applied the same amount each period rather than the same multiplier',
  },
  {
    id: 'stopped_one_step_early',
    test: /one hour short|after only \{\{n-1\}\}|value after only|stopped one iteration early|apply the formula once more|apply it three times|a second time using/i,
    why: 'applied the repeated change one period fewer than asked',
  },
  {
    id: 'percentage_from_the_wrong_base',
    test: /fraction of the original value, not the new|as a percentage of the old|new area as a percentage/i,
    why: 'percentage change taken against the new value rather than the original',
  },
  {
    id: 'percent_treated_as_absolute',
    test: /instead of calculating \{\{b\}\}% of|but \{\{\[[^\]]*\]\[sel\]\}\}% is a PERCENTAGE|means a FRAC/i,
    why: 'subtracted or added the percentage figure itself rather than that percentage of the amount',
  },
  {
    id: 'change_found_but_not_applied',
    test: /forgot to subtract it from the original|forgot to add it to the original|just the interest earned|is the DISCOUNT/i,
    why: 'found the change correctly but did not apply it to the original',
  },
  {
    id: 'scale_factor_wrong_power',
    test: /AREA scale factor|LENGTH scale factor|scales by|area does not grow by the same percentage|doubling the radius increase/i,
    why: 'used the wrong power of the scale factor for length / area / volume',
  },
  {
    id: 'direct_instead_of_inverse',
    test: /inversely propor|fewer days, not more|y = k ÷ x/i,
    why: 'scaled both quantities the same way when one falls as the other rises',
  },
  {
    id: 'ratio_order_reversed',
    test: /wrong way round — a ratio|wrong order\. the question asks|order the question names/i,
    why: 'right numbers, wrong order',
  },
  {
    id: 'ratio_left_unsimplified',
    test: /have not simplified the ratio|do not need to start with 1/i,
    why: 'ratio correct but not in simplest form',
  },
  {
    id: 'part_used_as_whole',
    test: /of the whole £|include ben’s own share|divided the amount equally|only cara’s share|difference of \{\{gap\}\} parts/i,
    why: 'treated a part as the whole, or applied a share of the total to one part',
  },
  {
    id: 'calculator_in_radians',
    test: /RADIAN mode|in radians|calculator .* radian/i,
    why: 'evaluated the trig function in the wrong angle mode',
  },
  {
    id: 'bounds_wrong_direction',
    test: /upper bound of the time|lower bound of the speed|used the measured values|that is the (upper|lower) bound/i,
    why: 'combined the bounds the wrong way for the quantity asked',
  },
  {
    id: 'compared_unlike_quantities',
    test: /compare the (final|densities|cost of one)|without taking .* discount off|packs hold different|check what you compared/i,
    why: 'judged two options without putting them on the same footing',
  },
  {
    // Before unit_not_converted: that one is "did not convert at all"; this is
    // "tried to convert, with the wrong number or direction".
    id: 'converted_with_the_wrong_factor',
    // Requires conversion phrasing, not just a "…, not 10" contrast — a bare
    // number contrast appears in plenty of non-conversion traps ("5 lines of
    // symmetry, not 10"), and the first draft of this rule caught one of those.
    test: /there are \d+ \w+ in (a|an|one) \w+, not \d+|minute is 60 seconds, not|minutes in an hour, not|divided by 1000 when you should have multiplied|you've divided by .* when you should have multiplied|conversion — you divided/i,
    why: 'converted with the wrong factor or in the wrong direction',
  },
  {
    id: 'unit_not_converted',
    test: /1000 (ml|cm³)|there are 60|is not 0\.|in POUNDS — the question asks for pence|saving in pence|as if it were seconds|km per HOUR|check your conversion/i,
    why: 'worked in the units given rather than the units required',
  },
  {
    id: 'answer_not_in_requested_form',
    test: /not in standard form|asks for a number, not/i,
    why: 'value right, presentation not what was asked for',
  },

  // ── The broad operational errors last, so the specific rules win ──────────
  {
    id: 'divided_the_wrong_way_round',
    test: /wrong way around|divided volume by mass|divided time by distance|amounts of people the wrong way/i,
    why: 'formed the rate the wrong way up',
  },
  {
    id: 'multiplied_instead_of_divided',
    test: /you multiplied|you MULTIPLIED|so multiply — don’t divide|check the density formula — you multiplied/i,
    why: 'combined the quantities with × where the rate needed ÷',
  },
  {
    id: 'added_instead_of_operating',
    test: /is not (mass plus volume|distance plus time)|not adding them|you added \{\{b\}\}|added \{\{b\}\} to the original|added the two sides|ADDED the (horizontal|quartiles)|not Q1 plus Q3|cannot just add|added the base and height|\(you added instead\.?\)|multiplying\s*,\s*not adding|added the coordinates but/i,
    why: 'treated a rate or scaling as an addition',
  },
  {
    id: 'sign_error',
    test: /check the sign|sign error|the sign when you expand|take care with the (outside|last) term/i,
    why: 'dropped or flipped a sign',
  },
  // These two compete for the same "that is the X" opening, and the order
  // between them is the distinction that matters:
  //
  //   answered_a_different_quantity  the value is a DIFFERENT thing (mode for
  //     mean, "both" for "neither", February for March). Signalled explicitly
  //     by the question naming what it actually wanted.
  //   stopped_at_an_intermediate     the value IS a step of the correct working
  //     (the mass on the way to the density).
  //
  // "the question asks" is the reliable tell for the first, so it runs first.
  {
    id: 'answered_a_different_quantity',
    test: /the question asks|you were meant to find|question asks for|worked out the radius, not/i,
    why: 'computed something real, but not the thing asked for',
  },
  {
    // "That's the perimeter" when the question wanted the area names a
    // DIFFERENT named measure — it is not a step on the way to the answer, so
    // it is not an intermediate. This list is deliberately of named
    // mathematical objects; a first pass without it sent 109 traps to
    // stopped_at_an_intermediate, and sampling showed most were this instead.
    id: 'answered_a_different_quantity',
    test: /that('s| is) the (perimeter|area|surface area|circumference|radius|diameter|hypotenuse|mean|mode|median|range|lcm|hcf|upper quartile|lower quartile|probability|proportion|gradient|constant term)\b/i,
    why: 'named a different measure from the one asked for',
  },
  {
    // Narrowed deliberately. Only fires where the value named IS a step of the
    // correct working — the mass on the way to the density, r³ on the way to r
    // — rather than any sentence opening "that is the …".
    id: 'stopped_at_an_intermediate',
    test: /that is the (mass|volume|distance|discount|smaller share|step|midpoint|total amount|right density|colony|size of|total|number who|angle for one)|not the (speed|density|time|price|answer)\b|is k \(the constant|that is only|only the two shorter sides|that is r³|that is k², not k|only the first/i,
    why: 'answered with a correct intermediate value',
  },
]

type Trap = { answer_template?: string; answer?: string; response?: string; misconception?: string | null }
type Q = { id: string; skill_ids: string[]; traps: Trap[] | null; parts: { traps?: Trap[] }[] | null }

const plain = (s: string) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

function classify(response: string): Rule | null {
  const text = plain(response)
  for (const r of RULES) if (r.test.test(text)) return r
  return null
}

async function main() {
  const apply = process.argv.includes('--apply')
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Sanity: every rule must name a real registry entry, or tagging would write
  // ids the audit then flags as unresolved.
  const bad = RULES.filter(r => !misconceptionsById[r.id])
  if (bad.length) { console.error('rules naming unknown ids:', bad.map(r => r.id)); process.exit(1) }

  const { data, error } = await sb.from('questions').select('id, skill_ids, traps, parts')
  if (error) { console.error('query failed:', error.message); process.exit(1) }

  let seen = 0, matched = 0, changed = 0
  const perId: Record<string, number> = {}
  const misses: string[] = []

  for (const q of (data as Q[])) {
    const skill = BRIEFED_ONLY
      ? (q.skill_ids ?? []).find(s => BRIEFED.includes(s))
      : (q.skill_ids ?? [])[0]
    if (!skill) continue

    let dirty = false
    const tag = (t: Trap, label: string) => {
      seen++
      const rule = classify(t.response ?? '')
      if (!rule) { misses.push(`${skill}\t${label}\t${plain(t.response ?? '').slice(0, 80)}`); return }
      matched++
      perId[rule.id] = (perId[rule.id] ?? 0) + 1
      if (t.misconception !== rule.id) { t.misconception = rule.id; dirty = true; changed++ }
      console.log(`${rule.id.padEnd(32)} ${skill.padEnd(18)} ${label}  ${plain(t.response ?? '').slice(0, 58)}`)
    }

    for (const [i, t] of (q.traps ?? []).entries()) tag(t, `${q.id.slice(0, 8)}#${i}`)
    for (const [pi, p] of (q.parts ?? []).entries()) {
      for (const [i, t] of (p.traps ?? []).entries()) tag(t, `${q.id.slice(0, 8)}p${pi}#${i}`)
    }

    if (dirty && apply) {
      const { error: upErr } = await sb.from('questions')
        .update({ traps: q.traps, parts: q.parts }).eq('id', q.id)
      if (upErr) console.error(`  !! update failed for ${q.id}: ${upErr.message}`)
    }
  }

  console.log(`\n${apply ? 'APPLIED' : 'DRY RUN'} — briefed-skill traps: ${seen}`)
  console.log(`  matched a rule : ${matched} (${Math.round((100 * matched) / seen)}%)`)
  console.log(`  left untagged  : ${seen - matched}`)
  console.log(`  rows changed   : ${changed}`)
  console.log('\nper misconception:')
  for (const [id, n] of Object.entries(perId).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${id}`)
  }
  if (misses.length) {
    console.log(`\nleft untagged (${misses.length}) — expected for anything outside the shared vocabulary:`)
    for (const m of misses.sort()) console.log('  ' + m)
  }
  if (!apply) console.log('\nNothing written. Re-run with --apply to save.')
}

main()
