import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// Compound-units SYNTHESIS questions (kind='exam') — Phase 5 step 1, third
// batch (after proportion and ratio).
//
// `compound_units` carries 30 involvement-weighted exam-kind marks across the
// coded 2024 series. Unlike proportion and ratio it is already reasonably
// served — 11 bank questions, 4 of them exam-kind — so the job here is to fill
// the pairings that are NOT yet taken. Already in the bank:
//   proportion (d755a649), upper_and_lower_bounds (8ac2ff8f),
//   time_calculations (bf2216ef), congruence_and_similarity (badfd8eb).
//
// That leaves three evidenced, independent pairings:
//   1. + converting_measurements — flow through a pipe, cm²/m³/min chain
//      (JUN24-H-P3 q6a, 5 marks, "B1 M2 M1dep A1ft", coded traps
//      unit_confusion_km_m / premature_rounding; the pattern recurs at q9)
//   2. + kinematic_graphs — speed from one segment of a distance-time graph
//      (JUN24-H-P2 q8, 3 marks, "M1 interval read + M1dep gradient + A1",
//      coded traps read_total_distance_not_change / ignore_time_interval)
//   3. + volume_of_a_sphere — mass and density to radius, via a cube root
//      (NOV24-H-P3 q22, 4 marks, coded traps mass_density_volume_chain /
//      cube_root_step)
//
// (2) doubles as the first exam-kind question for `kinematic_graphs`, which is
// 14 primary marks with 2 bank questions and NO synthesis item — third on the
// thin list in docs/audit/05-exam-coverage.md §E2.
//
//   npx tsx scripts/create-compound-units-synthesis.ts --json batch.json
//   npx tsx scripts/verify-question.ts --file batch.json [--svg]
//   npx tsx scripts/create-compound-units-synthesis.ts          # insert drafts
//   npx tsx scripts/create-compound-units-synthesis.ts --update # revise
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Draft rows this script owns; `--update` rewrites them in place. */
const DRAFT_IDS: Record<string, string> = {
  'pipe-flow-rate-to-litres': '1f4e3b55-ae7c-4117-b094-1b4be223b9d7',
  'distance-time-graph-final-stage-speed': '558967df-a83f-4820-b124-bae1f5fc5770',
  'sphere-radius-from-mass-and-density': '40908778-5687-47dc-b97c-84ef230cd1f6',
}

// ── C1: water through a pipe.
//
// The speed is in cm/s DELIBERATELY, so that cm² × cm/s = cm³/s composes with
// no conversion at all. An earlier draft gave the speed in m/s, which forced a
// cm² → m² step: that is a squared conversion factor of 10 000, a known
// stumbling block in its own right, and too much to bolt onto a rate chain at
// GCSE. (The source question's coded trap is unit_confusion_km_m — a LENGTH
// conversion — so the area version was never what the paper asked either.)
//
// What is left is the two mainstream conversions: minutes → seconds and
// cm³ → litres. litres = A·v·60T/1000, and every draw is a whole number.
const C1_A = '[25,15,40,12,30,20][sel]'   // cross-section, cm²
const C1_V = '[20,25,15,50,20,35][sel]'   // flow speed, cm/s
const C1_T = '[5,4,6,3,10,2][sel]'        // duration, minutes
const C1_CM3 = `(${C1_A}*${C1_V}*60*${C1_T})`
const C1_ANS = `(${C1_CM3}/1000)`

// ── C2: distance-time graph. Geometry is drawn from lattice units so the
// polyline always lands on exact pixels; only the y-axis SCALE (k km per unit)
// and the vertex positions vary.
//   (0,0) → (a,p) → (b,p) [stopped] → (c,q)
//
// The six tuples were searched rather than hand-picked, against four
// constraints at once (scratchpad search, criteria reproduced here):
//   • answer AND all three traps are whole numbers — k must be a common
//     multiple of c and (c−b), which is fiddly to satisfy by eye
//   • the traps are distinct from the answer and from each other
//   • BOTH stage speeds land in 10–32 km/h. Hand-picked values had a first
//     stage of 90 km/h on one draw and 40 on another: arithmetically fine,
//     but a graph that shows a 90 km/h cyclist is not a question anyone
//     should sit
//   • the stop lasts 1–2 hours, and the gradient visibly changes after it
// Answers spread 10, 12, 15, 16, 18, 20 km/h.
const C2_a = '[1,1,2,1,1,2][sel]'
const C2_b = '[3,2,3,3,2,3][sel]'
const C2_c = '[5,3,5,4,4,4][sel]'
const C2_p = '[2,3,2,3,1,2][sel]'
const C2_q = '[4,5,5,5,4,4][sel]'
const C2_k = '[10,6,10,8,12,10][sel]'   // km per vertical unit
const C2_PX = (t: string) => `(60+60*${t})`
const C2_PY = (u: string) => `(280-50*${u})`
const C2_ANS = `((${C2_q}-${C2_p})*${C2_k}/(${C2_c}-${C2_b}))`

// ── C3: sphere from mass and density. Volume is always a whole number of cm³;
// the radius is irrational, so it is asked to 1 dp with a matching tolerance.
const C3_D = '[8,7,11,9,3,2][sel]'         // density, g/cm³
const C3_VOL = '[500,1000,250,800,1500,2000][sel]'
const C3_M = `(${C3_D}*${C3_VOL})`         // mass, g
const C3_R3 = `(3*${C3_VOL}/(4*Math.PI))`  // r³
const C3_R = `Math.pow(${C3_R3}, 1/3)`

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
    name: 'pipe-flow-rate-to-litres',
    skill_ids: ['compound_units', 'converting_measurements'],
    difficulty: 3,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p>Water flows through a pipe at a constant speed of <strong>{{${C1_V}}} cm/s</strong>.</p>`
      + `<p>The pipe has a cross-sectional area of <strong>{{${C1_A}}} cm²</strong>.</p>`
      + `<p>Work out the volume of water that flows through the pipe in <strong>{{${C1_T}}} minutes</strong>.</p>`
      + `<p>Give your answer in <strong>litres</strong>.</p>`
      + `<p><em>1 litre = 1000 cm³.</em></p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${C1_ANS}}}`,
    answer_type: 'numeric',
    tolerance: 0.001,
    explanation:
      `In one second the water advances {{${C1_V}}} cm along the pipe, sweeping out a cylinder of length {{${C1_V}}} cm and cross-section {{${C1_A}}} cm².<br>`
      + `So the flow rate is {{${C1_A}}} × {{${C1_V}}} = <strong>{{${C1_A}*${C1_V}}} cm³ per second</strong>.<br>`
      + `Time: {{${C1_T}}} minutes × 60 = <strong>{{60*${C1_T}}} seconds</strong>.<br>`
      + `Volume = {{${C1_A}*${C1_V}}} × {{60*${C1_T}}} = <strong>{{${C1_CM3}}} cm³</strong>.<br>`
      + `Finally 1 litre = 1000 cm³, so that is {{${C1_CM3}}} ÷ 1000 = <strong>{{${C1_ANS}}} litres</strong>.`,
    traps: [
      {
        answer_template: `{{${C1_CM3}}}`,
        response: `That is the volume in cm³. The question asks for litres, and 1 litre = 1000 cm³: {{${C1_CM3}}} ÷ 1000 = {{${C1_ANS}}} litres.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${C1_ANS}/60}}`,
        response: `The speed is in centimetres per <em>second</em>, but you used {{${C1_T}}} as if it were seconds. {{${C1_T}}} minutes is {{${C1_T}}} × 60 = {{60*${C1_T}}} seconds, so the volume is {{${C1_ANS}}} litres.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${C1_CM3}/100}}`,
        response: `Check your conversion — you divided by 100. There are 1000 cm³ in a litre, so {{${C1_CM3}}} cm³ = {{${C1_ANS}}} litres.`,
        method_marks: 3,
      },
    ],
  },
  {
    name: 'distance-time-graph-final-stage-speed',
    skill_ids: ['compound_units', 'kinematic_graphs'],
    difficulty: 4,
    marks: 3,
    calculator: 'calc',
    question_template:
      `<p>The distance-time graph shows a cyclist's journey away from home.</p>`
      + `<svg viewBox="0 0 470 330" width="100%" style="max-width:470px;height:auto;">`
      // gridlines
      + `<g stroke="currentColor" stroke-width="0.5" opacity="0.25">`
      + [0, 1, 2, 3, 4, 5, 6].map(t => `<line x1="${60 + 60 * t}" y1="30" x2="${60 + 60 * t}" y2="280"/>`).join('')
      + [1, 2, 3, 4, 5].map(u => `<line x1="60" y1="${280 - 50 * u}" x2="420" y2="${280 - 50 * u}"/>`).join('')
      + `</g>`
      // axes
      + `<g stroke="currentColor" stroke-width="1.5" fill="none">`
      + `<line x1="60" y1="280" x2="430" y2="280"/><line x1="60" y1="280" x2="60" y2="25"/></g>`
      // axis labels
      + `<g fill="currentColor" font-size="13" text-anchor="middle">`
      + [0, 1, 2, 3, 4, 5, 6].map(t => `<text x="${60 + 60 * t}" y="299">${t}</text>`).join('')
      + `<text x="245" y="320">Time (hours)</text></g>`
      + `<g fill="currentColor" font-size="13" text-anchor="end">`
      + [1, 2, 3, 4, 5].map(u => `<text x="52" y="${280 - 50 * u + 5}">{{${u}*${C2_k}}}</text>`).join('')
      + `<text x="52" y="290">0</text></g>`
      + `<g fill="currentColor" font-size="13" text-anchor="middle">`
      + `<text x="20" y="155" transform="rotate(-90 20 155)">Distance (km)</text></g>`
      // the journey
      + `<polyline points="60,280 {{${C2_PX(C2_a)}}},{{${C2_PY(C2_p)}}} {{${C2_PX(C2_b)}}},{{${C2_PY(C2_p)}}} {{${C2_PX(C2_c)}}},{{${C2_PY(C2_q)}}}" `
      + `fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>`
      + `</svg>`
      + `<p>Work out the cyclist's speed during the <strong>final stage</strong> of the journey.</p>`
      + `<p>Give your answer in km/h.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${C2_ANS}}}`,
    answer_type: 'numeric',
    tolerance: 0.001,
    explanation:
      `The final stage runs from {{${C2_b}}} hours to {{${C2_c}}} hours.<br>`
      + `Over that stage the distance goes from {{${C2_p}*${C2_k}}} km up to {{${C2_q}*${C2_k}}} km, so the distance travelled is {{${C2_q}*${C2_k}}} − {{${C2_p}*${C2_k}}} = <strong>{{(${C2_q}-${C2_p})*${C2_k}}} km</strong>.<br>`
      + `The time taken is {{${C2_c}}} − {{${C2_b}}} = <strong>{{${C2_c}-${C2_b}}} hours</strong>.<br>`
      + `Speed = distance ÷ time = {{(${C2_q}-${C2_p})*${C2_k}}} ÷ {{${C2_c}-${C2_b}}} = <strong>{{${C2_ANS}}} km/h</strong>.`,
    traps: [
      {
        // The coded read_total_distance_not_change + ignore_time_interval,
        // together: the gradient of the whole journey rather than the stage.
        answer_template: `{{${C2_q}*${C2_k}/${C2_c}}}`,
        response: `That is the average speed for the WHOLE journey — total distance ÷ total time. The final stage is only the last section of the graph: it covers {{(${C2_q}-${C2_p})*${C2_k}}} km in {{${C2_c}-${C2_b}}} hours, so its speed is {{${C2_ANS}}} km/h.`,
        method_marks: 1,
      },
      {
        answer_template: `{{(${C2_q}-${C2_p})*${C2_k}/${C2_c}}}`,
        response: `You have the right distance ({{(${C2_q}-${C2_p})*${C2_k}}} km) but divided by the total time. The final stage starts at {{${C2_b}}} hours, so it lasts {{${C2_c}}} − {{${C2_b}}} = {{${C2_c}-${C2_b}}} hours, giving {{${C2_ANS}}} km/h.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${C2_q}*${C2_k}/(${C2_c}-${C2_b})}}`,
        response: `You have the right time ({{${C2_c}-${C2_b}}} hours) but used the distance from home, not the distance travelled in that stage. The cyclist was already {{${C2_p}*${C2_k}}} km out when the stage began, so only {{${C2_q}*${C2_k}}} − {{${C2_p}*${C2_k}}} = {{(${C2_q}-${C2_p})*${C2_k}}} km is new: {{${C2_ANS}}} km/h.`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'sphere-radius-from-mass-and-density',
    skill_ids: ['compound_units', 'volume_of_a_sphere'],
    difficulty: 5,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p>A solid metal sphere has a mass of <strong>{{${C3_M}}} g</strong>.</p>`
      + `<p>The metal has a density of <strong>{{${C3_D}}} g/cm³</strong>.</p>`
      + `<p>Work out the radius of the sphere.</p>`
      + `<p>Give your answer in centimetres, correct to <strong>1 decimal place</strong>.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{round(${C3_R}, 1)}}`,
    answer_type: 'numeric',
    tolerance: 0.05,
    explanation:
      `Density = mass ÷ volume, so volume = mass ÷ density = {{${C3_M}}} ÷ {{${C3_D}}} = <strong>{{${C3_VOL}}} cm³</strong>.<br>`
      + `For a sphere, V = {{frac(4, 3)}}πr³. Rearranging gives r³ = 3V ÷ (4π) = 3 × {{${C3_VOL}}} ÷ (4π) = <strong>{{round(${C3_R3}, 2)}}</strong>.<br>`
      + `Take the cube root: r = ∛{{round(${C3_R3}, 2)}} = <strong>{{round(${C3_R}, 1)}} cm</strong> (to 1 dp).`,
    traps: [
      {
        answer_template: `{{${C3_VOL}}}`,
        response: `That is the sphere's volume in cm³, which is only the first step. Now use V = {{frac(4, 3)}}πr³ to get back to the radius: r³ = 3 × {{${C3_VOL}}} ÷ (4π) = {{round(${C3_R3}, 2)}}, so r = {{round(${C3_R}, 1)}} cm.`,
        method_marks: 1,
      },
      {
        // The coded cube_root_step: stopped at r³.
        answer_template: `{{round(${C3_R3}, 2)}}`,
        response: `That is r³, not r. Take the cube root to finish: ∛{{round(${C3_R3}, 2)}} = {{round(${C3_R}, 1)}} cm.`,
        method_marks: 3,
      },
      {
        answer_template: `{{round(2*${C3_R}, 1)}}`,
        response: `That is the diameter. The question asks for the radius, which is half of it: {{round(${C3_R}, 1)}} cm.`,
        method_marks: 3,
      },
      {
        answer_template: `{{round(${C3_M}*${C3_D}, 1)}}`,
        response: `Check the density formula — you multiplied. Density = mass ÷ volume, so volume = mass ÷ density = {{${C3_M}}} ÷ {{${C3_D}}} = {{${C3_VOL}}} cm³, and the radius works out as {{round(${C3_R}, 1)}} cm.`,
        method_marks: 0,
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

/**
 * Update payload: everything EXCEPT is_published.
 *
 * `--update` must never flip a question back to draft. The user is the
 * publishing gate, and once they have approved one of these rows, a later
 * revision here would otherwise silently pull it off the live site — which is
 * exactly what would have happened to d755a649.
 */
function updateOf(q: Draft) {
  const { is_published: _ignored, ...rest } = rowOf(q)
  return rest
}

async function main() {
  const jsonIdx = process.argv.indexOf('--json')
  if (jsonIdx !== -1) {
    const path = process.argv[jsonIdx + 1]
    writeFileSync(path, JSON.stringify(drafts.map(rowOf), null, 1))
    console.log(`wrote ${drafts.length} question(s) to ${path}`)
    return
  }

  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(drafts.map(rowOf), null, 1))
    return
  }

  if (process.argv.includes('--update')) {
    // `--update <name>` restricts the rewrite to ONE question. Without it every
    // row this script owns is rewritten — including rows that are already
    // published and may have been hand-edited in the admin UI since, whose
    // changes this would silently overwrite. Prefer the named form.
    const only = process.argv[process.argv.indexOf('--update') + 1]
    const targets = only && !only.startsWith('--') ? drafts.filter(q => q.name === only) : drafts
    if (!targets.length) { console.error(`no question named "${only}" in this script`); process.exit(1) }
    if (targets.length > 1) console.log(`rewriting all ${targets.length} rows — pass --update <name> to target just one`)
    for (const q of targets) {
      const id = DRAFT_IDS[q.name]
      if (!id) { console.error(`no draft id recorded for "${q.name}" — insert it first`); process.exit(1) }
      const { error } = await supabase.from('questions').update(updateOf(q)).eq('id', id)
      if (error) { console.error(`update failed for ${q.name}:`, error); process.exit(1) }
      console.log(`  updated ${q.name}: ${id}`)
    }
    return
  }

  const { data, error } = await supabase.from('questions').insert(drafts.map(rowOf)).select('id')
  if (error) { console.error('insert failed:', error); process.exit(1) }
  console.log('Inserted as DRAFTS (is_published=false):')
  data!.forEach((r, i) => console.log(`  ${drafts[i].name}: ${r.id}`))
  console.log(`\nverify:  npx tsx scripts/verify-question.ts ${data!.map(r => r.id).join(' ')}`)
}

main()
