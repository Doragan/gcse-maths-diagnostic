import './env'
import { createClient } from '@supabase/supabase-js'
import { generateValues, renderMultiPartQuestion } from '../lib/questions/paramEngine'
import { checkMultiBlank, type BlankCheck } from '../lib/questions/multiBlank'

// 60fd2421 (two-way table): add errors-carried-forward formulas to the three
// blanks whose value depends on another blank, so a student who mis-totals
// early still earns the method marks for the steps they do consistently.
//
//   F (Walk total)   ← given values only, no ECF
//   A = F - d        ← depends on F
//   B = Y7total - A - c
//   C = Cycletotal - B
//
// D and E also come from given values only, so they get no ECF either.

const PREFIX = '60fd2421'

const ECF: Record<string, string> = {
  A: '[[F]] - {{d}}',
  B: '{{a+b+c}} - [[A]] - {{c}}',
  C: '{{b+e}} - [[B]]',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('id, parameters, parts')
  if (error) throw error
  const q = (data ?? []).find(r => r.id.startsWith(PREFIX))
  if (!q) throw new Error(`no question starting ${PREFIX}`)

  const parts = JSON.parse(JSON.stringify(q.parts))
  const blanks = parts[0].blanks as any[]
  for (const b of blanks) {
    if (ECF[b.label]) b.ecf_template = ECF[b.label]
  }

  // Prove the formulas before writing: over many value sets, a student who gets
  // F wrong by some delta and then works consistently must earn A, B and C.
  let checked = 0
  for (let i = 0; i < 300; i++) {
    const v = generateValues(q.parameters as any)
    const r = renderMultiPartQuestion('', [{ ...parts[0], blanks }] as any, q.parameters as any, v)
    const rb = r.parts[0].blanks!
    const byLabel = Object.fromEntries(rb.map(b => [b.label, b]))
    const delta = 3 // the student's F is 3 too big
    const fWrong = Number(byLabel.F.answer) + delta
    // Consistent working from that wrong F:
    const aWrong = fWrong - v.d
    const bWrong = (v.a + v.b + v.c) - aWrong - v.c
    const cWrong = (v.b + v.e) - bWrong
    const students: Record<string, string> = {
      A: String(aWrong), B: String(bWrong), C: String(cWrong),
      D: byLabel.D.answer, E: byLabel.E.answer, F: String(fWrong),
    }
    const res = checkMultiBlank(rb.map((b): BlankCheck => ({
      label: b.label,
      student: students[b.label],
      answer: b.answer,
      answer_type: 'numeric',
      tolerance: 0,
      requires_simplest: false,
      traps: b.traps,
      ecf: b.ecf,
    })))
    const get = (l: string) => res.blanks.find(b => b.label === l)!
    for (const l of ['A', 'B', 'C']) {
      const r2 = get(l)
      if (!r2.correct || !r2.followThrough) {
        throw new Error(`values ${JSON.stringify(v)}: blank ${l} did not follow through (${r2.message})`)
      }
    }
    if (get('F').correct) throw new Error('the seeded wrong F was marked correct')
    if (res.correct) throw new Error('part marked all-correct despite the wrong F')
    checked++
  }
  console.log(`ECF verified on ${checked} value sets (F wrong → A, B, C follow through; F stays wrong).`)

  const { error: upErr } = await supabase.from('questions').update({ parts }).eq('id', q.id)
  if (upErr) throw upErr
  console.log(`Updated ${q.id}: ECF added to A, B, C.`)
}

main().catch(e => { console.error(e); process.exit(1) })
