import './env'
import { createClient } from '@supabase/supabase-js'
import { generateValues, satisfiesAllConstraints } from '../lib/questions/paramEngine'

// The 11 published questions failing `verify-question.ts --published`.
//
// Nine are trap-answer COLLISIONS: on some draws a wrong method produces the
// correct value, so a student reasoning badly is marked right. Each is closed
// by the constraint the harness itself named. Constraints are appended to the
// PLURAL `constraints` array, which paramEngine treats as additive to any
// existing singular `constraint`, so nothing already there is disturbed.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type C = { type: string; target: number; target_type: 'value' }
const neq = (n: number): C => ({ type: 'neq', target: n, target_type: 'value' })

const CONSTRAINTS: [string, string, string, C][] = [
  // id, param, why, constraint
  ['463e9833-bc0a-40d9-bc40-941de561a0cc', 'a', 'a=1 makes "a/b of c" equal c/b — the just-divided trap', neq(1)],
  ['5582125e-cfaa-4e4b-8dd9-421c735700c3', 'a', 'a=1 makes (x+1)(x+b) match the (x+ab)(x+1) trap commutatively', neq(1)],
  ['73af9feb-7a76-4526-906a-bd7ba5bfec01', 'r', 'r=2 makes area πr² equal circumference 2πr', neq(2)],
  ['1c438666-4afa-4ceb-8c1d-219a6c0b6d83', 'r', 'r=2 makes circumference 2πr equal area πr²', neq(2)],
  ['f6bf5e77-4a02-46cc-986d-f2f17d75ceae', 'n', 'n=1 makes n*100/d equal the 100/d trap', neq(1)],
  ['95790f96-a9fb-4ca0-ba1f-c9d9c80508aa', 'a', 'a=100 makes a increased by b% equal a+b', neq(100)],
  ['3a2a4da5-2798-45a2-9386-7449f4f7139a', 'a', 'a=100 makes a decreased by b% equal a-b', neq(100)],
  ['6b4ccd3d-19ba-40c0-97a4-4fd69c779476', 'l', 'l=6,w=3 makes area l*w equal perimeter 2(l+w)', neq(6)],
]

async function applyConstraints() {
  for (const [id, key, why, c] of CONSTRAINTS) {
    const { data, error } = await supabase.from('questions').select('parameters').eq('id', id).single()
    if (error) throw error
    const params = JSON.parse(JSON.stringify(data.parameters))
    if (!params[key]) throw new Error(`${id}: no parameter "${key}"`)
    const list = params[key].constraints ?? []
    if (list.some((x: any) => x.type === c.type && Number(x.target) === c.target && x.target_type === c.target_type)) {
      console.log(`  ${id.slice(0, 8)} ${key}: already constrained — skipping`); continue
    }
    params[key].constraints = [...list, c]

    // The bearings bug in this same batch was an unsatisfiable constraint that
    // silently voided itself, so never add one without proving draws survive.
    let ok = 0
    for (let i = 0; i < 300; i++) {
      const v = generateValues(params)
      if (satisfiesAllConstraints(params, v)) ok++
    }
    if (ok === 0) throw new Error(`${id}: adding ${JSON.stringify(c)} to "${key}" leaves no valid draws`)

    const { error: e2 } = await supabase.from('questions').update({ parameters: params }).eq('id', id)
    if (e2) throw e2
    console.log(`  ${id.slice(0, 8)} ${key} ${c.type} ${c.target}  (${ok}/300 draws valid) — ${why}`)
  }
}

// The remaining three are not collisions.
async function fixIndices() {
  // 5636b618: the "{{a*a}}" trap reads "You've squared instead of cubing",
  // which is only a MISTAKE when b=3 — at b=2 it is the correct method, so
  // the trap equals the answer. The harness suggests b != 2, but this is the
  // bank's only "calculate a^b" question (the other indices row is
  // substitution), and that would drop squares from the skill entirely.
  // Removing the trap keeps both powers; the more important indices
  // misconception, a*b, is already trapped and unaffected.
  const ID = '5636b618-8d68-4eaa-a290-9eb94d4c4376'
  const { data, error } = await supabase.from('questions').select('traps').eq('id', ID).single()
  if (error) throw error
  const traps = (data.traps as any[]).filter(t => t.answer_template !== '{{a*a}}')
  if (traps.length !== (data.traps as any[]).length - 1) throw new Error('5636b618: expected to drop exactly one trap')
  const { error: e2 } = await supabase.from('questions').update({ traps }).eq('id', ID)
  if (e2) throw e2
  console.log(`  5636b618 removed the "{{a*a}}" trap — ${traps.length} trap(s) remain (squares AND cubes kept)`)
}

async function fixAngles() {
  // 27b7a061: "{{180 - a}}" is present TWICE, verbatim.
  const ID = '27b7a061-047d-49f8-b174-220d8bf83b03'
  const { data, error } = await supabase.from('questions').select('traps').eq('id', ID).single()
  if (error) throw error
  const seen = new Set<string>()
  const traps = (data.traps as any[]).filter(t => {
    if (seen.has(t.answer_template)) return false
    seen.add(t.answer_template); return true
  })
  if (traps.length !== (data.traps as any[]).length - 1) throw new Error('27b7a061: expected to drop exactly one duplicate')
  const { error: e2 } = await supabase.from('questions').update({ traps }).eq('id', ID)
  if (e2) throw e2
  console.log(`  27b7a061 removed the duplicate "{{180 - a}}" trap — ${traps.length} traps remain`)
}

async function fixBearings() {
  // f042df39: target_type "parameter" with target "10" makes the engine look
  // up a PARAMETER named "10". It doesn't exist, so satisfiesAllConstraints
  // rejected every draw (the harness saw 0 value sets and checked nothing at
  // all), while generateValues quietly gave up and emitted non-multiples of
  // 10. Live students got working but untidy bearings like 137 degrees.
  const ID = 'f042df39-df6c-45c7-8873-684be849148c'
  const { data, error } = await supabase.from('questions').select('parameters').eq('id', ID).single()
  if (error) throw error
  const params = JSON.parse(JSON.stringify(data.parameters))
  const c = params.a?.constraint
  if (!c || c.type !== 'multiple_of') throw new Error('f042df39: expected a multiple_of constraint on "a"')
  params.a.constraint = { type: 'multiple_of', target: 10, target_type: 'value' }

  let ok = 0
  for (let i = 0; i < 300; i++) {
    const v = generateValues(params)
    if (v.a % 10 === 0 && satisfiesAllConstraints(params, v)) ok++
  }
  if (ok < 300) throw new Error(`f042df39: only ${ok}/300 draws are valid multiples of 10`)
  const { error: e2 } = await supabase.from('questions').update({ parameters: params }).eq('id', ID)
  if (e2) throw e2
  console.log(`  f042df39 constraint -> target_type "value" (${ok}/300 draws now valid multiples of 10)`)
}

async function main() {
  console.log('trap/answer collisions — adding the constraint the harness named:')
  await applyConstraints()
  console.log('\nother failures:')
  await fixIndices()
  await fixAngles()
  await fixBearings()
  console.log('\nDone. Re-run: npx tsx scripts/verify-question.ts --published')
}

main().catch(e => { console.error(e); process.exit(1) })
