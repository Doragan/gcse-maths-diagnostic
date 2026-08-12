import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// growth_and_decay SYNTHESIS questions (kind='exam') — Phase 5 step 1, fourth
// batch, after proportion / ratio / compound_units.
//
// growth_and_decay was the heaviest skill left with ZERO exam-kind coverage:
// 10 primary exam-kind marks, four bank questions, all mastery.
//
// A FINDING WORTH KNOWING BEFORE READING FURTHER. Every coded 2024 row for this
// skill is either single-skill or paired with `percentage_change` — and
// percentage_change is a PREREQUISITE of growth_and_decay, so the pairing is
// mastery by the project's synthesis rule, not synthesis. There is therefore
// **no evidenced independent pairing for growth_and_decay in the coded series**:
//
//   JUN24-F-P3 q26  2m exam  [growth_and_decay]                     show-that
//   JUN24-H-P2 q10  3m exam  [percentage_change + growth_and_decay] prereq pair
//   JUN24-H-P2 q24b 2m exam  [growth_and_decay]                     tick decision
//   NOV24-F-P3 q16  3m exam  [growth_and_decay]                     single
//   NOV24-H-P3 q12  4m mast  [growth_and_decay]                     single
//   NOV24-H-P3 q23  3m exam  [growth_and_decay]                     single (a, b)
//
// So the three pairings below are chosen on curriculum grounds rather than
// mark evidence, which is a departure from how the earlier batches were
// picked. Each is a standard Higher/Foundation combination that a paper could
// plausibly set, and each partner is independent of growth_and_decay in the
// graph. Its prerequisite closure — percentage_change, indices,
// fractions_of_amounts, fractions_decimals_and_percentages, simple_arithmetic,
// decimals, simplifying_fractions — is excluded throughout.
//
//   1. + standard_form          — bacteria colony, standard form in and out
//   2. + ratio                  — share a sum, then compound one share
//   3. + upper_and_lower_bounds — upper bound of a compounded investment
//
// The best EVIDENCED follow-up is NOV24-H-P3 q23 — find a and b for y = ab^x
// from two points, 3 marks, coded app_supported: yes, traps use_one_point_only
// and confuse_a_and_b. It is single-skill so it lands as mastery depth, and it
// suits a `multi_blank` part (two numeric values), which is still the bank's
// least-used input type.
//
// Every displayed and marked value is COMPUTED in-template from the six base
// parameters — no hand-transcribed mantissas or totals. The previous batch
// shipped an array whose view NAME disagreed with the rectangle beside it, and
// the harness cannot see that class of error.
//
//   npx tsx scripts/create-growth-decay-synthesis.ts --json batch.json
//   npx tsx scripts/verify-question.ts --file batch.json
//   npx tsx scripts/create-growth-decay-synthesis.ts            # insert drafts
//   npx tsx scripts/create-growth-decay-synthesis.ts --update <name>
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Rows this script owns, keyed by name; `--update <name>` rewrites one. */
const DRAFT_IDS: Record<string, string> = {
  'bacteria-growth-standard-form': '92719acd-3362-462b-a594-32dc9d6cd82b',
  'ratio-share-then-compound-interest': 'fd9dd6b4-29dc-4e85-9014-09fc4d6ca32b',
  'upper-bound-of-compound-interest': 'd67b528b-2105-4260-9d15-1dcdf9c03c7e',
}

// ── G1: bacteria colony. Start a × 10^p, +r% per hour, t hours, answer in
// standard form to 3 s.f. Two of the six draws push the mantissa past 10 so the
// power has to be renormalised (a=8 and a=6 rows) — that is the standard_form
// half of the question doing real work rather than decorating it.
const G1_A = '[2,5,3,8,4,6][sel]'
const G1_P = '[5,4,6,3,5,4][sel]'
const G1_R = '[20,15,25,10,30,12][sel]'
const G1_T = '[4,4,2,5,3,6][sel]'
/** Any value → "m × 10^e" with m to 3 s.f., built the way 0270e0be does it. */
const sf = (val: string) => {
  const e = `Math.floor(Math.log10(${val}))`
  return `{{round(${val}/Math.pow(10,${e}), 2)}} × 10<sup>{{${e}}}</sup>`
}
/**
 * The same value written with the mantissa ten times too big and the power one
 * too small — "12.9 × 10³" for 1.29 × 10⁴. Same NUMBER, but not standard form,
 * since the mantissa has to sit between 1 and 10.
 *
 * It grades wrong (and so can carry a trap) only because the answer type is
 * `exact`, which compares the written form. A numeric answer type would treat
 * the two as equal and this misconception would be invisible.
 *
 * Still 3 s.f., so the mantissa takes one fewer decimal place: 1.29 → 12.9.
 */
const sfUnnormalised = (val: string) => {
  const e = `(Math.floor(Math.log10(${val}))-1)`
  return `{{round(${val}/Math.pow(10,${e}), 1)}} × 10<sup>{{${e}}}</sup>`
}
const G1_VAL = `(${G1_A}*Math.pow(10,${G1_P})*Math.pow(1+${G1_R}/100,${G1_T}))`
/** Trap: simple growth — r% of the START added t times, not compounded. */
const G1_SIMPLE = `(${G1_A}*Math.pow(10,${G1_P})*(1+${G1_R}*${G1_T}/100))`
/** Trap: one hour short. */
const G1_SHORT = `(${G1_A}*Math.pow(10,${G1_P})*Math.pow(1+${G1_R}/100,${G1_T}-1))`

// ── G2: share a sum in a ratio, then compound ONE share.
const G2_TOTAL = '[4500,6000,3500,8000,5400,7200][sel]'
const G2_A = '[2,1,3,5,4,1][sel]'
const G2_B = '[3,2,4,3,5,5][sel]'
const G2_R = '[4,5,3,6,2,3][sel]'
const G2_N = '[3,2,4,2,5,3][sel]'
const G2_SHARE = `(${G2_TOTAL}*${G2_B}/(${G2_A}+${G2_B}))`
const G2_AMYSHARE = `(${G2_TOTAL}*${G2_A}/(${G2_A}+${G2_B}))`
const G2_MULT = `Math.pow(1+${G2_R}/100,${G2_N})`
const G2_ANS = `round(${G2_SHARE}*${G2_MULT}, 2)`

// ── G3: upper bound of a compounded investment. The amount is given to the
// nearest £100, so its upper bound is +£50; the rate is exact.
const G3_AMT = '[3600,2400,5000,1800,4500,2700][sel]'
const G3_R = '[5,4,3,6,2,7][sel]'
const G3_N = '[3,2,4,2,5,3][sel]'
const G3_UB = `(${G3_AMT}+50)`
const G3_LB = `(${G3_AMT}-50)`
/**
 * The upper bound taken as "the largest amount you could actually have" —
 * a penny below the true bound. The commonest bounds misconception: the true
 * amount IS strictly less than £…50, so students reach for the biggest value
 * that satisfies it rather than the boundary itself.
 *
 * Safe as a trap despite landing only 1p from the answer, and provably so
 * rather than by luck: the two differ by 0.01 × multiplier before rounding,
 * the multiplier always exceeds 1, and two values more than 0.01 apart cannot
 * round to the same penny. Measured gap is 0.01 on all six draws against a
 * 0.005 tolerance.
 */
const G3_UB_PENNY = `(${G3_AMT}+50-0.01)`
const G3_MULT = `Math.pow(1+${G3_R}/100,${G3_N})`
const G3_ANS = `round(${G3_UB}*${G3_MULT}, 2)`

type Draft = {
  name: string
  skill_ids: string[]
  difficulty: number
  marks: number
  calculator: 'calc' | 'non_calc' | 'na'
  question_template: string
  parameters?: Record<string, { type: 'integer'; min: number; max: number }>
  answer_template: string
  answer_type: 'numeric' | 'exact'
  tolerance: number | null
  traps: { answer_template: string; response: string; method_marks?: number }[]
  explanation: string
}

const drafts: Draft[] = [
  {
    name: 'bacteria-growth-standard-form',
    skill_ids: ['growth_and_decay', 'standard_form'],
    difficulty: 5,
    marks: 3,
    calculator: 'calc',
    question_template:
      `<p>A colony of bacteria starts with <strong>{{${G1_A}}} × 10<sup>{{${G1_P}}}</sup></strong> cells.</p>`
      + `<p>The number of cells increases by <strong>{{${G1_R}}}% every hour</strong>.</p>`
      + `<p>Work out the number of cells after <strong>{{${G1_T}}} hours</strong>.</p>`
      + `<p>Give your answer in <strong>standard form</strong>, correct to 3 significant figures.</p>`,
    answer_template: sf(G1_VAL),
    answer_type: 'exact',
    tolerance: null,
    explanation:
      `An increase of {{${G1_R}}}% means multiplying by {{1+${G1_R}/100}} each hour, so after {{${G1_T}}} hours the colony is multiplied by {{1+${G1_R}/100}}<sup>{{${G1_T}}}</sup> = {{round(Math.pow(1+${G1_R}/100,${G1_T}), 4)}}.<br>`
      + `Number of cells = {{${G1_A}}} × 10<sup>{{${G1_P}}}</sup> × {{round(Math.pow(1+${G1_R}/100,${G1_T}), 4)}} = {{round(${G1_VAL}, 1)}}.<br>`
      + `In standard form, to 3 significant figures, that is <strong>${sf(G1_VAL)}</strong>.`,
    traps: [
      {
        answer_template: sf(G1_SIMPLE),
        response: `That is {{${G1_R}}}% of the STARTING number added {{${G1_T}}} times. Growth compounds — each hour the {{${G1_R}}}% is taken of the new total, so you multiply by {{1+${G1_R}/100}} {{${G1_T}}} times over: {{1+${G1_R}/100}}<sup>{{${G1_T}}}</sup> = {{round(Math.pow(1+${G1_R}/100,${G1_T}), 4)}}, giving ${sf(G1_VAL)}.`,
        method_marks: 1,
      },
      {
        answer_template: sf(G1_SHORT),
        response: `That is the colony after {{${G1_T}-1}} hours, one hour short. Multiply by {{1+${G1_R}/100}} once more to reach {{${G1_T}}} hours: ${sf(G1_VAL)}.`,
        method_marks: 2,
      },
      {
        // Right value, not converted to standard form — the standard_form half
        // of the question left undone.
        answer_template: `{{round(${G1_VAL}/Math.pow(10,Math.floor(Math.log10(${G1_VAL})))*100, 0)*Math.pow(10,Math.floor(Math.log10(${G1_VAL}))-2)}}`,
        response: `That is the right number of cells, but not in standard form. Standard form is a number between 1 and 10 multiplied by a power of 10: ${sf(G1_VAL)}.`,
        method_marks: 2,
      },
      {
        // Right number, written with the mantissa ten times too big. The growth
        // is entirely correct — only the normalising step is missing — so this
        // scores everything but the accuracy mark.
        answer_template: sfUnnormalised(G1_VAL),
        response: `Your number is right, and so is the power arithmetic — but ${sfUnnormalised(G1_VAL)} is not <em>standard form</em>. The first part has to be between <strong>1 and 10</strong>, and yours is {{round(${G1_VAL}/Math.pow(10,Math.floor(Math.log10(${G1_VAL}))-1), 1)}}.<br>Move the decimal point one place left and add one to the power to balance it: <strong>${sf(G1_VAL)}</strong>.`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'ratio-share-then-compound-interest',
    skill_ids: ['ratio', 'growth_and_decay'],
    difficulty: 4,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p><strong>£{{${G2_TOTAL}}}</strong> is shared between Amy and Ben in the ratio <strong>{{${G2_A}}} : {{${G2_B}}}</strong>.</p>`
      + `<p>Ben invests all of his share in an account paying <strong>{{${G2_R}}}% compound interest per year</strong>.</p>`
      + `<p>Work out how much Ben has after <strong>{{${G2_N}}} years</strong>.</p>`
      + `<p>Give your answer to the nearest penny.</p>`,
    answer_template: `{{${G2_ANS}}}`,
    answer_type: 'numeric',
    tolerance: 0.005,
    explanation:
      `The ratio has {{${G2_A}}} + {{${G2_B}}} = {{${G2_A}+${G2_B}}} parts, so one part is £{{${G2_TOTAL}}} ÷ {{${G2_A}+${G2_B}}} = £{{${G2_TOTAL}/(${G2_A}+${G2_B})}}.<br>`
      + `Ben has {{${G2_B}}} parts: {{${G2_B}}} × £{{${G2_TOTAL}/(${G2_A}+${G2_B})}} = <strong>£{{${G2_SHARE}}}</strong>.<br>`
      + `{{${G2_R}}}% compound interest means multiplying by {{1+${G2_R}/100}} each year, so after {{${G2_N}}} years: £{{${G2_SHARE}}} × {{1+${G2_R}/100}}<sup>{{${G2_N}}}</sup> = <strong>£{{${G2_ANS}}}</strong>.`,
    traps: [
      {
        answer_template: `{{round(${G2_AMYSHARE}*${G2_MULT}, 2)}}`,
        response: `You invested Amy's share. The ratio is Amy : Ben = {{${G2_A}}} : {{${G2_B}}}, so Ben's share is the {{${G2_B}}} parts — £{{${G2_SHARE}}}, which grows to £{{${G2_ANS}}}.`,
        method_marks: 2,
      },
      {
        answer_template: `{{round(${G2_TOTAL}*${G2_MULT}, 2)}}`,
        response: `You invested the whole £{{${G2_TOTAL}}}. Only Ben's share is invested: {{${G2_B}}} of the {{${G2_A}+${G2_B}}} parts, which is £{{${G2_SHARE}}}. That grows to £{{${G2_ANS}}}.`,
        method_marks: 1,
      },
      {
        answer_template: `{{round(${G2_SHARE}*(1+${G2_R}*${G2_N}/100), 2)}}`,
        response: `That is simple interest — {{${G2_R}}}% of the original share, {{${G2_N}}} times over. Compound interest is taken on the new total each year, so multiply by {{1+${G2_R}/100}} {{${G2_N}}} times: £{{${G2_SHARE}}} × {{1+${G2_R}/100}}<sup>{{${G2_N}}}</sup> = £{{${G2_ANS}}}.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${G2_SHARE}}}`,
        response: `That is Ben's share before any interest. He invests it for {{${G2_N}}} years at {{${G2_R}}}%, so it grows to £{{${G2_SHARE}}} × {{1+${G2_R}/100}}<sup>{{${G2_N}}}</sup> = £{{${G2_ANS}}}.`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'upper-bound-of-compound-interest',
    skill_ids: ['upper_and_lower_bounds', 'growth_and_decay'],
    difficulty: 5,
    marks: 3,
    calculator: 'calc',
    question_template:
      `<p>Rana invests <strong>£{{${G3_AMT}}}</strong>, correct to the nearest <strong>£100</strong>.</p>`
      + `<p>The account pays <strong>{{${G3_R}}}% compound interest per year</strong>.</p>`
      + `<p>Work out the <strong>upper bound</strong> of the value of her investment after <strong>{{${G3_N}}} years</strong>.</p>`
      + `<p>Give your answer to the nearest penny.</p>`,
    answer_template: `{{${G3_ANS}}}`,
    answer_type: 'numeric',
    tolerance: 0.005,
    explanation:
      `£{{${G3_AMT}}} to the nearest £100 means the true amount is at least £{{${G3_LB}}} and less than £{{${G3_UB}}}, so the <strong>upper bound of the investment is £{{${G3_UB}}}</strong>.<br>`
      + `Interest multiplies the amount by {{1+${G3_R}/100}} each year, and multiplying by a number bigger than 1 keeps the biggest start the biggest — so the upper bound of the value comes from the upper bound of the investment.<br>`
      + `£{{${G3_UB}}} × {{1+${G3_R}/100}}<sup>{{${G3_N}}}</sup> = <strong>£{{${G3_ANS}}}</strong>.`,
    traps: [
      {
        answer_template: `{{round(${G3_AMT}*${G3_MULT}, 2)}}`,
        response: `You used the stated £{{${G3_AMT}}}. It is only correct to the nearest £100, so the most it could actually be is £{{${G3_UB}}} — and that is what gives the upper bound: £{{${G3_ANS}}}.`,
        method_marks: 2,
      },
      {
        answer_template: `{{round(${G3_LB}*${G3_MULT}, 2)}}`,
        response: `That is the LOWER bound — you started from £{{${G3_LB}}}. To the nearest £100, the amount could be as much as £{{${G3_UB}}}, giving an upper bound of £{{${G3_ANS}}}.`,
        method_marks: 2,
      },
      {
        // A penny below the answer. Unusually for a trap this value does NOT
        // identify one mistake: starting from £…49.99 and rounding partway
        // through both land here, and nothing in the submitted number tells
        // them apart. So it names both rather than asserting the wrong one —
        // the exception to giving a specific diagnosis, not the rule.
        answer_template: `{{round(${G3_UB_PENNY}*${G3_MULT}, 2)}}`,
        response: `You are a penny below. Two things commonly cause that:<br>`
          + `• <strong>Starting from £{{(${G3_UB_PENNY}).toFixed(2)}}.</strong> You would be right that the true amount is <em>less than</em> £{{${G3_UB}}} — anything from £{{${G3_LB}}} up to (but not including) £{{${G3_UB}}} rounds to £{{${G3_AMT}}}. But the upper bound is the <strong>boundary itself, £{{${G3_UB}}}</strong>, not the largest amount you can write in whole pennies; £{{(${G3_UB_PENNY}).toFixed(2)}} would leave out everything between it and the boundary.<br>`
          + `• <strong>Rounding partway through.</strong> Rounding each year's total to the penny before the next year loses a fraction each time. Keep the full value in your calculator and round only at the very end.<br>`
          + `£{{${G3_UB}}} × {{1+${G3_R}/100}}<sup>{{${G3_N}}}</sup> = <strong>£{{${G3_ANS}}}</strong>.`,
        method_marks: 2,
      },
      {
        answer_template: `{{round(${G3_UB}*(1+${G3_R}*${G3_N}/100), 2)}}`,
        response: `The bound is right — £{{${G3_UB}}} — but that is simple interest. Compound interest multiplies by {{1+${G3_R}/100}} each year: £{{${G3_UB}}} × {{1+${G3_R}/100}}<sup>{{${G3_N}}}</sup> = £{{${G3_ANS}}}.`,
        method_marks: 2,
      },
      {
        // Stopped after one year. Distinct from the simple-interest trap: that
        // one applies the interest {{n}} times but without compounding, this
        // one compounds correctly and just stops early.
        answer_template: `{{round(${G3_UB}*(1+${G3_R}/100), 2)}}`,
        response: `The bound is right — £{{${G3_UB}}} — but that is only <strong>one year</strong> of interest. The money is invested for {{${G3_N}}} years, so the {{${G3_R}}}% is applied {{${G3_N}}} times over, each time to the new total: £{{${G3_UB}}} × {{1+${G3_R}/100}}<sup>{{${G3_N}}}</sup> = <strong>£{{${G3_ANS}}}</strong>.`,
        method_marks: 1,
      },
    ],
  },
]

function rowOf(q: Draft) {
  return {
    skill_ids: q.skill_ids,
    difficulty: q.difficulty,
    marks: q.marks,
    question_template: q.question_template,
    question_type: 'numeric',
    parameters: q.parameters ?? { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: q.answer_template,
    answer_type: q.answer_type,
    tolerance: q.tolerance,
    traps: q.traps,
    explanation: q.explanation,
    image: false,
    image_url: null,
    calculator: q.calculator,
    kind: 'exam',
    parts: null,
    mc_options: null,
    requires_simplest: false,
    is_published: false, // drafts — the user reviews and publishes
  }
}
/** `--update` must never flip a published question back to draft. */
function updateOf(q: Draft) {
  const { is_published: _ignored, ...rest } = rowOf(q)
  return rest
}

async function main() {
  const jsonIdx = process.argv.indexOf('--json')
  if (jsonIdx !== -1) {
    writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(drafts.map(rowOf), null, 1))
    console.log(`wrote ${drafts.length} question(s) to ${process.argv[jsonIdx + 1]}`)
    return
  }
  if (process.argv.includes('--dry-run')) { console.log(JSON.stringify(drafts.map(rowOf), null, 1)); return }

  if (process.argv.includes('--update')) {
    const only = process.argv[process.argv.indexOf('--update') + 1]
    const targets = only && !only.startsWith('--') ? drafts.filter(q => q.name === only) : drafts
    if (!targets.length) { console.error(`no question named "${only}" in this script`); process.exit(1) }
    if (targets.length > 1) console.log(`rewriting all ${targets.length} rows — pass --update <name> to target just one`)
    for (const q of targets) {
      const id = DRAFT_IDS[q.name]
      if (!id) { console.error(`no id recorded for "${q.name}" — insert it first`); process.exit(1) }
      const { error } = await supabase.from('questions').update(updateOf(q)).eq('id', id)
      if (error) { console.error(`update failed for ${q.name}:`, error); process.exit(1) }
      console.log(`  updated ${q.name}: ${id}`)
    }
    return
  }

  const fresh = drafts.filter(d => !DRAFT_IDS[d.name])
  if (!fresh.length) { console.log('all questions already exist — use --update <name>'); return }
  const { data, error } = await supabase.from('questions').insert(fresh.map(rowOf)).select('id')
  if (error) { console.error('insert failed:', error); process.exit(1) }
  console.log('Inserted as DRAFTS (is_published=false):')
  data!.forEach((r, i) => console.log(`  ${fresh[i].name}: ${r.id}`))
  console.log(`\nverify:  npx tsx scripts/verify-question.ts ${data!.map(r => r.id).join(' ')}`)
}

main()
