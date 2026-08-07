import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate, generateValues } from '../lib/questions/paramEngine'

// badfd8eb: two fixes.
//
// 1. The parameter ranges (a,b in [2,5], c in [3,6]) allowed a = b = c, which
//    makes the "cuboid" a CUBE — the base-by-height description then reads
//    oddly and the shape is degenerate for a similarity question. A cube
//    requires all three equal, so a single `c != a` constraint rules it out
//    entirely: if c can never equal a, then a = b = c is unreachable. Square
//    BASES (a = b) and height-matches-one-base-edge (c = b) are left alone —
//    both are perfectly ordinary cuboids.
//
// 2. Difficulty 5 -> 4. Giving the question a concrete computable route (the
//    previous rework) genuinely lowered the demand: the cube rule is now a
//    shortcut rather than a required abstract leap.
const ID = 'badfd8eb-5fe8-43d3-af66-3b652c21d82c'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions')
    .select('parameters, question_template, answer_template, traps, explanation, difficulty')
    .eq('id', ID).single()
  if (error) throw error

  const params = JSON.parse(JSON.stringify(data.parameters))
  if (params.c.constraint) throw new Error(`c already constrained: ${JSON.stringify(params.c.constraint)}`)
  params.c.constraint = { type: 'neq', target: 'a', target_type: 'parameter' }

  // Re-verify every invariant over the CONSTRAINED space (constraining only
  // removes combos, but the cube check is new so the whole set is re-run).
  let combos = 0
  let squareBases = 0
  for (let a = 2; a <= 5; a++) for (let b = 2; b <= 5; b++) for (let c = 3; c <= 6; c++) {
    if (c === a) continue // the new constraint
    for (let n = 2; n <= 3; n++) for (let d = 2; d <= 5; d++) {
      const v = { a, b, c, n, d }

      // The fix itself: never a cube.
      if (a === b && b === c) throw new Error(`${JSON.stringify(v)}: still a cube`)
      if (a === b) squareBases++

      const stem = evaluateTemplate(data.question_template, v)
      const expl = evaluateTemplate(data.explanation!, v)
      if (/\[error|\{\{/.test(stem)) throw new Error(`${JSON.stringify(v)}: stem render error`)
      if (/\[error|\{\{/.test(expl)) throw new Error(`${JSON.stringify(v)}: explanation render error`)

      const answer = evaluateTemplate(data.answer_template, v).replace(/ g$/, '')
      const trapVals = (data.traps as any[]).map(t => evaluateTemplate(t.answer_template, v))
      const all = [answer, ...trapVals]
      if (all.some(x => /\[error|NaN/.test(x))) throw new Error(`${JSON.stringify(v)}: eval error [${all}]`)
      if (new Set(all).size !== all.length) throw new Error(`${JSON.stringify(v)}: value collision [${all}]`)

      // Both routes still agree, and still no confusing visible collisions.
      const concrete = d * (n * a) * (n * b) * (n * c)
      if (Number(answer) !== concrete) throw new Error(`${JSON.stringify(v)}: answer != concrete route`)
      const mass1 = d * a * b * c
      const hB = n * c
      if (mass1 === hB) throw new Error(`${JSON.stringify(v)}: A's mass equals B's height`)
      if (hB === a || hB === b || hB === c) throw new Error(`${JSON.stringify(v)}: B's height collides with an A dimension`)

      combos++
    }
  }
  console.log(`verified across all ${combos} constrained combos: never a cube, renders clean,`)
  console.log(`  traps distinct, routes agree, no visible collisions (${squareBases} keep a square base, which is fine).`)

  // The constraint must actually hold at generation time, not just on paper.
  for (let i = 0; i < 500; i++) {
    const v = generateValues(params as any)
    if (v.c === v.a) throw new Error(`generateValues produced c === a: ${JSON.stringify(v)}`)
    if (v.a === v.b && v.b === v.c) throw new Error(`generateValues produced a cube: ${JSON.stringify(v)}`)
  }
  console.log('500 draws: generateValues never produces a cube.')

  const { error: upErr } = await supabase.from('questions')
    .update({ parameters: params, difficulty: 4 }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: cube ruled out (c != a), difficulty ${data.difficulty} -> 4.`)
}

main().catch(e => { console.error(e); process.exit(1) })
