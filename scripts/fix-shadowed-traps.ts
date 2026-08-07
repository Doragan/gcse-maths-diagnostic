import './env'
import { createClient } from '@supabase/supabase-js'
import { renderQuestion, renderMultiPartQuestion } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'

// Fix the three SHADOWED traps the bank audit turned up. All three are in
// PUBLISHED questions, and in each the student sees a wrong explanation
// (an earlier trap catches the value first) rather than no explanation.
//
//  570e1004 (b) trap 2: (r+r)/((r+b)+(r+b)) reduces to r/(r+b) — literally
//    trap 1. The intended misconception is ADDING the branches, whose real
//    value is r/(r+b) + r/(r+b) = 2r/(r+b).
//  042fa99f trap 3: the same formula as trap 2 (s*B/A), differing only by a
//    space and a " cm" suffix that unit-stripping removes, and its message
//    describes the same misconception. Redundant — removed.
//  c0c02057 trap 2: 180 - 360/n is algebraically identical to trap 1's
//    (n-2)*180/n; both are the interior angle. Replaced with the "gave the
//    TOTAL of the exterior angles" slip (360), which is a genuinely distinct
//    and common error.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Every trap must fire ITSELF — the same probe the harness now runs. */
function assertNoShadowing(
  label: string,
  answer: string,
  traps: { answer: string; response: string }[],
  type: any, tol: number | null, simplest: boolean,
) {
  for (let i = 0; i < traps.length; i++) {
    const t = traps[i]
    if (!t.answer.trim()) continue
    const res = checkAnswer(t.answer, answer, type, tol, traps, simplest)
    if (res.correct) throw new Error(`${label}: trap ${i + 1} ("${t.answer}") equals the answer`)
    if (!res.trap) throw new Error(`${label}: trap ${i + 1} ("${t.answer}") fires nothing`)
    const fired = traps.findIndex(x => (x as unknown) === (res.trap as unknown))
    if (fired !== i) throw new Error(`${label}: trap ${i + 1} ("${t.answer}") is shadowed by trap ${fired + 1}`)
  }
  const ok = checkAnswer(answer, answer, type, tol, traps, simplest)
  if (!ok.correct) throw new Error(`${label}: the correct answer no longer grades correct`)
}

async function fixTreeDiagram() {
  const ID = '570e1004-a694-4518-b98c-60033fafa87c'
  const { data, error } = await supabase.from('questions')
    .select('question_template, parameters, parts').eq('id', ID).single()
  if (error) throw error
  const parts = JSON.parse(JSON.stringify(data.parts))
  const trap = parts[1].traps.find((t: any) => t.answer_template === '{{r+r}}/{{(r+b)+(r+b)}}')
  if (!trap) throw new Error('570e1004: broken trap not found — already fixed?')
  trap.answer_template = '{{2*r}}/{{r+b}}'
  trap.response = 'Multiply the branch probabilities, do not add them: {{r}}/{{r+b}} &times; {{r}}/{{r+b}} = {{r*r}}/{{(r+b)*(r+b)}}.'

  let n = 0
  for (let r = 2; r <= 5; r++) for (let b = 2; b <= 5; b++) {
    const v = { r, b }
    const rq = renderMultiPartQuestion(data.question_template, parts as any, data.parameters as any, v)
    const pb = rq.parts[1]
    assertNoShadowing(`570e1004 r=${r} b=${b}`, pb.answer, pb.traps, 'fraction', null, false)
    // The misconception this trap exists for must actually reach it.
    const added = `${2 * r}/${r + b}`
    const res = checkAnswer(added, pb.answer, 'fraction', null, pb.traps, false)
    if (!res.trap || !/do not add them/.test(res.trap.response)) {
      throw new Error(`570e1004 r=${r} b=${b}: adding the branches (${added}) does not fire the add trap`)
    }
    n++
  }
  const { error: e2 } = await supabase.from('questions').update({ parts }).eq('id', ID)
  if (e2) throw e2
  console.log(`570e1004: trap 2 -> {{2*r}}/{{r+b}} (verified on ${n} combos)`)
}

async function fixSineRule() {
  const ID = '042fa99f-d9e1-4528-adf6-2f3ca756ac12'
  const { data, error } = await supabase.from('questions')
    .select('question_template, parameters, answer_template, answer_type, tolerance, traps, explanation, requires_simplest')
    .eq('id', ID).single()
  if (error) throw error
  const before = (data.traps as any[]).length
  const traps = (data.traps as any[]).filter(t => !/\{\{round\(s \* B \/ A , 2\)\}\} cm/.test(t.answer_template))
  if (traps.length !== before - 1) throw new Error(`042fa99f: expected to drop exactly 1 trap, dropped ${before - traps.length}`)

  let n = 0
  for (const A of [30, 40, 50]) for (const B of [60, 70, 80]) for (let s = 6; s <= 14; s++) {
    const v = { A, B, s }
    const r = renderQuestion(data.question_template, data.answer_template, traps as any,
      data.explanation ?? '', data.parameters as any, v)
    assertNoShadowing(`042fa99f A=${A} B=${B} s=${s}`, r.answer, r.traps,
      data.answer_type, data.tolerance, data.requires_simplest ?? false)
    n++
  }
  const { error: e2 } = await supabase.from('questions').update({ traps }).eq('id', ID)
  if (e2) throw e2
  console.log(`042fa99f: removed the duplicate trap 3, ${traps.length} traps remain (verified on ${n} combos)`)
}

async function fixExteriorAngles() {
  const ID = 'c0c02057-d8d1-43d1-adf0-4ecc5ee570cf'
  const { data, error } = await supabase.from('questions')
    .select('question_template, parameters, answer_template, answer_type, tolerance, traps, explanation, requires_simplest')
    .eq('id', ID).single()
  if (error) throw error
  const traps = JSON.parse(JSON.stringify(data.traps)) as any[]
  const t2 = traps.find(t => t.answer_template === '{{180 - 360 / n}}')
  if (!t2) throw new Error('c0c02057: duplicate trap not found — already fixed?')
  t2.answer_template = '{{360}}'
  t2.response = 'That is the TOTAL of all the exterior angles. They always add up to 360&deg;, and a regular polygon has {{n}} equal ones, so each is 360&deg; &divide; {{n}} = {{360 / n}}&deg;.'

  // n: integer 3..12, factor of 360, and not 4.
  const ns = [3, 5, 6, 8, 9, 10, 12]
  for (const n of ns) {
    const v = { n }
    const r = renderQuestion(data.question_template, data.answer_template, traps as any,
      data.explanation ?? '', data.parameters as any, v)
    assertNoShadowing(`c0c02057 n=${n}`, r.answer, r.traps,
      data.answer_type, data.tolerance, data.requires_simplest ?? false)
    const res = checkAnswer('360', r.answer, data.answer_type as any, data.tolerance, r.traps, data.requires_simplest ?? false)
    if (!res.trap || !/TOTAL of all the exterior angles/.test(res.trap.response)) {
      throw new Error(`c0c02057 n=${n}: answering 360 does not fire the total trap`)
    }
  }
  const { error: e2 } = await supabase.from('questions').update({ traps }).eq('id', ID)
  if (e2) throw e2
  console.log(`c0c02057: trap 2 -> {{360}} (verified on ${ns.length} combos)`)
}

async function main() {
  await fixTreeDiagram()
  await fixSineRule()
  await fixExteriorAngles()
  console.log('\nAll three shadowed traps fixed.')
}

main().catch(e => { console.error(e); process.exit(1) })
