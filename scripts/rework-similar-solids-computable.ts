import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// badfd8eb (congruence_and_similarity + compound_units): the original gave two
// unspecified "ornaments" — a height and a mass, no shape. With nothing
// computable, mass ∝ length³ wasn't one available route, it was the ONLY
// route, forcing the student to assert the cube rule from first principles.
//
// The coded 2024 papers don't work that way: every comparable question is
// `multi_route` and hands the student a shape they can actually compute with
// (NOV24-H-P2 Q19 routes through "M1 area scale + M1dep area + cost per area";
// JUN24-H-P2 Q25 starts from "M1 volume expr"). The scale-factor rule is the
// efficient shortcut over a concrete route, not a required leap.
//
// Rework: A is a CUBOID with stated dimensions and mass; B is similar with a
// stated height. Now a student can find the density, scale each edge, compute
// B's volume and multiply — or take the n³ shortcut. Both reach the same
// answer, which is the point.
const ID = 'badfd8eb-5fe8-43d3-af66-3b652c21d82c'

const STEM =
  '<p>Two solid blocks, <strong>A</strong> and <strong>B</strong>, are mathematically similar and are made of the same material.</p>'
  + '<p>Block <strong>A</strong> is a cuboid with a base measuring <strong>{{a}} cm</strong> by <strong>{{b}} cm</strong>, and a height of <strong>{{c}} cm</strong>. Its mass is <strong>{{d*a*b*c}} g</strong>.</p>'
  + '<p>Block <strong>B</strong> has a height of <strong>{{n*c}} cm</strong>.</p>'
  + '<p>Work out the mass of block <strong>B</strong>.</p>'

const PARAMS = {
  a: { type: 'integer', min: 2, max: 5 },
  b: { type: 'integer', min: 2, max: 5 },
  c: { type: 'integer', min: 3, max: 6 },
  // Length scale factor. n >= 2 keeps the four values below strictly ordered,
  // which is what makes the traps provably collision-free.
  n: { type: 'integer', min: 2, max: 3 },
  // Density in g/cm³. An integer so the CONCRETE route (mass ÷ volume) stays
  // clean — if density were ugly, the route this rework exists to open up
  // would be unusable in practice.
  d: { type: 'integer', min: 2, max: 5 },
}

const ANSWER = '{{d*a*b*c*Math.pow(n,3)}} g'

const TRAPS = [
  {
    // Scaled the mass by the LENGTH scale factor.
    answer_template: '{{d*a*b*c*n}}',
    response: 'You scaled the mass by the LENGTH scale factor. Mass depends on VOLUME here, and every one of the three dimensions grows by {{n}}: block B measures {{n*a}} cm by {{n*b}} cm by {{n*c}} cm, so its volume is {{n}}³ = {{Math.pow(n,3)}} times block A&apos;s. The mass is {{d*a*b*c}} &times; {{Math.pow(n,3)}} = {{d*a*b*c*Math.pow(n,3)}} g.',
  },
  {
    // Scaled by the AREA scale factor (n²) instead of the volume one (n³).
    answer_template: '{{d*a*b*c*n*n}}',
    response: 'You used {{n}}² = {{n*n}}, which is the AREA scale factor — that would be right for a surface area, but mass depends on VOLUME. All three dimensions scale, so the volume scale factor is {{n}}³ = {{Math.pow(n,3)}}: {{d*a*b*c}} &times; {{Math.pow(n,3)}} = {{d*a*b*c*Math.pow(n,3)}} g.',
  },
  {
    // Gave block A's mass back — answered the wrong quantity.
    answer_template: '{{d*a*b*c}}',
    response: 'That is the mass of block <strong>A</strong>. Block B is {{n}} times longer in every direction, so its volume — and therefore its mass — is {{n}}³ = {{Math.pow(n,3)}} times as big: {{d*a*b*c}} &times; {{Math.pow(n,3)}} = {{d*a*b*c*Math.pow(n,3)}} g.',
  },
]

// Concrete route first (what the mark schemes actually reward), shortcut second.
const EXPLANATION =
  'Volume of A = {{a}} &times; {{b}} &times; {{c}} = {{a*b*c}} cm³.<br>'
  + 'Density = mass &divide; volume = {{d*a*b*c}} &divide; {{a*b*c}} = {{d}} g/cm³.<br>'
  + 'The length scale factor is {{n*c}} &divide; {{c}} = {{n}}, so B measures {{n*a}} cm by {{n*b}} cm by {{n*c}} cm.<br>'
  + 'Volume of B = {{n*a}} &times; {{n*b}} &times; {{n*c}} = {{a*b*c*Math.pow(n,3)}} cm³.<br>'
  + 'Same material, so the same density: mass of B = {{d}} &times; {{a*b*c*Math.pow(n,3)}} = <strong>{{d*a*b*c*Math.pow(n,3)}} g</strong>.<br>'
  + '<em>Shortcut:</em> every length scales by {{n}}, so the volume — and the mass — scales by {{n}}³ = {{Math.pow(n,3)}}: {{d*a*b*c}} &times; {{Math.pow(n,3)}} = <strong>{{d*a*b*c*Math.pow(n,3)}} g</strong>.'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  let combos = 0
  for (let a = 2; a <= 5; a++) for (let b = 2; b <= 5; b++) for (let c = 3; c <= 6; c++) {
    for (let n = 2; n <= 3; n++) for (let d = 2; d <= 5; d++) {
      const v = { a, b, c, n, d }
      const stem = evaluateTemplate(STEM, v)
      const expl = evaluateTemplate(EXPLANATION, v)
      if (/\[error|\{\{/.test(stem)) throw new Error(`${JSON.stringify(v)}: stem render error`)
      if (/\[error|\{\{/.test(expl)) throw new Error(`${JSON.stringify(v)}: explanation render error`)

      const answer = evaluateTemplate(ANSWER, v)
      const trapVals = TRAPS.map(t => evaluateTemplate(t.answer_template, v))
      const all = [answer.replace(/ g$/, ''), ...trapVals]
      if (all.some(x => /\[error|NaN/.test(x))) throw new Error(`${JSON.stringify(v)}: eval error [${all}]`)
      if (new Set(all).size !== all.length) throw new Error(`${JSON.stringify(v)}: value collision [${all}]`)
      for (const t of TRAPS) {
        const resp = evaluateTemplate(t.response, v)
        if (/\[error|\{\{/.test(resp)) throw new Error(`${JSON.stringify(v)}: trap response render error`)
      }

      // BOTH routes must land on the same number — that equivalence is the
      // entire point of the rework, so assert it rather than assume it.
      const concrete = d * (n * a) * (n * b) * (n * c)
      const shortcut = d * a * b * c * Math.pow(n, 3)
      if (concrete !== shortcut) throw new Error(`${JSON.stringify(v)}: routes disagree (${concrete} vs ${shortcut})`)
      if (Number(all[0]) !== concrete) throw new Error(`${JSON.stringify(v)}: answer != concrete route`)

      // No visible number may coincide confusingly with another (the defect
      // caught on 4325c702). Shown: a, b, c, mass of A, height of B.
      const mass1 = d * a * b * c
      const hB = n * c
      if (mass1 === hB) throw new Error(`${JSON.stringify(v)}: A's mass equals B's height (${mass1})`)
      if (hB === a || hB === b || hB === c) throw new Error(`${JSON.stringify(v)}: B's height collides with an A dimension (${hB})`)

      combos++
    }
  }
  console.log(`verified across all ${combos} (a,b,c,n,d) combos:`)
  console.log('  renders clean · answer and 3 traps pairwise distinct · concrete and shortcut routes agree · no confusing visible-value collisions')

  const { error } = await supabase.from('questions').update({
    question_template: STEM,
    parameters: PARAMS,
    answer_template: ANSWER,
    traps: TRAPS,
    explanation: EXPLANATION,
  }).eq('id', ID)
  if (error) throw error
  console.log(`Updated ${ID}: similar CUBOIDS with a computable concrete route (density + scaled edges).`)
}

main().catch(e => { console.error(e); process.exit(1) })
