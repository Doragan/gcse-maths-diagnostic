import './env'
import { createClient } from '@supabase/supabase-js'
import { generateValues, renderMultiPartQuestion } from '../lib/questions/paramEngine'
import { checkMultiBlank, type BlankCheck } from '../lib/questions/multiBlank'

// 8e8c3a24 (function_machines): B is the output = A + b, so a student who gets
// the middle value A wrong but adds b consistently still earns B's method mark
// (exam ECF). A is a first step off the given input, and C depends only on the
// given output — neither follows through from a sibling, so only B gets ECF.
const ID = '8e8c3a24-c94f-45d2-85cb-dd425ad0bc6e'
const ECF: Record<string, string> = { B: '[[A]] + {{b}}' }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, parts').eq('id', ID).single()
  if (error) throw error

  const parts = JSON.parse(JSON.stringify(data.parts))
  const blanks = parts[0].blanks as any[]
  for (const b of blanks) if (ECF[b.label]) b.ecf_template = ECF[b.label]

  // Prove it: over many draws, a student who mis-computes A (using the authored
  // "added instead of multiplied" slip, a+x) but then adds b consistently must
  // earn B as a follow-through, while A stays wrong and the part isn't all-right.
  let checked = 0
  for (let i = 0; i < 300; i++) {
    const v = generateValues(data.parameters as any)
    const r = renderMultiPartQuestion('', [parts[0]] as any, data.parameters as any, v)
    const rb = r.parts[0].blanks!
    const byLabel = Object.fromEntries(rb.map(b => [b.label, b]))
    const wrongA = v.a + v.x       // the a+x misconception, ≠ a*x for these ranges
    const followB = wrongA + v.b   // B worked consistently from the wrong A
    const students: Record<string, string> = {
      A: String(wrongA), B: String(followB), C: byLabel.C.answer,
    }
    const res = checkMultiBlank(rb.map((b): BlankCheck => ({
      label: b.label, student: students[b.label], answer: b.answer,
      answer_type: 'numeric', tolerance: 0, requires_simplest: false,
      traps: b.traps, ecf: b.ecf,
    })))
    const get = (l: string) => res.blanks.find(b => b.label === l)!
    if (v.a + v.x === v.a * v.x) continue // degenerate (a=2,x=2): skip, not a real slip
    if (!get('B').correct || !get('B').followThrough) throw new Error(`draw ${JSON.stringify(v)}: B didn't follow through (${get('B').message})`)
    if (get('A').correct) throw new Error('the wrong A was marked correct')
    if (res.correct) throw new Error('part marked all-correct despite wrong A')
    checked++
  }
  console.log(`ECF verified on ${checked} value sets (wrong A → B follows through; A stays wrong).`)

  const { error: upErr } = await supabase.from('questions').update({ parts }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: ECF added to blank B.`)
}

main().catch(e => { console.error(e); process.exit(1) })
