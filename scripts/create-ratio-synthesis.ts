import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// Ratio SYNTHESIS questions (kind='exam') — Phase 5 step 1, after the
// proportion batch (scripts/create-proportion-synthesis.ts).
//
// `ratio` carries 33 involvement-weighted exam-kind marks across the coded 2024
// series against five bank questions, only ONE of which is exam-kind. See
// docs/audit/05-exam-coverage.md §E2c.
//
// `ratio` sits DOWNSTREAM of proportion, so its prerequisite closure is wide —
// proportion, simplifying_ratio, fractions_of_amounts,
// fractions_decimals_and_percentages, simplifying_fractions, simple_arithmetic,
// decimals — and every one of those is excluded as a synthesis partner. That
// rules out the two pairings the papers use most often ([fractions_of_amounts,
// ratio] appears twice); they would be mastery, not synthesis.
//
// It also rules out repeating ratio + percentage_change: the bank's one
// exam-kind ratio question (245fb5b8) is already exactly that, as is 8c70c92c.
//
// The three pairings below are independent, evidenced, and unlike anything in
// the bank — every existing ratio question is a share-a-sum-of-money item:
//   1. ratio + areas_of_squares_and_rectangles  — equal perimeters, area ratio
//      (NOV24-F-P3 q21, 4 marks, coded traps equal_areas / perimeter_not_area)
//   2. ratio + coordinates                      — point dividing AB in m:n
//      (JUN24-H-P3 q15a, 3 marks, coded traps partial_coordinate /
//      ratio_split_wrong)
//   3. ratio + volume_of_a_prism/_sphere        — cylinder:sphere volume ratio
//      (JUN24-H-P3 q21a, 3 marks, coded traps ratio_inverted / pi_not_cancelled)
//
// Two of the three were coded `app_supported: partial` purely because a ratio
// or coordinate answer needed an equivalence checker. That shipped, so they are
// authorable verbatim now — this batch is the first content to exercise it.
//
// The `ratio` grader is equivalence-aware (6:8 ≡ 3:4) AND direction-sensitive
// (4:3 ≢ 3:4), which is what makes an inverted-ratio trap possible at all.
// `requires_simplest: true` on the two ratio answers, so an unsimplified
// equivalent is rejected with a "give it in its simplest form" nudge rather
// than silently accepted — the simplification IS part of what's assessed.
//
//   npx tsx scripts/create-ratio-synthesis.ts --json batch.json
//   npx tsx scripts/verify-question.ts --file batch.json
//   npx tsx scripts/create-ratio-synthesis.ts            # insert as drafts
//   npx tsx scripts/create-ratio-synthesis.ts --update   # revise in place
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Draft rows this script owns; `--update` rewrites them in place. */
const DRAFT_IDS: Record<string, string> = {
  'equal-perimeter-rectangle-square-area-ratio': '1e87919a-ac8c-435d-9ac5-c2fc0a4ff05d',
  'point-dividing-line-in-given-ratio': '9657a229-39b6-4e14-8141-dbf358cfcb10',
  'cylinder-sphere-volume-ratio': '38aa836d-cb1c-4f74-9a58-0fd2ac116bac',
}

// ── R1: rectangle vs equal-perimeter square. Every (L+W) is even so the square's
// side is a whole number, and gcd(area, area) > 1 on every draw so "divide both
// by g" is always a real simplification step. Six distinct answers.
const R1_L = '[12,16,10,14,18,15][sel]'
const R1_W = '[4,4,2,6,2,9][sel]'
const R1_S = `((${R1_L}+${R1_W})/2)`
const R1_NUM = `(${R1_L}*${R1_W})`
const R1_DEN = `(${R1_S}*${R1_S})`
const R1_G = `gcd(${R1_NUM},${R1_DEN})`
const R1_GLS = `gcd(${R1_L},${R1_S})`

// ── R2: P divides AB in the ratio m:n. (m+n) divides both deltas on every draw,
// so P always lands on integer coordinates.
const R2_AX = '[1,-2,3,0,-6,2][sel]'
const R2_AY = '[2,1,-4,5,-2,9][sel]'
const R2_BX = '[13,10,15,20,8,18][sel]'
const R2_BY = '[10,16,8,-5,12,1][sel]'
const R2_M = '[1,2,1,3,3,5][sel]'
const R2_N = '[3,1,2,2,4,3][sel]'
const R2_FRAC = `(${R2_M}/(${R2_M}+${R2_N}))`
const R2_FRACN = `(${R2_N}/(${R2_M}+${R2_N}))`
const R2_DX = `(${R2_BX}-${R2_AX})`
const R2_DY = `(${R2_BY}-${R2_AY})`
const R2_PX = `(${R2_AX}+${R2_DX}*${R2_FRAC})`
const R2_PY = `(${R2_AY}+${R2_DY}*${R2_FRAC})`
/**
 * The coordinates of the point reached by measuring the m share from B instead
 * of from A — i.e. n/(m+n) of the way along rather than m/(m+n).
 *
 * Used three times: once for the fully wrong point, and once each for the
 * `partial_coordinate` case the source question codes, where the student gets
 * one coordinate right and makes this same slip on the other.
 *
 * Those five points can never collide, and it is structural rather than luck:
 * wrong ≠ right on an axis iff m ≠ n and the delta along that axis is non-zero.
 * No draw has m = n, and no draw has dx = 0 or dy = 0.
 */
const R2_WX = `(${R2_AX}+${R2_DX}*${R2_FRACN})`
const R2_WY = `(${R2_AY}+${R2_DY}*${R2_FRACN})`

// ── R3: cylinder vs sphere. V(cyl) : V(sph) = πr²h : (4/3)πR³ — π cancels,
// which is the point of the question.
//
// R is ALWAYS a multiple of 3, so (4/3)R³ is a whole number and the sphere's
// volume reads "36π cm³" rather than an unsimplified ¹⁰⁸⁄₃π. That also removes
// the need for a "multiply both parts by 3 to clear the thirds" step, which
// would have been dead wording on the draws where nothing was fractional.
// No draw gives 1:1, so the inverted-ratio trap can never collide.
const R3_r = '[2,3,6,4,3,6][sel]'
const R3_h = '[6,6,2,3,8,6][sel]'
const R3_R = '[3,3,3,3,6,6][sel]'
const R3_CUBE = `(${R3_R}*${R3_R}*${R3_R})`
const R3_NUM = `(${R3_r}*${R3_r}*${R3_h})`
const R3_DEN = `(4*${R3_CUBE}/3)`
const R3_G = `gcd(${R3_NUM},${R3_DEN})`
/** Trap: sphere treated as R³ (the 4/3 dropped entirely). */
const R3_T2G = `gcd(${R3_NUM},${R3_CUBE})`
/** Trap: sphere treated as 4πR³ (only the ⅓ dropped). */
const R3_T3D = `(4*${R3_CUBE})`
const R3_T3G = `gcd(${R3_NUM},${R3_T3D})`

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
  answer_type: 'ratio' | 'coordinate'
  tolerance: number | null
  requires_simplest: boolean
  traps: { answer_template: string; response: string; method_marks?: number }[]
  explanation: string
}

const drafts: Draft[] = [
  {
    name: 'equal-perimeter-rectangle-square-area-ratio',
    skill_ids: ['ratio', 'areas_of_squares_and_rectangles'],
    difficulty: 4,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p>A rectangle is <strong>{{${R1_L}}} cm</strong> long and <strong>{{${R1_W}}} cm</strong> wide.</p>`
      + `<p>A square has the <strong>same perimeter</strong> as the rectangle.</p>`
      + `<p>Work out the ratio of the <strong>area of the rectangle</strong> to the <strong>area of the square</strong>.</p>`
      + `<p>Give your answer in its simplest form.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${R1_NUM}/${R1_G}}}:{{${R1_DEN}/${R1_G}}}`,
    answer_type: 'ratio',
    tolerance: null,
    requires_simplest: true,
    explanation:
      `Perimeter of the rectangle = 2 × ({{${R1_L}}} + {{${R1_W}}}) = <strong>{{2*(${R1_L}+${R1_W})}} cm</strong>.<br>`
      + `The square has the same perimeter, so each side is {{2*(${R1_L}+${R1_W})}} ÷ 4 = <strong>{{${R1_S}}} cm</strong>.<br>`
      + `Area of the rectangle = {{${R1_L}}} × {{${R1_W}}} = <strong>{{${R1_NUM}}} cm²</strong>.<br>`
      + `Area of the square = {{${R1_S}}} × {{${R1_S}}} = <strong>{{${R1_DEN}}} cm²</strong>.<br>`
      + `Ratio = {{${R1_NUM}}} : {{${R1_DEN}}}, and dividing both by {{${R1_G}}} gives <strong>{{${R1_NUM}/${R1_G}}} : {{${R1_DEN}/${R1_G}}}</strong>.`,
    traps: [
      {
        // The coded equal_areas / perimeter_not_area misconception — one value
        // covers both routes to it, so one trap explains both.
        answer_template: `1:1`,
        response: `Equal perimeters do <em>not</em> mean equal areas — and the question asks about area, not perimeter. The rectangle is {{${R1_L}}} × {{${R1_W}}} = {{${R1_NUM}}} cm², while the square of the same perimeter has side {{${R1_S}}} cm and area {{${R1_DEN}}} cm². The ratio is {{${R1_NUM}/${R1_G}}} : {{${R1_DEN}/${R1_G}}}.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${R1_DEN}/${R1_G}}}:{{${R1_NUM}/${R1_G}}}`,
        response: `Right numbers, wrong way round — a ratio is read in the order the question names things. It asks for rectangle to square, so it is {{${R1_NUM}}} : {{${R1_DEN}}} = {{${R1_NUM}/${R1_G}}} : {{${R1_DEN}/${R1_G}}}.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${R1_L}/${R1_GLS}}}:{{${R1_S}/${R1_GLS}}}`,
        response: `That compares the rectangle's length with the square's side — two lengths, not two areas. Work out each area first: {{${R1_NUM}}} cm² and {{${R1_DEN}}} cm², giving {{${R1_NUM}/${R1_G}}} : {{${R1_DEN}/${R1_G}}}.`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'point-dividing-line-in-given-ratio',
    skill_ids: ['ratio', 'coordinates'],
    difficulty: 5,
    marks: 3,
    calculator: 'na',
    question_template:
      `<p><strong>A</strong> is the point ({{${R2_AX}}}, {{${R2_AY}}}).</p>`
      + `<p><strong>B</strong> is the point ({{${R2_BX}}}, {{${R2_BY}}}).</p>`
      + `<p><strong>P</strong> lies on the straight line <strong>AB</strong> so that <strong>AP : PB = {{${R2_M}}} : {{${R2_N}}}</strong>.</p>`
      + `<p>Work out the coordinates of <strong>P</strong>.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `({{${R2_PX}}}, {{${R2_PY}}})`,
    answer_type: 'coordinate',
    tolerance: null,
    requires_simplest: false,
    explanation:
      // Brackets round a negative subtrahend: without them "8 − -4" reaches the
      // student, and cleanExpression cannot collapse it because the operator is
      // a U+2212 minus while the sign on the number is an ASCII hyphen.
      `AP : PB = {{${R2_M}}} : {{${R2_N}}}, so AB is divided into {{${R2_M}}} + {{${R2_N}}} = {{${R2_M}+${R2_N}}} equal parts, and P is {{${R2_M}}} of them from A — that is {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} of the way from A to B.<br>`
      + `Going from A to B, x changes by {{${R2_BX}}} − {{${R2_AX} < 0 ? '(' + (${R2_AX}) + ')' : ${R2_AX}}} = {{${R2_DX}}} and y changes by {{${R2_BY}}} − {{${R2_AY} < 0 ? '(' + (${R2_AY}) + ')' : ${R2_AY}}} = {{${R2_DY}}}.<br>`
      + `Take {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} of each: {{${R2_DX}}} × {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} = {{${R2_DX}*${R2_FRAC}}} and {{${R2_DY}}} × {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} = {{${R2_DY}*${R2_FRAC}}}.<br>`
      + `Add those to A: P = ({{${R2_AX}}} + {{${R2_DX}*${R2_FRAC}}}, {{${R2_AY}}} + {{${R2_DY}*${R2_FRAC}}}) = <strong>({{${R2_PX}}}, {{${R2_PY}}})</strong>.`,
    traps: [
      {
        // The coded ratio_split_wrong: measured the m share from B instead of A.
        answer_template: `({{${R2_WX}}}, {{${R2_WY}}})`,
        response: `You have gone {{fracStr(${R2_N}, ${R2_M}+${R2_N})}} of the way instead of {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} — that is the point where <em>BP</em> : <em>PA</em> = {{${R2_M}}} : {{${R2_N}}}. AP is the FIRST part, so P is {{${R2_M}}} of the {{${R2_M}+${R2_N}}} parts from A: ({{${R2_PX}}}, {{${R2_PY}}}).`,
        method_marks: 2,
      },
      {
        // The coded partial_coordinate: the same wrong-end slip, but on ONE
        // axis only. Worth separating from the both-axes trap because the
        // student has demonstrably got the method right once — the feedback
        // should say which half to keep, not re-teach the whole thing.
        answer_template: `({{${R2_PX}}}, {{${R2_WY}}})`,
        response: `Your x-coordinate is right, so the method is there — but the y-coordinate has gone {{fracStr(${R2_N}, ${R2_M}+${R2_N})}} of the way instead of {{fracStr(${R2_M}, ${R2_M}+${R2_N})}}. Apply the same {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} you used for x: {{${R2_AY}}} + {{${R2_DY}}} × {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} = {{${R2_PY}}}, giving ({{${R2_PX}}}, {{${R2_PY}}}).`,
        method_marks: 2,
      },
      {
        answer_template: `({{${R2_WX}}}, {{${R2_PY}}})`,
        response: `Your y-coordinate is right, so the method is there — but the x-coordinate has gone {{fracStr(${R2_N}, ${R2_M}+${R2_N})}} of the way instead of {{fracStr(${R2_M}, ${R2_M}+${R2_N})}}. Apply the same {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} you used for y: {{${R2_AX}}} + {{${R2_DX}}} × {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} = {{${R2_PX}}}, giving ({{${R2_PX}}}, {{${R2_PY}}}).`,
        method_marks: 2,
      },
      {
        answer_template: `({{(${R2_AX}+${R2_BX})/2}}, {{(${R2_AY}+${R2_BY})/2}})`,
        response: `That is the midpoint of AB, which would only be right if the ratio were 1 : 1. Here AP : PB = {{${R2_M}}} : {{${R2_N}}}, so P sits {{fracStr(${R2_M}, ${R2_M}+${R2_N})}} of the way along: ({{${R2_PX}}}, {{${R2_PY}}}).`,
        method_marks: 1,
      },
      {
        answer_template: `({{${R2_DX}*${R2_FRAC}}}, {{${R2_DY}*${R2_FRAC}}})`,
        response: `That is the <em>step</em> from A to P, not the position of P. You still have to start from A: ({{${R2_AX}}} + {{${R2_DX}*${R2_FRAC}}}, {{${R2_AY}}} + {{${R2_DY}*${R2_FRAC}}}) = ({{${R2_PX}}}, {{${R2_PY}}}).`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'cylinder-sphere-volume-ratio',
    skill_ids: ['ratio', 'volume_of_a_prism', 'volume_of_a_sphere'],
    difficulty: 5,
    marks: 3,
    calculator: 'non_calc',
    question_template:
      `<p>A solid cylinder has radius <strong>{{${R3_r}}} cm</strong> and height <strong>{{${R3_h}}} cm</strong>.</p>`
      + `<p>A solid sphere has radius <strong>{{${R3_R}}} cm</strong>.</p>`
      + `<p>Work out the ratio of the <strong>volume of the cylinder</strong> to the <strong>volume of the sphere</strong>.</p>`
      + `<p>Give your answer in its simplest form.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${R3_NUM}/${R3_G}}}:{{${R3_DEN}/${R3_G}}}`,
    answer_type: 'ratio',
    tolerance: null,
    requires_simplest: true,
    explanation:
      `Volume of the cylinder = πr²h = π × {{${R3_r}}}² × {{${R3_h}}} = <strong>{{${R3_NUM}}}π cm³</strong>.<br>`
      + `Volume of the sphere = {{frac(4, 3)}}πR³ = {{frac(4, 3)}} × π × {{${R3_CUBE}}} = <strong>{{${R3_DEN}}}π cm³</strong>.<br>`
      + `Both volumes are a whole number of πs, so the π cancels: {{${R3_NUM}}} : {{${R3_DEN}}}.<br>`
      + `Dividing both parts by {{${R3_G}}} gives <strong>{{${R3_NUM}/${R3_G}}} : {{${R3_DEN}/${R3_G}}}</strong>.`,
    traps: [
      {
        // The coded ratio_inverted. Safe as a trap because no draw gives 1:1.
        answer_template: `{{${R3_DEN}/${R3_G}}}:{{${R3_NUM}/${R3_G}}}`,
        response: `Right numbers, wrong order. The question asks for cylinder to sphere, and the cylinder is {{${R3_NUM}}}π cm³ against the sphere's {{${R3_DEN}}}π cm³, so the ratio is {{${R3_NUM}/${R3_G}}} : {{${R3_DEN}/${R3_G}}}.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${R3_NUM}/${R3_T2G}}}:{{${R3_CUBE}/${R3_T2G}}}`,
        response: `You have compared r²h with R³ and left the {{frac(4, 3)}} out of the sphere's formula altogether. The sphere's volume is {{frac(4, 3)}}πR³ = {{${R3_DEN}}}π cm³, which gives {{${R3_NUM}/${R3_G}}} : {{${R3_DEN}/${R3_G}}}.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${R3_NUM}/${R3_T3G}}}:{{${R3_T3D}/${R3_T3G}}}`,
        response: `Close — you used 4πR³ for the sphere, but the formula is {{frac(4, 3)}}πR³, which is a third of that. The sphere is {{${R3_DEN}}}π cm³, so the ratio is {{${R3_NUM}/${R3_G}}} : {{${R3_DEN}/${R3_G}}}.`,
        method_marks: 2,
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
    requires_simplest: q.requires_simplest,
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
    console.log(`now run:  npx tsx scripts/verify-question.ts --file ${path}`)
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
