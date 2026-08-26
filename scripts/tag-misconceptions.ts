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

const BRIEFED = ['proportion', 'ratio', 'compound_units', 'percentage_change', 'inverse_proportion', 'growth_and_decay']

type Rule = { id: string; test: RegExp; why: string }

const RULES: Rule[] = [
  // ── Specific first ────────────────────────────────────────────────────────
  {
    id: 'averaged_the_rates',
    test: /mean of the two speeds|average speed uses total/i,
    why: 'took the mean of two speeds instead of total ÷ total',
  },
  {
    id: 'simple_instead_of_compound',
    test: /simple interest|adding the same amount each year|of the starting number added/i,
    why: 'applied the same amount each period rather than the same multiplier',
  },
  {
    id: 'stopped_one_step_early',
    test: /one hour short|after only \{\{n-1\}\}|value after only/i,
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
    id: 'bounds_wrong_direction',
    test: /upper bound of the time|lower bound of the speed|used the measured values/i,
    why: 'combined the bounds the wrong way for the quantity asked',
  },
  {
    id: 'compared_unlike_quantities',
    test: /compare the (final|densities|cost of one)|without taking .* discount off|packs hold different|check what you compared/i,
    why: 'judged two options without putting them on the same footing',
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
    test: /is not (mass plus volume|distance plus time)|not adding them|you added \{\{b\}\}|added \{\{b\}\} to the original/i,
    why: 'treated a rate or scaling as an addition',
  },
  {
    id: 'stopped_at_an_intermediate',
    test: /^that is (the|only|k|r³)|that is the (mass|volume|distance|discount|smaller share|step|midpoint|total amount|right density|colony|size of)|not the (speed|density|time|price|answer)|is k \(the constant/i,
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
    const skill = (q.skill_ids ?? []).find(s => BRIEFED.includes(s))
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
