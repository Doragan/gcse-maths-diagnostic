import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'

// ─────────────────────────────────────────────────────────────────────────────
// Five Higher-tier grade-8/9 SYNTHESIS questions (kind='exam', difficulty 5).
// Each single answer requires TWO independent skills (neither a prerequisite of
// the other — verified against the skill graph before authoring):
//   1. combined_events + solving_quadratic_equations_factorising  (counters → n)
//   2. proportion_with_powers + percentage_change                 (y ∝ xᵏ, x +p%)
//   3. congruence_and_similarity + compound_units                 (similar solids mass)
//   4. surds_expanding_and_rationalising + areas_of_squares_and_rectangles
//   5. upper_and_lower_bounds + compound_units                    (UB of speed)
//
// Inserted as DRAFTS (is_published=false) for user review — never published here.
// Before insert, the ENTIRE parameter space of every question is enumerated and
// verified: stem/answer/explanation/trap responses all render with no
// [error]/undefined/NaN, the canonical answer grades correct, and no trap ever
// collides with the correct answer. Run:  npx tsx scripts/create-synthesis-questions.ts
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type Draft = {
  name: string
  skill_ids: string[]
  difficulty: number
  question_template: string
  question_type: 'numeric' | 'exact'
  parameters: Record<string, { type: 'integer'; min: number; max: number }>
  answer_template: string
  answer_type: 'numeric' | 'exact'
  tolerance: number | null
  traps: { answer_template: string; response: string }[]
  explanation: string
  calculator: 'calc' | 'non_calc' | 'na'
  acceptProbes?: (vals: Record<string, number>) => string[] // extra inputs that MUST grade correct
}

// Q1 curated variants: r(r−1)/(n(n−1)) = p/q with K = n(n−1)
// r = [6,5,4,7,5,6,8,4]  n = [10,9,8,10,7,9,12,6]
// p = [1,5,3,7,10,5,14,2]  q = [3,18,14,15,21,12,33,5]  K = [90,72,56,90,42,72,132,30]
const R = '[6,5,4,7,5,6,8,4][sel]'
const N = '[10,9,8,10,7,9,12,6][sel]'
const P = '[1,5,3,7,10,5,14,2][sel]'
const Q = '[3,18,14,15,21,12,33,5][sel]'
const K = '[90,72,56,90,42,72,132,30][sel]'

// Q3 curated variants: heights (h → H), length sf k, 8k³ integer multiplier
// h = [10,8,10,12,14,9]  H = [15,20,20,30,21,27]  k = [1.5,2.5,2,2.5,1.5,3]
// 8k³ = [27,125,64,125,27,216]   8k² = [18,50,32,50,18,72]   8k = [12,20,16,20,12,24]
const H3h = '[10,8,10,12,14,9][sel]'
const H3H = '[15,20,20,30,21,27][sel]'
const K3  = '[15,25,20,25,15,30][sel]/10'
const KC3 = '[3.375,15.625,8,15.625,3.375,27][sel]'

// Q4 curated variants: width a+√n, length b+c√n, area A+B√n (A=ab+cn, B=b+ac)
// n = [5,3,2,7,3,5]  a = [3,2,4,2,5,2]  b = [4,5,3,6,2,7]  c = [2,3,2,2,4,3]
// A = [22,19,16,26,22,29]  B = [10,11,11,10,22,13]
const Sn = '[5,3,2,7,3,5][sel]'
const Sa = '[3,2,4,2,5,2][sel]'
const Sb = '[4,5,3,6,2,7][sel]'
const Sc = '[2,3,2,2,4,3][sel]'
const SA = '[22,19,16,26,22,29][sel]'
const SB = '[10,11,11,10,22,13][sel]'

const drafts: Draft[] = [
  {
    name: 'counters-without-replacement-find-n',
    skill_ids: ['combined_events', 'solving_quadratic_equations_factorising'],
    difficulty: 5,
    calculator: 'na',
    question_template:
      `<p>A bag contains <strong>n</strong> counters. <strong>{{${R}}}</strong> of the counters are red and the rest are blue.</p>` +
      `<p>Two counters are taken from the bag at random, <strong>without replacement</strong>.</p>` +
      `<p>The probability that both counters are red is <strong>{{frac(${P}, ${Q})}}</strong>.</p>` +
      `<p>Work out the value of <strong>n</strong>.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 7 } },
    answer_template: `{{${N}}}`,
    answer_type: 'numeric',
    tolerance: 0,
    explanation:
      `P(both red) = {{${R}}}/n × {{${R} - 1}}/(n − 1) = {{${R} * (${R} - 1)}}/(n(n − 1)).<br>` +
      `So {{${R} * (${R} - 1)}}/(n(n − 1)) = {{frac(${P}, ${Q})}}, which gives n(n − 1) = {{${R} * (${R} - 1)}} × {{${Q}}} ÷ {{${P}}} = {{${K}}}.<br>` +
      `n² − n − {{${K}}} = 0 factorises as (n − {{${N}}})(n + {{${N} - 1}}) = 0.<br>` +
      `n is a number of counters, so it must be positive: n = <strong>{{${N}}}</strong>.`,
    traps: [
      {
        answer_template: `{{${K}}}`,
        response: `That is the value of n(n − 1), not n. Finish by solving the quadratic: n² − n − {{${K}}} = 0, so (n − {{${N}}})(n + {{${N} - 1}}) = 0 and n = {{${N}}}.`,
      },
      {
        answer_template: `{{${N} - 1}}`,
        response: `It looks like you solved n(n + 1) = {{${K}}}. After the first counter is taken there are n − 1 counters left, so the equation is n(n − 1) = {{${K}}}, giving n = {{${N}}}.`,
      },
    ],
  },
  {
    name: 'proportion-power-percentage-increase',
    skill_ids: ['proportion_with_powers', 'percentage_change'],
    difficulty: 5,
    calculator: 'na',
    question_template:
      `<p><strong>y</strong> is directly proportional to <strong>x{{['²','³'][sel]}}</strong>.</p>` +
      `<p>The value of x is increased by <strong>{{10 * m}}%</strong>.</p>` +
      `<p>Work out the percentage increase in the value of y.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 1 }, m: { type: 'integer', min: 1, max: 5 } },
    answer_template: `{{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}`,
    answer_type: 'numeric',
    tolerance: 0.01,
    explanation:
      `An increase of {{10 * m}}% means x is multiplied by {{1 + m/10}}.<br>` +
      `y is proportional to x{{['²','³'][sel]}}, so y is multiplied by {{1 + m/10}}{{['²','³'][sel]}} = {{round(Math.pow(1 + m/10, [2,3][sel]), 3)}}.<br>` +
      `That is {{round(Math.pow(1 + m/10, [2,3][sel]) * 100, 1)}}% of the original value — a percentage increase of {{round(Math.pow(1 + m/10, [2,3][sel]) * 100, 1)}} − 100 = <strong>{{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}%</strong>.`,
    traps: [
      {
        answer_template: `{{10 * m * [2,3][sel]}}`,
        response: `You multiplied the percentage by the power — percentage changes don't scale like that. Use multipliers: x is multiplied by {{1 + m/10}}, so y is multiplied by {{1 + m/10}}{{['²','³'][sel]}} = {{round(Math.pow(1 + m/10, [2,3][sel]), 3)}}, a {{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}% increase.`,
      },
      {
        answer_template: `{{round(Math.pow(1 + m/10, [2,3][sel]) * 100, 1)}}`,
        response: `That is the NEW value of y as a percentage of the old value. The percentage INCREASE is that minus 100: {{round(Math.pow(1 + m/10, [2,3][sel]) * 100, 1)}} − 100 = {{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}%.`,
      },
      {
        answer_template: `{{10 * m}}`,
        response: `y is not proportional to x itself — it is proportional to x{{['²','³'][sel]}}, so it grows faster than x. Multiply the x multiplier out: {{1 + m/10}}{{['²','³'][sel]}} = {{round(Math.pow(1 + m/10, [2,3][sel]), 3)}}, a {{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}% increase.`,
      },
    ],
  },
  {
    name: 'similar-solids-mass',
    skill_ids: ['congruence_and_similarity', 'compound_units'],
    difficulty: 5,
    calculator: 'na',
    question_template:
      `<p>Two solid ornaments are <strong>mathematically similar</strong> and are made of the same material.</p>` +
      `<p>The smaller ornament has height <strong>{{${H3h}}} cm</strong> and mass <strong>{{8 * mm}} g</strong>.</p>` +
      `<p>The larger ornament has height <strong>{{${H3H}}} cm</strong>.</p>` +
      `<p>Work out the mass of the larger ornament.</p>`,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 }, mm: { type: 'integer', min: 10, max: 25 } },
    answer_template: `{{[27,125,64,125,27,216][sel] * mm}} g`,
    answer_type: 'numeric',
    tolerance: 0,
    explanation:
      `The length scale factor is {{${H3H}}} ÷ {{${H3h}}} = {{${K3}}}.<br>` +
      `The ornaments are made of the same material, so they have the same density — which means mass scales with <strong>volume</strong>. The volume scale factor is {{${K3}}}³ = {{${KC3}}}.<br>` +
      `Mass of the larger ornament = {{8 * mm}} × {{${KC3}}} = <strong>{{[27,125,64,125,27,216][sel] * mm}} g</strong>.`,
    traps: [
      {
        answer_template: `{{8 * mm * [15,25,20,25,15,30][sel] / 10}}`,
        response: `You multiplied the mass by the LENGTH scale factor. Mass depends on volume, and volume scales with the CUBE of the length scale factor: ({{${K3}}})³ = {{${KC3}}}, so the mass is {{8 * mm}} × {{${KC3}}} = {{[27,125,64,125,27,216][sel] * mm}} g.`,
      },
      {
        answer_template: `{{8 * mm * [225,625,400,625,225,900][sel] / 100}}`,
        response: `You used ({{${K3}}})², which is the AREA scale factor. Mass depends on volume, so cube the length scale factor: ({{${K3}}})³ = {{${KC3}}}, giving {{8 * mm}} × {{${KC3}}} = {{[27,125,64,125,27,216][sel] * mm}} g.`,
      },
    ],
  },
  {
    name: 'surd-rectangle-length',
    skill_ids: ['surds_expanding_and_rationalising', 'areas_of_squares_and_rectangles'],
    difficulty: 5,
    calculator: 'na',
    question_template:
      `<p>A rectangle has area <strong>({{${SA}}} + {{${SB}}}√{{${Sn}}}) cm²</strong> and width <strong>({{${Sa}}} + √{{${Sn}}}) cm</strong>.</p>` +
      `<p>Work out the length of the rectangle.</p>` +
      `<p>Give your answer in the form <strong>p + q√{{${Sn}}}</strong>, where p and q are integers.</p>`,
    question_type: 'exact',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${Sb}}}+{{${Sc}}}√{{${Sn}}}`,
    answer_type: 'exact',
    tolerance: null,
    explanation:
      `Length = area ÷ width = ({{${SA}}} + {{${SB}}}√{{${Sn}}}) ÷ ({{${Sa}}} + √{{${Sn}}}).<br>` +
      `Rationalise by multiplying the top and bottom by ({{${Sa}}} − √{{${Sn}}}):<br>` +
      `bottom: ({{${Sa}}} + √{{${Sn}}})({{${Sa}}} − √{{${Sn}}}) = {{${Sa}}}² − {{${Sn}}} = {{${Sa} * ${Sa} - ${Sn}}}<br>` +
      `top: ({{${SA}}} + {{${SB}}}√{{${Sn}}})({{${Sa}}} − √{{${Sn}}}) = {{${SA} * ${Sa} - ${SB} * ${Sn}}} + {{${SB} * ${Sa} - ${SA}}}√{{${Sn}}}<br>` +
      `Length = ({{${SA} * ${Sa} - ${SB} * ${Sn}}} + {{${SB} * ${Sa} - ${SA}}}√{{${Sn}}}) ÷ {{${Sa} * ${Sa} - ${Sn}}} = <strong>{{${Sb}}} + {{${Sc}}}√{{${Sn}}} cm</strong>.<br>` +
      `Check: ({{${Sa}}} + √{{${Sn}}})({{${Sb}}} + {{${Sc}}}√{{${Sn}}}) = {{${Sa} * ${Sb}}} + {{${Sa} * ${Sc}}}√{{${Sn}}} + {{${Sb}}}√{{${Sn}}} + {{${Sc} * ${Sn}}} = {{${SA}}} + {{${SB}}}√{{${Sn}}} ✓`,
    traps: [
      {
        answer_template: `{{${SA} - ${Sa}}}+{{${SB} - 1}}√{{${Sn}}}`,
        response: `You SUBTRACTED the width from the area. Area = length × width, so length = area ÷ width — rationalise ({{${SA}}} + {{${SB}}}√{{${Sn}}}) ÷ ({{${Sa}}} + √{{${Sn}}}) by multiplying the top and bottom by ({{${Sa}}} − √{{${Sn}}}).`,
      },
      {
        answer_template: `{{${Sc}}}+{{${Sb}}}√{{${Sn}}}`,
        response: `Check your final line — the integer part and the √{{${Sn}}} part are swapped. The length is {{${Sb}}} + {{${Sc}}}√{{${Sn}}} cm.`,
      },
    ],
    acceptProbes: vals => {
      const b = [4, 5, 3, 6, 2, 7][vals.sel], c = [2, 3, 2, 2, 4, 3][vals.sel], n = [5, 3, 2, 7, 3, 5][vals.sel]
      return [`${b} + ${c}√${n}`, `${b}+${c}√${n} cm`]
    },
  },
  {
    name: 'bounds-upper-speed',
    skill_ids: ['upper_and_lower_bounds', 'compound_units'],
    difficulty: 5,
    calculator: 'calc',
    question_template:
      `<p>A car travels <strong>{{d}} km</strong>, measured to the nearest kilometre.</p>` +
      `<p>The journey takes <strong>{{w}}.{{z}} hours</strong>, measured to the nearest 0.1 of an hour.</p>` +
      `<p>Work out the <strong>upper bound</strong> of the car's average speed.</p>` +
      `<p>Give your answer in km/h, to 1 decimal place.</p>`,
    question_type: 'numeric',
    parameters: {
      d: { type: 'integer', min: 60, max: 120 },
      w: { type: 'integer', min: 1, max: 2 },
      z: { type: 'integer', min: 1, max: 9 },
    },
    answer_template: `{{round((d + 0.5) / (w + z/10 - 0.05), 1)}} km/h`,
    answer_type: 'numeric',
    tolerance: 0.05,
    explanation:
      `Speed = distance ÷ time. For the UPPER bound of the speed, use the biggest possible distance and the SMALLEST possible time.<br>` +
      `Distance: {{d}} km to the nearest km → upper bound {{d + 0.5}} km.<br>` +
      `Time: {{w}}.{{z}} hours to the nearest 0.1 → lower bound {{round(w + z/10 - 0.05, 2)}} hours.<br>` +
      `Upper bound of speed = {{d + 0.5}} ÷ {{round(w + z/10 - 0.05, 2)}} = <strong>{{round((d + 0.5) / (w + z/10 - 0.05), 1)}} km/h</strong>.`,
    traps: [
      {
        answer_template: `{{round(d / (w + z/10), 1)}}`,
        response: `You used the measured values. Each measurement has a range: the distance could be as much as {{d + 0.5}} km and the time as little as {{round(w + z/10 - 0.05, 2)}} hours — use those bounds for the fastest possible speed.`,
      },
      {
        answer_template: `{{round((d + 0.5) / (w + z/10 + 0.05), 1)}}`,
        response: `You used the UPPER bound of the time. Dividing by a bigger time gives a SLOWER speed — for the fastest possible speed, divide by the SMALLEST possible time: {{round(w + z/10 - 0.05, 2)}} hours.`,
      },
      {
        answer_template: `{{round((d - 0.5) / (w + z/10 + 0.05), 1)}}`,
        response: `That is the LOWER bound of the speed. For the UPPER bound use the biggest possible distance ({{d + 0.5}} km) and the smallest possible time ({{round(w + z/10 - 0.05, 2)}} hours).`,
      },
    ],
  },
]

// ── Verification: enumerate the FULL parameter space of each draft ────────────
function* paramSpace(params: Draft['parameters']): Generator<Record<string, number>> {
  const names = Object.keys(params)
  function* rec(i: number, acc: Record<string, number>): Generator<Record<string, number>> {
    if (i === names.length) { yield { ...acc }; return }
    const p = params[names[i]]
    for (let v = p.min; v <= p.max; v++) { acc[names[i]] = v; yield* rec(i + 1, acc) }
  }
  yield* rec(0, {})
}

const BAD = /\[error|undefined|NaN/

function verify(): boolean {
  let ok = true
  for (const q of drafts) {
    let combos = 0
    const seenAnswers = new Set<string>()
    for (const vals of paramSpace(q.parameters)) {
      combos++
      const fail = (what: string, out: string) => {
        console.error(`✗ ${q.name} ${JSON.stringify(vals)} ${what}: ${out.slice(0, 160)}`)
        ok = false
      }
      const stem = evaluateTemplate(q.question_template, vals)
      if (BAD.test(stem)) fail('stem', stem)
      const ans = evaluateTemplate(q.answer_template, vals)
      if (BAD.test(ans) || !ans.trim()) fail('answer', ans)
      seenAnswers.add(ans)
      const expl = evaluateTemplate(q.explanation, vals)
      if (BAD.test(expl)) fail('explanation', expl)

      // canonical answer must grade correct against itself
      if (!checkAnswer(ans, ans, q.answer_type, q.tolerance, [], false).correct) fail('self-grade', ans)

      // extra accepted input forms (e.g. spaced surds) must grade correct
      for (const probe of q.acceptProbes?.(vals) ?? []) {
        if (!checkAnswer(probe, ans, q.answer_type, q.tolerance, [], false).correct) fail(`probe "${probe}" vs`, ans)
      }

      for (const t of q.traps) {
        const ta = evaluateTemplate(t.answer_template, vals)
        if (BAD.test(ta) || !ta.trim()) fail('trap render', ta)
        const tr = evaluateTemplate(t.response, vals)
        if (BAD.test(tr)) fail('trap response', tr)
        if (checkAnswer(ta, ans, q.answer_type, q.tolerance, [], false).correct) fail(`TRAP COLLIDES "${ta}" with answer`, ans)
      }
    }
    console.log(`✓ ${q.name}: ${combos} parameter combinations verified, ${seenAnswers.size} distinct answers`)
  }
  return ok
}

async function main() {
  if (!verify()) { console.error('\nverification FAILED — nothing inserted'); process.exit(1) }

  // Sample render of each (eyeball aid)
  for (const q of drafts) {
    const vals: Record<string, number> = {}
    for (const [k, p] of Object.entries(q.parameters)) vals[k] = p.min
    console.log(`\n── ${q.name} ──`)
    console.log('STEM:', evaluateTemplate(q.question_template, vals).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    console.log('ANSWER:', evaluateTemplate(q.answer_template, vals))
  }

  if (process.argv.includes('--dry-run')) { console.log('\ndry run — nothing inserted'); return }

  const rows = drafts.map(q => ({
    skill_ids: q.skill_ids,
    difficulty: q.difficulty,
    question_template: q.question_template,
    question_type: q.question_type,
    parameters: q.parameters,
    answer_template: q.answer_template,
    answer_type: q.answer_type,
    tolerance: q.tolerance,
    traps: q.traps,
    explanation: q.explanation,
    image: false,
    calculator: q.calculator,
    kind: 'exam',
    requires_simplest: false,
    is_published: false, // drafts — user reviews & publishes
  }))
  const { data, error } = await supabase.from('questions').insert(rows).select('id')
  if (error) { console.error('insert failed:', error); process.exit(1) }
  console.log('\nInserted as DRAFTS (is_published=false):')
  data!.forEach((r, i) => console.log(`  ${drafts[i].name}: ${r.id}`))
}

main()
