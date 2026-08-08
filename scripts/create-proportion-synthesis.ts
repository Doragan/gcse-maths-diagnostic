import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// Proportion SYNTHESIS questions (kind='exam') — Phase 5 step 1.
//
// `proportion` carries 49 involvement-weighted exam-kind marks across the coded
// 2024 series (the heaviest non-near-root synthesis skill) against THREE bank
// questions, all single-skill mastery. See docs/audit/05-exam-coverage.md §E2c.
//
// Each question's single answer needs TWO INDEPENDENT skills — neither a
// prerequisite of the other, checked against the skill graph. `proportion`'s
// prerequisite closure (fractions_of_amounts, fractions_decimals_and_percentages,
// simple_arithmetic, decimals, …) and dependent closure (ratio,
// direct_proportion, inverse_proportion, proportion_with_powers) are therefore
// all excluded as partners:
//   1. proportion + percentage_change       — best buy with a % discount
//   2. proportion + compound_units          — population density comparison
//   3. proportion + converting_measurements — fill rate → litres
//
// Every pairing is one the real papers actually set, and each replaces a
// "decision not markable" app-gap row with a single markable numeric answer:
// the comparison stays in the student's head (which shop, which town) but the
// deliverable is a number, so nothing is scaffolded away into separate parts.
//
// Curated variant arrays rather than free parameters: every intermediate value
// (discounted pack price, density, bottle count) has to land exactly, and the
// money arithmetic is done in PENCE so no float noise reaches the grader.
//
// Verification is the committed harness, not a bespoke checker:
//   npx tsx scripts/create-proportion-synthesis.ts --json batch.json
//   npx tsx scripts/verify-question.ts --file batch.json
// Then insert as DRAFTS (is_published=false) for review:
//   npx tsx scripts/create-proportion-synthesis.ts
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Q1 curated variants — three where shop A wins, three where shop B does, so
// "the discounted one is always cheaper" is never a winning heuristic.
// pack sizes / pack prices in pence / discount % / order size
const Q1_PA = '[4,5,6,8,3,10][sel]'
const Q1_CA = '[300,400,420,600,255,650][sel]'
const Q1_PB = '[6,3,4,5,9,5][sel]'
const Q1_CB = '[540,270,320,400,800,360][sel]'
const Q1_D = '[20,10,10,15,10,5][sel]'
const Q1_N = '[12,15,12,40,9,10][sel]'
// Discounted pack price at B (exact integers by construction).
const Q1_CBD = `(${Q1_CB}*(100-${Q1_D})/100)`
const Q1_TA = `(${Q1_N}/${Q1_PA}*${Q1_CA})`
const Q1_TB = `(${Q1_N}/${Q1_PB}*${Q1_CBD})`
const Q1_DIFF = `Math.abs(${Q1_TA}-${Q1_TB})`
// Pence → pounds, always 2 dp.
const gbp = (pence: string) => `(${pence}/100).toFixed(2)`

// ── Q2 curated variants — populations chosen so both densities are whole
// numbers; three towns A denser, three B denser.
const Q2_PA = '[48000,25500,84000,19200,72000,45600][sel]'
const Q2_PAD = "['48 000','25 500','84 000','19 200','72 000','45 600'][sel]"
const Q2_AA = '[12,15,28,16,30,19][sel]'
const Q2_PB = '[63000,36000,45000,33600,55000,39000][sel]'
const Q2_PBD = "['63 000','36 000','45 000','33 600','55 000','39 000'][sel]"
const Q2_AB = '[21,24,18,24,22,15][sel]'
const Q2_DA = `(${Q2_PA}/${Q2_AA})`
const Q2_DB = `(${Q2_PB}/${Q2_AB})`

// ── Q3 curated variants — run time is always a whole number of fill periods
// and the total is always a whole number of litres.
const Q3_B = '[12,20,25,16,30,24][sel]'
const Q3_T = '[5,6,8,3,10,12][sel]'
const Q3_V = '[500,250,200,125,150,350][sel]'
const Q3_H = '[2,3,4,2,5,6][sel]'
const Q3_PERIODS = `(${Q3_H}*60/${Q3_T})`
const Q3_BOTTLES = `(${Q3_PERIODS}*${Q3_B})`

type Draft = {
  name: string
  skill_ids: string[]
  difficulty: number
  marks: number
  calculator: 'calc' | 'non_calc' | 'na'
  question_template: string
  question_type: 'numeric'
  parameters: Record<string, { type: 'integer'; min: number; max: number }>
  answer_template: string
  answer_type: 'numeric'
  tolerance: number | null
  traps: { answer_template: string; response: string; method_marks?: number }[]
  explanation: string
}

const drafts: Draft[] = [
  {
    name: 'best-buy-with-percentage-discount',
    skill_ids: ['proportion', 'percentage_change'],
    difficulty: 4,
    marks: 5,
    calculator: 'calc',
    question_template:
      `<p>Two shops sell the same tins of paint.</p>`
      + `<p><strong>Shop A</strong> sells a pack of <strong>{{${Q1_PA}}} tins</strong> for <strong>£{{${gbp(Q1_CA)}}}</strong>.</p>`
      + `<p><strong>Shop B</strong> sells a pack of <strong>{{${Q1_PB}}} tins</strong> for <strong>£{{${gbp(Q1_CB)}}}</strong>, with <strong>{{${Q1_D}}}% off</strong> the pack price.</p>`
      + `<p>Priya needs exactly <strong>{{${Q1_N}}} tins</strong>. Both shops sell only whole packs.</p>`
      + `<p>Work out how much she saves by buying all {{${Q1_N}}} tins from the cheaper shop.</p>`
      + `<p>Give your answer in pounds.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${gbp(Q1_DIFF)}}}`,
    answer_type: 'numeric',
    tolerance: 0.001,
    explanation:
      `<strong>Shop A.</strong> {{${Q1_N}}} ÷ {{${Q1_PA}}} = {{${Q1_N}/${Q1_PA}}} packs, so {{${Q1_N}/${Q1_PA}}} × £{{${gbp(Q1_CA)}}} = <strong>£{{${gbp(Q1_TA)}}}</strong>.<br>`
      + `<strong>Shop B.</strong> {{${Q1_D}}}% off means you pay {{100-${Q1_D}}}% of the pack price: £{{${gbp(Q1_CB)}}} × {{(100-${Q1_D})/100}} = £{{${gbp(Q1_CBD)}}} per pack.<br>`
      + `{{${Q1_N}}} ÷ {{${Q1_PB}}} = {{${Q1_N}/${Q1_PB}}} packs, so {{${Q1_N}/${Q1_PB}}} × £{{${gbp(Q1_CBD)}}} = <strong>£{{${gbp(Q1_TB)}}}</strong>.<br>`
      + `The cheaper shop is <strong>Shop {{${Q1_TA} < ${Q1_TB} ? 'A' : 'B'}}</strong>, and the saving is `
      + `£{{${gbp(`Math.max(${Q1_TA},${Q1_TB})`)}}} − £{{${gbp(`Math.min(${Q1_TA},${Q1_TB})`)}}} = <strong>£{{${gbp(Q1_DIFF)}}}</strong>.`,
    traps: [
      {
        answer_template: `{{${gbp(`Math.abs(${Q1_TA}-${Q1_N}/${Q1_PB}*${Q1_CB})`)}}}`,
        response: `You compared the two shops without taking Shop B's discount off. {{${Q1_D}}}% off means Shop B's pack costs £{{${gbp(Q1_CB)}}} × {{(100-${Q1_D})/100}} = £{{${gbp(Q1_CBD)}}}, which makes the order £{{${gbp(Q1_TB)}}} — a saving of £{{${gbp(Q1_DIFF)}}}.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${gbp(`Math.abs(${Q1_CA}-${Q1_CBD})`)}}}`,
        response: `That is the difference between one pack from each shop, but the packs hold different numbers of tins ({{${Q1_PA}}} and {{${Q1_PB}}}), so you cannot compare them directly. Scale both up to {{${Q1_N}}} tins first: £{{${gbp(Q1_TA)}}} against £{{${gbp(Q1_TB)}}}, a saving of £{{${gbp(Q1_DIFF)}}}.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${gbp(`${Q1_N}/${Q1_PB}*${Q1_CB}*${Q1_D}/100`)}}}`,
        response: `That is how much the discount itself is worth at Shop B, not how much Priya saves overall. Work out both totals — £{{${gbp(Q1_TA)}}} at Shop A and £{{${gbp(Q1_TB)}}} at Shop B — and subtract: £{{${gbp(Q1_DIFF)}}}.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${gbp(`Math.abs(${Q1_CA}/${Q1_PA}-${Q1_CBD}/${Q1_PB})`)}}}`,
        response: `That is the saving on a single tin. The question asks about all {{${Q1_N}}} tins, so multiply up — or compare the two full orders directly: £{{${gbp(Q1_TA)}}} against £{{${gbp(Q1_TB)}}}, a saving of £{{${gbp(Q1_DIFF)}}}.`,
        method_marks: 3,
      },
      {
        // The working is entirely right — only the unit is wrong. Worth naming
        // separately from a method error, since in an exam it costs just the
        // final accuracy mark.
        answer_template: `{{${Q1_DIFF}}}`,
        response: `Your working is right, but that is the saving in <strong>pence</strong>. The question asks for pounds: {{${Q1_DIFF}}}p = £{{${gbp(Q1_DIFF)}}}.`,
        method_marks: 4,
      },
    ],
  },
  {
    name: 'population-density-comparison',
    skill_ids: ['compound_units', 'proportion'],
    difficulty: 4,
    marks: 3,
    calculator: 'calc',
    question_template:
      `<p>The table shows the population and the area of two towns.</p>`
      + `<table style="border-collapse:collapse;margin:8px 0;">`
      + `<tr><th style="border:1px solid currentColor;padding:4px 10px;"></th>`
      + `<th style="border:1px solid currentColor;padding:4px 10px;">Population</th>`
      + `<th style="border:1px solid currentColor;padding:4px 10px;">Area (km²)</th></tr>`
      + `<tr><td style="border:1px solid currentColor;padding:4px 10px;">Ashford</td>`
      + `<td style="border:1px solid currentColor;padding:4px 10px;">{{${Q2_PAD}}}</td>`
      + `<td style="border:1px solid currentColor;padding:4px 10px;">{{${Q2_AA}}}</td></tr>`
      + `<tr><td style="border:1px solid currentColor;padding:4px 10px;">Barwick</td>`
      + `<td style="border:1px solid currentColor;padding:4px 10px;">{{${Q2_PBD}}}</td>`
      + `<td style="border:1px solid currentColor;padding:4px 10px;">{{${Q2_AB}}}</td></tr></table>`
      + `<p>One town is more crowded than the other.</p>`
      + `<p>Work out the population density of the <strong>more crowded</strong> town.</p>`
      + `<p>Give your answer in people per km².</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{Math.max(${Q2_DA}, ${Q2_DB})}}`,
    answer_type: 'numeric',
    tolerance: 0,
    explanation:
      `Population density = population ÷ area.<br>`
      + `Ashford: {{${Q2_PAD}}} ÷ {{${Q2_AA}}} = <strong>{{${Q2_DA}}}</strong> people per km².<br>`
      + `Barwick: {{${Q2_PBD}}} ÷ {{${Q2_AB}}} = <strong>{{${Q2_DB}}}</strong> people per km².<br>`
      + `The more crowded town is the one with the greater density: <strong>{{${Q2_DA} > ${Q2_DB} ? 'Ashford' : 'Barwick'}}</strong>, at <strong>{{Math.max(${Q2_DA}, ${Q2_DB})}}</strong> people per km².`,
    traps: [
      {
        answer_template: `{{Math.min(${Q2_DA}, ${Q2_DB})}}`,
        response: `Both densities are right, but that is the <em>less</em> crowded town. {{${Q2_DA} > ${Q2_DB} ? 'Ashford' : 'Barwick'}} packs {{Math.max(${Q2_DA}, ${Q2_DB})}} people into each km², against {{Math.min(${Q2_DA}, ${Q2_DB})}} — so it is the more crowded one.`,
        method_marks: 2,
      },
      {
        answer_template: `{{Math.abs(${Q2_DA} - ${Q2_DB})}}`,
        response: `That is the difference between the two densities. The question asks for the density of the more crowded town itself: {{Math.max(${Q2_DA}, ${Q2_DB})}} people per km².`,
        method_marks: 2,
      },
      {
        answer_template: `{{${Q2_DA} + ${Q2_DB}}}`,
        response: `You added the two densities together. Each town has its own density, and the answer is the larger of them: {{Math.max(${Q2_DA}, ${Q2_DB})}} people per km².`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'bottling-rate-to-litres',
    skill_ids: ['proportion', 'converting_measurements'],
    difficulty: 4,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p>A bottling machine fills bottles at a constant rate.</p>`
      + `<p>It fills <strong>{{${Q3_B}}} bottles</strong> every <strong>{{${Q3_T}}} minutes</strong>.</p>`
      + `<p>Each bottle holds <strong>{{${Q3_V}}} ml</strong>.</p>`
      + `<p>The machine runs without stopping for <strong>{{${Q3_H}}} hours</strong>.</p>`
      + `<p>Work out the total volume of liquid the machine puts into bottles.</p>`
      + `<p>Give your answer in <strong>litres</strong>.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${Q3_BOTTLES}*${Q3_V}/1000}}`,
    answer_type: 'numeric',
    tolerance: 0.001,
    explanation:
      `{{${Q3_H}}} hours = {{${Q3_H}}} × 60 = {{${Q3_H}*60}} minutes, which is {{${Q3_H}*60}} ÷ {{${Q3_T}}} = {{${Q3_PERIODS}}} lots of {{${Q3_T}}} minutes.<br>`
      + `Bottles filled = {{${Q3_PERIODS}}} × {{${Q3_B}}} = <strong>{{${Q3_BOTTLES}}}</strong>.<br>`
      + `Volume = {{${Q3_BOTTLES}}} × {{${Q3_V}}} = {{${Q3_BOTTLES}*${Q3_V}}} ml.<br>`
      + `There are 1000 ml in a litre, so that is {{${Q3_BOTTLES}*${Q3_V}}} ÷ 1000 = <strong>{{${Q3_BOTTLES}*${Q3_V}/1000}} litres</strong>.`,
    traps: [
      {
        answer_template: `{{${Q3_BOTTLES}*${Q3_V}}}`,
        response: `That is the volume in millilitres. The question asks for litres, and there are 1000 ml in a litre: {{${Q3_BOTTLES}*${Q3_V}}} ÷ 1000 = {{${Q3_BOTTLES}*${Q3_V}/1000}} litres.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${Q3_BOTTLES}}}`,
        response: `That is how many bottles are filled, not how much liquid. Each bottle holds {{${Q3_V}}} ml, so multiply: {{${Q3_BOTTLES}}} × {{${Q3_V}}} = {{${Q3_BOTTLES}*${Q3_V}}} ml = {{${Q3_BOTTLES}*${Q3_V}/1000}} litres.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${Q3_BOTTLES}*${Q3_V}/100}}`,
        response: `Check your conversion — you divided by 100. There are 1000 ml in a litre, so {{${Q3_BOTTLES}*${Q3_V}}} ml = {{${Q3_BOTTLES}*${Q3_V}/1000}} litres.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${Q3_B}*${Q3_V}/1000}}`,
        response: `That is the volume from just one {{${Q3_T}}}-minute burst. The machine runs for {{${Q3_H}}} hours, which is {{${Q3_PERIODS}}} of those, so the total is {{${Q3_PERIODS}}} × {{${Q3_B}}} = {{${Q3_BOTTLES}}} bottles and {{${Q3_BOTTLES}*${Q3_V}/1000}} litres.`,
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
    question_type: q.question_type,
    parameters: q.parameters,
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

async function main() {
  const jsonIdx = process.argv.indexOf('--json')
  if (jsonIdx !== -1) {
    const path = process.argv[jsonIdx + 1]
    writeFileSync(path, JSON.stringify(drafts.map(rowOf), null, 1))
    console.log(`wrote ${drafts.length} question(s) to ${path}`)
    console.log(`now run:  npx tsx scripts/verify-question.ts --file ${path}`)
    return
  }

  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(drafts.map(rowOf), null, 1))
    return
  }

  const { data, error } = await supabase.from('questions').insert(drafts.map(rowOf)).select('id')
  if (error) { console.error('insert failed:', error); process.exit(1) }
  console.log('Inserted as DRAFTS (is_published=false):')
  data!.forEach((r, i) => console.log(`  ${drafts[i].name}: ${r.id}`))
  console.log(`\nverify the stored rows:  npx tsx scripts/verify-question.ts ${data!.map(r => r.id).join(' ')}`)
}

main()
